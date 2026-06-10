import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ CRITICAL ERROR: Environment variable ${varName} is missing.`);
    process.exit(1);
  }
});

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  JWT_SECRET: process.env.JWT_SECRET as string,
  DB: {
    HOST: process.env.DB_HOST as string,
    USER: process.env.DB_USER as string,
    PASSWORD: process.env.DB_PASSWORD as string,
    NAME: process.env.DB_NAME as string,
    PORT: parseInt(process.env.DB_PORT as string)
  },
  IS_PROD: process.env.NODE_ENV === 'production',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
  DEV_EMAIL: process.env.DEV_EMAIL,
  DEV_PASSWORD: process.env.DEV_PASSWORD,
  INBOUND_EMAIL_DOMAIN: process.env.INBOUND_EMAIL_DOMAIN || 'inbound.gestifique.com.br',
  INBOUND_EMAIL_PREFIX: process.env.INBOUND_EMAIL_PREFIX || 'canal',
  IMAP: {
    HOST: process.env.IMAP_HOST as string,
    PORT: parseInt(process.env.IMAP_PORT || '993'),
    USER: process.env.IMAP_USER as string,
    PASS: process.env.IMAP_PASS as string,
  },
  SMTP: {
    HOST: process.env.SMTP_HOST as string,
    PORT: parseInt(process.env.SMTP_PORT || '587'),
    USER: process.env.SMTP_USER as string,
    PASS: process.env.SMTP_PASS as string,
    FROM: process.env.MAIL_FROM || '"Gestifique" <suporte@gestifique.com>',
  },
  // Scaling & Features
  ENABLE_WEB_SERVER: process.env.ENABLE_WEB_SERVER !== 'false',
  ENABLE_EMAIL_LISTENER: process.env.ENABLE_EMAIL_LISTENER === 'true', // Default false to be safe
  ENABLE_TICKET_JOBS: process.env.ENABLE_TICKET_JOBS !== 'false',
  
  // Proxy configuration for express-rate-limit compatibility (Hostinger/Nginx/Cloudflare)
  TRUST_PROXY: (() => {
    const val = process.env.TRUST_PROXY;
    if (val === undefined || val === '' || val === 'false' || val === '0') return false;
    if (val === 'true') return true;
    const num = parseInt(val, 10);
    return isNaN(num) ? val : num;
  })(),

  STORAGE_TYPE: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3' | 'gcs',
  STORAGE_CONFIG: {
    LOCAL_PATH: process.env.UPLOAD_DIR || 'uploads/tickets',
    // Reserved for future use
    BUCKET_NAME: process.env.STORAGE_BUCKET_NAME,
    REGION: process.env.STORAGE_REGION,
    ENDPOINT: process.env.STORAGE_ENDPOINT,
  },

  // Gmail OAuth send (Fase 1) — optional until OAuth routes are enabled
  FRONTEND_URL: process.env.FRONTEND_URL,
  GOOGLE_OAUTH: {
    CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  },
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
};
