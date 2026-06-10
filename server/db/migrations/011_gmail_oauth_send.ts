import { PoolConnection } from 'mysql2/promise';

async function columnExists(connection: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows]: any = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
    AND COLUMN_NAME = ?
  `, [table, column]);
  return rows.length > 0;
}

export async function up(connection: PoolConnection) {
  const table = 'empresa_email_canais';

  if (!(await columnExists(connection, table, 'send_provider'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN send_provider ENUM('smtp_global', 'gmail_oauth') NOT NULL DEFAULT 'smtp_global'
      AFTER verified_at
    `);
  }

  if (!(await columnExists(connection, table, 'send_status'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN send_status ENUM('disconnected', 'connected', 'expired', 'error') NOT NULL DEFAULT 'disconnected'
      AFTER send_provider
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_provider'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_provider VARCHAR(32) NULL AFTER send_status
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_email'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_email VARCHAR(255) NULL AFTER oauth_provider
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_scopes'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_scopes TEXT NULL AFTER oauth_email
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_access_token_enc'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_access_token_enc TEXT NULL AFTER oauth_scopes
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_refresh_token_enc'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_refresh_token_enc TEXT NULL AFTER oauth_access_token_enc
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_token_expires_at'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_token_expires_at DATETIME NULL AFTER oauth_refresh_token_enc
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_connected_at'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_connected_at DATETIME NULL AFTER oauth_token_expires_at
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_connected_by_user_id'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_connected_by_user_id INT NULL AFTER oauth_connected_at
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_last_refresh_at'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_last_refresh_at DATETIME NULL AFTER oauth_connected_by_user_id
    `);
  }

  if (!(await columnExists(connection, table, 'oauth_last_error'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN oauth_last_error TEXT NULL AFTER oauth_last_refresh_at
    `);
  }

  if (!(await columnExists(connection, table, 'send_last_at'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN send_last_at DATETIME NULL AFTER oauth_last_error
    `);
  }

  if (!(await columnExists(connection, table, 'send_last_test_at'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN send_last_test_at DATETIME NULL AFTER send_last_at
    `);
  }

  if (!(await columnExists(connection, table, 'send_last_test_result'))) {
    await connection.query(`
      ALTER TABLE empresa_email_canais
      ADD COLUMN send_last_test_result ENUM('ok', 'fail') NULL AFTER send_last_test_at
    `);
  }
}
