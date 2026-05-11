import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendPasswordRecoveryEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || '"Gestifique" <suporte@gestifique.com>',
    to: email,
    subject: 'Recuperação de Senha - Gestifique',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Recuperação de Senha</h2>
        </div>
        <div style="padding: 32px; color: #334155;">
          <p style="font-size: 16px;">Você solicitou a redefinição de sua senha. Use o código abaixo para criar uma nova senha:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${token}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">Este código é válido por 30 minutos. Se você não solicitou esta redefinição, apenas ignore este e-mail.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Recovery email sent to ${email}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send recovery email to ${email}:`, error);
  }
};

export const sendTicketNotification = async (email: string, ticketId: number, titulo: string, mensagem: string) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || '"Gestifique" <suporte@gestifique.com>',
    replyTo: process.env.IMAP_USER || process.env.SMTP_USER || 'contato@gestifique.com.br',
    to: email,
    subject: `[Ticket #${ticketId}] ${titulo}`,
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk'
    },
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Atualização no Chamado #${ticketId}</h2>
        </div>
        <div style="padding: 32px; color: #334155;">
          <h3 style="margin-top: 0;">${titulo}</h3>
          <p style="font-size: 16px; line-height: 1.5;">${mensagem}</p>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Atenciosamente,<br>Equipe Gestifique</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Ticket notification sent to ${email}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send ticket notification to ${email}:`, error);
  }
};
