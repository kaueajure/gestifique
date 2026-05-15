import pool from './connection.js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { runMigrations } from './migration-runner.js';

async function initDB() {
  let connection;
  try {
    console.log(`[BOOT] 🔌 Tentando conectar ao banco em: ${env.DB.HOST}...`);
    connection = await pool.getConnection();
    console.log('[BOOT] ✅ Conexão estabelecida.');

    // 1. Executar Migrations (Garante estrutura atualizada)
    await runMigrations();

    // 2. Ajustes pós-migração e Limpezas (Opcional, mas mantido para integridade)
    console.log('[BOOT] 🛠️ Realizando ajustes de integridade pós-migração...');
    
    // Fallback de perfis
    await connection.query(`
      UPDATE usuarios
      SET perfil = CASE
        WHEN desenvolvedor = 1 THEN 'desenvolvedor'
        WHEN administrador = 1 THEN 'administrador'
        WHEN perfil IS NULL OR perfil = '' THEN 'atendente'
        ELSE perfil
      END
      WHERE perfil IS NULL OR perfil = '' OR desenvolvedor = 1 OR administrador = 1
    `);

    // Ajuste de nulidade em tickets (Foreign Keys)
    await connection.query('ALTER TABLE tickets MODIFY COLUMN usuario_id INT NULL');
    await connection.query('ALTER TABLE tickets MODIFY COLUMN responsavel_id INT NULL');
    await connection.query('ALTER TABLE ticket_mensagens MODIFY COLUMN usuario_id INT NULL');

    // 3. Seed Initial Developer
    const [devs]: any = await connection.query('SELECT id FROM usuarios WHERE desenvolvedor = 1 LIMIT 1');
    if (devs.length === 0) {
      if (env.DEV_EMAIL && env.DEV_PASSWORD) {
        console.log('[BOOT] 🌱 Semeando usuário desenvolvedor inicial...');
        const hashedPassword = await bcrypt.hash(env.DEV_PASSWORD, 10);
        
        await connection.query(
          'INSERT INTO usuarios (nome, email, senha_hash, cargo, administrador, desenvolvedor) VALUES (?, ?, ?, ?, ?, ?)',
          ['Desenvolvedor Master', env.DEV_EMAIL, hashedPassword, 'System Developer', 1, 1]
        );
        console.log(`[BOOT] ✅ Desenvolvedor inicial criado: ${env.DEV_EMAIL}`);
      } else {
        console.warn('[BOOT] ⚠️ DEV_EMAIL ou DEV_PASSWORD não definidos. Pulei o seed do desenvolvedor.');
      }
    }

    console.log('[BOOT] ✨ Inicialização do banco concluída com sucesso.');

  } catch (error) {
    console.error('[BOOT] ❌ Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export { initDB };
