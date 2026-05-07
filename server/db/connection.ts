import mysql from 'mysql2/promise';
import  { env } from  '../config/env.js';

const pool = mysql.createPool({
  host: env.DB.HOST,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  port: env.DB.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export default pool;
