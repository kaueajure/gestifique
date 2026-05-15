import { PoolConnection } from 'mysql2/promise';

export async function up(connection: PoolConnection) {
  // 1. Add email_channel_id to tickets
  await connection.query(`
    ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS email_channel_id INT NULL AFTER origem,
    ADD CONSTRAINT fk_tickets_email_channel FOREIGN KEY (email_channel_id) REFERENCES empresa_email_canais(id) ON DELETE SET NULL;
  `);

  // 2. Add message_id to tickets (for the original email)
  await connection.query(`
    ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS message_id VARCHAR(255) NULL AFTER email_channel_id,
    ADD INDEX idx_tickets_message_id (message_id);
  `);

  // 3. Add message_id to ticket_mensagens (for replies)
  await connection.query(`
    ALTER TABLE ticket_mensagens 
    ADD COLUMN IF NOT EXISTS message_id VARCHAR(255) NULL AFTER mensagem,
    ADD INDEX idx_mensagens_message_id (message_id);
  `);

  // 4. Create processed_emails table for deduplication
  await connection.query(`
    CREATE TABLE IF NOT EXISTS processed_emails (
      message_id VARCHAR(255) PRIMARY KEY,
      empresa_id INT NOT NULL,
      ticket_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_processed_empresa (empresa_id),
      INDEX idx_processed_ticket (ticket_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function down(connection: PoolConnection) {
  await connection.query(`DROP TABLE IF EXISTS processed_emails;`);
  
  await connection.query(`ALTER TABLE ticket_mensagens DROP COLUMN IF EXISTS message_id;`);
  
  await connection.query(`ALTER TABLE tickets DROP FOREIGN KEY IF EXISTS fk_tickets_email_channel;`);
  await connection.query(`ALTER TABLE tickets DROP COLUMN IF EXISTS email_channel_id;`);
  await connection.query(`ALTER TABLE tickets DROP COLUMN IF EXISTS message_id;`);
}
