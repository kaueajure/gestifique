import dotenv from 'dotenv';
dotenv.config();
const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT',
];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`CRITICAL ERROR: Environment variable ${varName} is missing.`);
        process.exit(1);
    }
});
// S6: validação de força do JWT_SECRET.
// Rejeita segredo vazio, curto (< 32) ou igual a valores de exemplo conhecidos.
// Em produção é fatal (aborta o boot); em desenvolvimento apenas avisa.
const IS_PROD_BOOT = process.env.NODE_ENV === 'production';
const WEAK_JWT_SECRETS = new Set([
    'mudar-isso-em-producao-com-chave-longa-e-segura',
    'secret',
    'changeme',
    'change-me',
    'jwt_secret',
    'your-secret-key',
    'supersecret',
]);
(() => {
    const secret = (process.env.JWT_SECRET || '').trim();
    const isWeak = secret.length < 32 || WEAK_JWT_SECRETS.has(secret.toLowerCase());
    if (!isWeak)
        return;
    const reason = secret.length < 32
        ? 'deve ter no mínimo 32 caracteres'
        : 'não pode ser um valor de exemplo/conhecido';
    if (IS_PROD_BOOT) {
        console.error(`CRITICAL ERROR: JWT_SECRET inseguro (${reason}). Defina um segredo forte e aleatório antes de subir em produção.`);
        process.exit(1);
    }
    else {
        console.warn(`[SECURITY] ⚠️ JWT_SECRET inseguro (${reason}). Tolerado apenas em desenvolvimento; NUNCA use assim em produção.`);
    }
})();
export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000'),
    JWT_SECRET: process.env.JWT_SECRET,
    DB: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        NAME: process.env.DB_NAME,
        PORT: parseInt(process.env.DB_PORT),
    },
    IS_PROD: process.env.NODE_ENV === 'production',
    CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    DEV_EMAIL: process.env.DEV_EMAIL,
    DEV_PASSWORD: process.env.DEV_PASSWORD,
    INBOUND_EMAIL_DOMAIN: process.env.INBOUND_EMAIL_DOMAIN || 'inbound.gestifique.com.br',
    INBOUND_EMAIL_PREFIX: process.env.INBOUND_EMAIL_PREFIX || 'canal',
    IMAP: {
        HOST: process.env.IMAP_HOST,
        PORT: parseInt(process.env.IMAP_PORT || '993'),
        USER: process.env.IMAP_USER,
        PASS: process.env.IMAP_PASS,
    },
    SMTP: {
        HOST: process.env.SMTP_HOST,
        PORT: parseInt(process.env.SMTP_PORT || '587'),
        USER: process.env.SMTP_USER,
        PASS: process.env.SMTP_PASS,
        FROM: process.env.MAIL_FROM || '"Gestifique" <suporte@gestifique.com>',
    },
    // S1: TLS de e-mail. Padrão SEGURO (valida certificado).
    // Só desative (=true) em ambiente controlado com certificado inválido/self-signed.
    MAIL_TLS_INSECURE: process.env.MAIL_TLS_INSECURE === 'true',
    // Fase 2A (escalabilidade): Redis é OPCIONAL. Sem REDIS_URL o sistema roda em
    // modo single-instance (comportamento atual). Será usado em fase futura
    // (Socket.io adapter/emitter e invalidação distribuída de cache).
    REDIS_URL: process.env.REDIS_URL,
    // Scaling & features
    ENABLE_WEB_SERVER: process.env.ENABLE_WEB_SERVER !== 'false',
    ENABLE_EMAIL_LISTENER: process.env.ENABLE_EMAIL_LISTENER === 'true',
    ENABLE_TICKET_JOBS: process.env.ENABLE_TICKET_JOBS !== 'false',
    // Proxy configuration for express-rate-limit compatibility.
    TRUST_PROXY: (() => {
        const val = process.env.TRUST_PROXY;
        if (val === undefined || val === '' || val === 'false' || val === '0')
            return false;
        if (val === 'true')
            return true;
        const num = parseInt(val, 10);
        return isNaN(num) ? val : num;
    })(),
    STORAGE_TYPE: (process.env.STORAGE_TYPE || 'local'),
    STORAGE_CONFIG: {
        LOCAL_PATH: process.env.UPLOAD_DIR || 'uploads/tickets',
        // Reserved for future use
        BUCKET_NAME: process.env.STORAGE_BUCKET_NAME,
        REGION: process.env.STORAGE_REGION,
        ENDPOINT: process.env.STORAGE_ENDPOINT,
    },
};
// S1: aviso explícito quando a validação TLS de e-mail está desativada.
if (env.MAIL_TLS_INSECURE) {
    console.warn('[SECURITY] ⚠️ MAIL_TLS_INSECURE=true: validação de certificado TLS do e-mail DESATIVADA (SMTP/IMAP). Use apenas em ambiente controlado/cert inválido. NÃO use em produção real.');
}
