import  pool from  './connection.js';
import bcrypt from 'bcryptjs';
import  { env } from  '../config/env.js';

async function initDB() {
  let connection;
  try {
    console.log(`[BOOT] 🔌 Tentando conectar ao banco em: ${env.DB.HOST}...`);
    connection = await pool.getConnection();
    console.log('[BOOT] ✅ Conexão estabelecida. Verificando estrutura das tabelas...');

    // Empresas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20) UNIQUE,
        email VARCHAR(255),
        telefone VARCHAR(20),
        logo VARCHAR(255),
        cor_principal VARCHAR(7) DEFAULT '#2563eb',
        ativo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        foto VARCHAR(255),
        cargo VARCHAR(100),
        administrador TINYINT(1) DEFAULT 0,
        desenvolvedor TINYINT(1) DEFAULT 0,
        ativo TINYINT(1) DEFAULT 1,
        ultimo_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email),
        KEY idx_emp_id (empresa_id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tickets
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        usuario_id INT NOT NULL,
        responsavel_id INT,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        status ENUM('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado') DEFAULT 'aberto',
        prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
        categoria VARCHAR(100),
        origem VARCHAR(50),
        prazo_sla DATETIME,
        finalizado_em DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tickets_empresa (empresa_id),
        KEY idx_tickets_usuario (usuario_id),
        KEY idx_tickets_responsavel (responsavel_id),
        KEY idx_tickets_status (status),
        KEY idx_tickets_prioridade (prioridade),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Mensagens
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_mensagens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        usuario_id INT NOT NULL,
        mensagem TEXT NOT NULL,
        interno TINYINT(1) DEFAULT 0,
        anexo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_mensagens_ticket (ticket_id),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Anexos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_anexos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        mensagem_id INT NULL,
        usuario_id INT NOT NULL,
        empresa_id INT NULL,
        nome_original VARCHAR(255) NOT NULL,
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho TEXT NOT NULL,
        mime_type VARCHAR(150) NOT NULL,
        tamanho_bytes INT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'arquivo',
        interno TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_ticket_anexos_ticket_id (ticket_id),
        KEY idx_ticket_anexos_mensagem_id (mensagem_id),
        KEY idx_ticket_anexos_usuario_id (usuario_id),
        KEY idx_ticket_anexos_empresa_id (empresa_id),
        KEY idx_ticket_anexos_created_at (created_at),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (mensagem_id) REFERENCES ticket_mensagens(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Logs Sistema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs_sistema (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        empresa_id INT,
        acao VARCHAR(255) NOT NULL,
        descricao TEXT,
        ip VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_logs_usuario (usuario_id),
        KEY idx_logs_empresa (empresa_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Notificacoes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        empresa_id INT NULL,
        tipo VARCHAR(80) NOT NULL,
        titulo VARCHAR(180) NOT NULL,
        mensagem TEXT NULL,
        link VARCHAR(255) NULL,
        lida TINYINT(1) DEFAULT 0,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        KEY idx_notificacoes_usuario (usuario_id),
        KEY idx_notificacoes_empresa (empresa_id),
        KEY idx_notificacoes_lida (lida),
        KEY idx_notificacoes_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[BOOT] 📚 Tabelas base validadas. Iniciando migrações de colunas...');

    // Migrações Horizontais (Garantir colunas novas em bancos antigos)
    async function ensureColumn(table: string, column: string, definition: string) {
      const [cols]: any = await connection.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
      `, [table, column]);
      
      if (cols[0].count === 0) {
        console.log(`[MIGRATE] ➕ Adicionando coluna ${column} na tabela ${table}...`);
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    }

    // Tickets Migrations
    await ensureColumn('tickets', 'prazo_sla', 'DATETIME NULL');
    await ensureColumn('tickets', 'finalizado_em', 'DATETIME NULL');
    await ensureColumn('tickets', 'origem', 'VARCHAR(50) NULL');
    await ensureColumn('tickets', 'responsavel_id', 'INT NULL');
    
    // Status enum check/update
    await connection.query(`
      ALTER TABLE tickets MODIFY status ENUM('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado') DEFAULT 'aberto'
    `);

    // Ticket Mensagens / Anexos Migrations
    await ensureColumn('ticket_mensagens', 'interno', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('ticket_mensagens', 'anexo', 'VARCHAR(255) NULL');
    await ensureColumn('logs_sistema', 'ip', 'VARCHAR(45) NULL');
    await ensureColumn('logs_sistema', 'user_agent', 'TEXT NULL');

    console.log('[BOOT] ✅ Estrutura do banco de dados atualizada.');

    // Seed Initial Developer
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

  } catch (error) {
    console.error('[BOOT] ❌ Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export { initDB };
