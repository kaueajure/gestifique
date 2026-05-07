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
    JWT_SECRET: process.env.JWT_SECRET,
    DB: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        NAME: process.env.DB_NAME,
        PORT: parseInt(process.env.DB_PORT)
    },
    IS_PROD: process.env.NODE_ENV === 'production',
    DEV_EMAIL: process.env.DEV_EMAIL,
    DEV_PASSWORD: process.env.DEV_PASSWORD
};
