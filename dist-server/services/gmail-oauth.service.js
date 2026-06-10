import crypto from 'crypto';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { emailChannelsService } from './email-channels.service.js';
import { encryptToken, decryptToken, isTokenCryptoConfigured } from '../utils/token-crypto.js';
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const OAUTH_SCOPES = [
    'openid',
    'email',
    'profile',
    GMAIL_SEND_SCOPE,
];
const STATE_TTL_MS = 10 * 60 * 1000;
function normalizeEmailAddress(value) {
    if (!value)
        return null;
    const lowered = value.toLowerCase().trim();
    const match = lowered.match(/<([^>]+)>/);
    return (match ? match[1] : lowered).trim();
}
function assertGoogleOAuthConfigured() {
    if (!env.GOOGLE_OAUTH.CLIENT_ID || !env.GOOGLE_OAUTH.CLIENT_SECRET || !env.GOOGLE_OAUTH.REDIRECT_URI) {
        throw new Error('Google OAuth não configurado. Defina GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GOOGLE_OAUTH_REDIRECT_URI.');
    }
    if (!isTokenCryptoConfigured()) {
        throw new Error('TOKEN_ENCRYPTION_KEY não configurada. Não é possível armazenar tokens OAuth com segurança.');
    }
}
function createOAuth2Client() {
    assertGoogleOAuthConfigured();
    return new google.auth.OAuth2(env.GOOGLE_OAUTH.CLIENT_ID, env.GOOGLE_OAUTH.CLIENT_SECRET, env.GOOGLE_OAUTH.REDIRECT_URI);
}
function signOAuthState(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(body)
        .digest('base64url');
    return `${body}.${signature}`;
}
function verifyOAuthState(state) {
    const [body, signature] = state.split('.');
    if (!body || !signature) {
        throw new Error('State OAuth inválido');
    }
    const expected = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(body)
        .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new Error('State OAuth inválido ou adulterado');
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
        throw new Error('State OAuth expirado. Inicie a conexão novamente.');
    }
    return payload;
}
function toBase64Url(raw) {
    return Buffer.from(raw)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
function buildRfc822Message(params) {
    const from = params.from || 'me';
    const lines = [
        `From: ${from}`,
        `To: ${params.to}`,
        `Subject: ${params.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    if (params.messageId) {
        lines.push(`Message-ID: ${params.messageId}`);
    }
    if (params.inReplyTo) {
        lines.push(`In-Reply-To: ${params.inReplyTo}`);
    }
    if (params.references?.length) {
        lines.push(`References: ${params.references.join(' ')}`);
    }
    if (params.extraHeaders) {
        for (const [key, value] of Object.entries(params.extraHeaders)) {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('', params.html);
    return lines.join('\r\n');
}
export class GmailOAuthService {
    static isConfigured() {
        return !!(env.GOOGLE_OAUTH.CLIENT_ID &&
            env.GOOGLE_OAUTH.CLIENT_SECRET &&
            env.GOOGLE_OAUTH.REDIRECT_URI &&
            isTokenCryptoConfigured());
    }
    static getAuthUrl(channelId, empresaId, userId) {
        const client = createOAuth2Client();
        const state = signOAuthState({
            channelId,
            empresaId,
            userId,
            exp: Date.now() + STATE_TTL_MS,
        });
        return client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: true,
            scope: OAUTH_SCOPES,
            state,
        });
    }
    static async handleCallback(code, state) {
        const statePayload = verifyOAuthState(state);
        const channel = await emailChannelsService.getByIdAndCompany(statePayload.channelId, statePayload.empresaId);
        if (!channel) {
            throw new Error('Canal de e-mail não encontrado para esta empresa');
        }
        const client = createOAuth2Client();
        const { tokens } = await client.getToken(code);
        if (!tokens.access_token) {
            throw new Error('Google não retornou access_token');
        }
        if (!tokens.refresh_token) {
            throw new Error('Google não retornou refresh_token. Revogue o acesso em myaccount.google.com/permissions e conecte novamente.');
        }
        client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data: userInfo } = await oauth2.userinfo.get();
        const oauthEmail = normalizeEmailAddress(userInfo.email);
        const publicEmail = normalizeEmailAddress(channel.email_publico);
        if (!oauthEmail || !publicEmail) {
            throw new Error('Não foi possível identificar o e-mail da conta Google conectada');
        }
        if (oauthEmail !== publicEmail) {
            try {
                await this.revokeToken(tokens.access_token);
            }
            catch {
                // ignore revoke failure on mismatch
            }
            throw new Error(`A conta conectada (${oauthEmail}) não corresponde ao e-mail do canal (${publicEmail}). ` +
                `Conecte exatamente a conta ${publicEmail}.`);
        }
        const expiresAt = tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000);
        await emailChannelsService.markSendConnected(statePayload.channelId, statePayload.empresaId, {
            oauthEmail,
            oauthScopes: OAUTH_SCOPES,
            accessTokenEnc: encryptToken(tokens.access_token),
            refreshTokenEnc: encryptToken(tokens.refresh_token),
            tokenExpiresAt: expiresAt,
            connectedByUserId: statePayload.userId,
        });
        await emailChannelsService.logChannelEvent(statePayload.empresaId, 'GMAIL_OAUTH_CONNECTED', `Gmail conectado para envio no canal #${statePayload.channelId} (${oauthEmail})`, statePayload.userId);
        return {
            channelId: statePayload.channelId,
            empresaId: statePayload.empresaId,
            oauthEmail,
        };
    }
    static async getValidAccessToken(channelId, empresaId) {
        const channel = await emailChannelsService.getByIdAndCompany(channelId, empresaId);
        if (!channel) {
            throw new Error('Canal de e-mail não encontrado');
        }
        if (channel.send_provider !== 'gmail_oauth' || channel.send_status !== 'connected') {
            throw new Error('Canal não possui Gmail OAuth conectado para envio');
        }
        if (!channel.oauth_access_token_enc || !channel.oauth_refresh_token_enc) {
            throw new Error('Tokens OAuth ausentes para este canal');
        }
        const expiresAt = channel.oauth_token_expires_at
            ? new Date(channel.oauth_token_expires_at).getTime()
            : 0;
        if (Date.now() < expiresAt - 5 * 60 * 1000) {
            return decryptToken(channel.oauth_access_token_enc);
        }
        return this.refreshAccessToken(channel);
    }
    static async refreshAccessToken(channel) {
        const client = createOAuth2Client();
        const refreshToken = decryptToken(channel.oauth_refresh_token_enc);
        try {
            client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await client.refreshAccessToken();
            if (!credentials.access_token) {
                throw new Error('Google não retornou novo access_token');
            }
            const expiresAt = credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : new Date(Date.now() + 3600 * 1000);
            const refreshTokenEnc = credentials.refresh_token
                ? encryptToken(credentials.refresh_token)
                : channel.oauth_refresh_token_enc;
            await emailChannelsService.updateOAuthTokens(channel.id, channel.empresa_id, {
                accessTokenEnc: encryptToken(credentials.access_token),
                refreshTokenEnc,
                tokenExpiresAt: expiresAt,
            });
            return credentials.access_token;
        }
        catch (error) {
            const message = error?.message || 'Falha ao renovar token OAuth';
            const isInvalidGrant = error?.response?.data?.error === 'invalid_grant' ||
                String(message).toLowerCase().includes('invalid_grant');
            if (isInvalidGrant) {
                await emailChannelsService.markSendExpired(channel.id, channel.empresa_id, message);
                await emailChannelsService.logChannelEvent(channel.empresa_id, 'GMAIL_OAUTH_EXPIRED', `Token OAuth expirado/revogado no canal #${channel.id}: ${message}`);
            }
            else {
                await emailChannelsService.markSendError(channel.id, channel.empresa_id, message);
            }
            throw new Error(message);
        }
    }
    static async sendEmail(channelId, empresaId, params, options) {
        try {
            const channel = await emailChannelsService.getByIdAndCompany(channelId, empresaId);
            if (!channel) {
                return { success: false, error: 'Canal não encontrado' };
            }
            const accessToken = await this.getValidAccessToken(channelId, empresaId);
            const client = createOAuth2Client();
            client.setCredentials({ access_token: accessToken });
            const gmail = google.gmail({ version: 'v1', auth: client });
            const from = params.from || channel.oauth_email || channel.email_publico;
            const raw = buildRfc822Message({ ...params, from });
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: toBase64Url(raw),
                },
            });
            await emailChannelsService.touchSend(channelId, empresaId);
            return {
                success: true,
                providerMessageId: response.data.id || undefined,
            };
        }
        catch (error) {
            const message = error?.message || 'Falha ao enviar e-mail via Gmail';
            if (options?.updateChannelError !== false) {
                await emailChannelsService.markSendError(channelId, empresaId, message);
            }
            return { success: false, error: message };
        }
    }
    static async disconnect(channelId, empresaId, userId) {
        const channel = await emailChannelsService.getByIdAndCompany(channelId, empresaId);
        if (!channel) {
            throw new Error('Canal de e-mail não encontrado');
        }
        if (channel.oauth_access_token_enc) {
            try {
                await this.revokeToken(decryptToken(channel.oauth_access_token_enc));
            }
            catch {
                // continue clearing local tokens even if revoke fails
            }
        }
        else if (channel.oauth_refresh_token_enc) {
            try {
                await this.revokeToken(decryptToken(channel.oauth_refresh_token_enc));
            }
            catch {
                // ignore
            }
        }
        await emailChannelsService.markSendDisconnected(channelId, empresaId);
        await emailChannelsService.logChannelEvent(empresaId, 'GMAIL_OAUTH_DISCONNECTED', `Gmail desconectado do canal #${channelId}`, userId);
    }
    static async sendTestEmail(channelId, empresaId, to) {
        const channel = await emailChannelsService.getByIdAndCompany(channelId, empresaId);
        if (!channel) {
            return { success: false, error: 'Canal não encontrado' };
        }
        if (channel.send_status !== 'connected') {
            return { success: false, error: 'Gmail não está conectado para envio neste canal' };
        }
        const recipient = to || channel.oauth_email || channel.email_publico;
        const token = channel.verification_token || 'teste';
        const result = await this.sendEmail(channelId, empresaId, {
            to: recipient,
            subject: `Gestifique — teste de envio #${token}`,
            html: `
        <p>Este é um e-mail de teste do Gestifique.</p>
        <p>Se você recebeu esta mensagem com remetente <strong>${channel.email_publico}</strong>, o envio via Gmail OAuth está funcionando.</p>
      `,
            text: `Teste de envio Gestifique. Token: ${token}`,
            extraHeaders: {
                'X-Gestifique-System': 'true',
                'Auto-Submitted': 'no',
            },
        });
        await emailChannelsService.updateSendTestResult(channelId, empresaId, result.success ? 'ok' : 'fail');
        return result;
    }
    static async revokeToken(token) {
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (!response.ok && response.status !== 400) {
            const text = await response.text();
            throw new Error(`Falha ao revogar token Google: ${text || response.statusText}`);
        }
    }
}
export const gmailOAuthService = GmailOAuthService;
