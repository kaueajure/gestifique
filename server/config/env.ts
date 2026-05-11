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
  }
};
