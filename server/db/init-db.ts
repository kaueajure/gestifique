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

    // Canais de e-mail por empresa
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresa_email_canais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(120) NULL,
        email_publico VARCHAR(255) NOT NULL,
        inbound_address VARCHAR(255) NOT NULL UNIQUE,
        verification_token VARCHAR(100) NOT NULL,
        status ENUM('pendente','verificado','ativo','erro') DEFAULT 'pendente',
        ultimo_erro TEXT NULL,
        last_received_at DATETIME NULL,
        verified_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_canais_empresa (empresa_id),
        KEY idx_canais_email (email_publico),
        KEY idx_canais_inbound (inbound_address),
        KEY idx_canais_status (status),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
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
        resolucao_motivo VARCHAR(100) NULL,
        resolucao_observacao TEXT NULL,
        reaberto_em DATETIME NULL,
        reaberto_por INT NULL,
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

    // Ticket Tags
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        tag VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_ticket_tags_ticket_id (ticket_id),
        KEY idx_ticket_tags_tag (tag),
        UNIQUE KEY unique_ticket_tag (ticket_id, tag),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Custom Fields
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        field_key VARCHAR(80) NOT NULL,
        field_label VARCHAR(120) NOT NULL,
        field_value TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_ticket_custom_fields_ticket_id (ticket_id),
        UNIQUE KEY unique_ticket_field (ticket_id, field_key),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Views
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        usuario_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        filtros_json JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_ticket_views_empresa_usuario (empresa_id, usuario_id),
        UNIQUE KEY unique_user_view_name (usuario_id, nome),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Macros
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_macros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        titulo VARCHAR(120) NOT NULL,
        conteudo TEXT NOT NULL,
        categoria VARCHAR(80) NULL,
        ativo TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_ticket_macros_empresa (empresa_id),
        KEY idx_ticket_macros_ativo (ativo),
        KEY idx_ticket_macros_categoria (categoria),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Leituras (Controle de não lidos)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_leituras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        usuario_id INT NOT NULL,
        last_read_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ticket_usuario (ticket_id, usuario_id),
        KEY idx_ticket_leituras_ticket (ticket_id),
        KEY idx_ticket_leituras_usuario (usuario_id),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Categorias de ticket da empresa
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresa_ticket_categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        valor VARCHAR(100) NOT NULL,
        ativo TINYINT(1) DEFAULT 1,
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_empresa_categoria (empresa_id, valor),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Serviços de ticket da empresa
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresa_ticket_servicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        valor VARCHAR(100) NOT NULL,
        ativo TINYINT(1) DEFAULT 1,
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_empresa_servico (empresa_id, valor),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela Automações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_automacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT NULL,
        evento VARCHAR(100) NOT NULL,
        condicoes_json JSON,
        acoes_json JSON,
        ativo TINYINT(1) DEFAULT 1,
        ordem INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela SLA Policies
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresa_sla_politicas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        prioridade VARCHAR(50) NULL,
        categoria VARCHAR(100) NULL,
        servico VARCHAR(100) NULL,
        tempo_primeira_resposta_minutos INT NULL,
        tempo_resolucao_minutos INT NOT NULL,
        ativo TINYINT(1) DEFAULT 1,
        ordem INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela CSAT
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_satisfacao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        empresa_id INT NOT NULL,
        nota INT NULL,
        comentario TEXT NULL,
        token VARCHAR(255) NULL,
        respondido_em DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ticket_satisfacao (ticket_id),
        UNIQUE KEY unique_token_satisfacao (token),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela Base de Conhecimento
    await connection.query(`
      CREATE TABLE IF NOT EXISTS knowledge_articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NULL,
        conteudo TEXT NOT NULL,
        categoria VARCHAR(100) NULL,
        tags_json JSON NULL,
        publico TINYINT(1) DEFAULT 0,
        ativo TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        updated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela Regras de Distribuição
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresa_distribuicao_regras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        metodo VARCHAR(50) NOT NULL,
        categoria VARCHAR(100) NULL,
        servico VARCHAR(100) NULL,
        ativo TINYINT(1) DEFAULT 1,
        config_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela Ticket Eventos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_eventos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        empresa_id INT NOT NULL,
        usuario_id INT NULL,
        tipo VARCHAR(100) NOT NULL,
        descricao TEXT,
        metadata_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
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

    // Empresas Migrations
    await ensureColumn('empresas', 'email_suporte', 'VARCHAR(255) NULL');
    await ensureColumn('empresas', 'endereco', 'TEXT NULL');

    // Usuarios Migrations
    await ensureColumn('usuarios', 'reset_token', 'VARCHAR(255) NULL');
    await ensureColumn('usuarios', 'reset_token_expires', 'DATETIME NULL');
    await ensureColumn('usuarios', 'perfil', 'VARCHAR(50) NULL');

    // Tickets Migrations
    await ensureColumn('tickets', 'prazo_sla', 'DATETIME NULL');
    await ensureColumn('tickets', 'finalizado_em', 'DATETIME NULL');
    await ensureColumn('tickets', 'resolucao_motivo', 'VARCHAR(100) NULL');
    await ensureColumn('tickets', 'resolucao_observacao', 'TEXT NULL');
    await ensureColumn('tickets', 'reaberto_em', 'DATETIME NULL');
    await ensureColumn('tickets', 'reaberto_por', 'INT NULL');
    await ensureColumn('tickets', 'origem', 'VARCHAR(50) NULL');
    await ensureColumn('tickets', 'servico', 'VARCHAR(100) NULL');
    await ensureColumn('tickets', 'responsavel_id', 'INT NULL');
    await ensureColumn('tickets', 'precisa_revisao_responsavel', 'TINYINT(1) DEFAULT 0');
    // Campos para suporte a abertura por remetentes externos (email-channels)
    await ensureColumn('tickets', 'solicitante_nome', 'VARCHAR(255) NULL');
    await ensureColumn('tickets', 'solicitante_email', 'VARCHAR(255) NULL');
    
    // Ticket Macros Migration (Rename atalho to titulo if exists)
    try {
      const [cols]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'ticket_macros' 
        AND COLUMN_NAME = 'atalho'
      `);
      if (cols.length > 0) {
        console.log('[MIGRATE] 🔄 Renomeando coluna atalho para titulo na tabela ticket_macros...');
        await connection.query('ALTER TABLE ticket_macros CHANGE COLUMN atalho titulo VARCHAR(120) NOT NULL');
      }
    } catch (e) {
      console.warn('[MIGRATE] ⚠️ Falha ao migrar ticket_macros:', e);
    }

    // Ticket Macros Migration additions
    await ensureColumn('ticket_macros', 'servico', 'VARCHAR(100) NULL');
    await ensureColumn('ticket_macros', 'tags_json', 'JSON NULL');
    await ensureColumn('ticket_macros', 'uso_count', 'INT DEFAULT 0');

    await ensureColumn('usuarios', 'perfil', 'VARCHAR(50) DEFAULT "atendente"');
    
    // Update users profile fallback
    try {
      console.log('[BOOT] 🔄 Atualizando perfis de usuários com fallback...');
      await connection.query(`
        UPDATE usuarios
        SET perfil = CASE
          WHEN desenvolvedor = 1 THEN 'desenvolvedor'
          WHEN administrador = 1 THEN 'administrador'
          WHEN perfil IS NULL OR perfil = '' THEN 'atendente'
          ELSE perfil
        END
      `);
    } catch(e) {
      console.warn('[BOOT] ⚠️ Falha ao atualizar perfis de usuários:', e);
    }

    // Status enum check/update
    await connection.query(`
      ALTER TABLE tickets MODIFY status ENUM('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado') DEFAULT 'aberto'
    `);

    // Ensure tickets columns allow NULL and update foreign keys
    try {
      console.log('[BOOT] 🛠️ Ajustando integridade dos tickets...');
      await connection.query('ALTER TABLE tickets MODIFY COLUMN usuario_id INT NULL');
      await connection.query('ALTER TABLE tickets MODIFY COLUMN responsavel_id INT NULL');
      
      // Cleanup orphaned tickets
      const [cleanupTickets]: any = await connection.query(`
        UPDATE tickets SET usuario_id = NULL WHERE usuario_id NOT IN (SELECT id FROM usuarios) AND usuario_id IS NOT NULL
      `);
      const [cleanupResponsavel]: any = await connection.query(`
        UPDATE tickets SET responsavel_id = NULL WHERE responsavel_id NOT IN (SELECT id FROM usuarios) AND responsavel_id IS NOT NULL
      `);
      
      if (cleanupTickets.affectedRows > 0 || cleanupResponsavel.affectedRows > 0) {
        console.log(`[BOOT] 🧹 Limpeza concluída: ${cleanupTickets.affectedRows} tickets e ${cleanupResponsavel.affectedRows} responsabilidades órfãs corrigidas.`);
      }
    } catch (e) {
      console.warn('[BOOT] ⚠️ Falha ao ajustar colunas de tickets:', e);
    }

    // Ticket Mensagens / Anexos Migrations
    await connection.query('ALTER TABLE ticket_mensagens MODIFY COLUMN usuario_id INT NULL');
    await ensureColumn('ticket_mensagens', 'interno', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('ticket_mensagens', 'anexo', 'VARCHAR(255) NULL');
    await ensureColumn('logs_sistema', 'ip', 'VARCHAR(45) NULL');
    await ensureColumn('logs_sistema', 'user_agent', 'TEXT NULL');

    // Add index for responsavel_id if column was created
    try {
      const [indices]: any = await connection.query(`
        SHOW INDEX FROM tickets WHERE COLUMN_NAME = 'responsavel_id'
      `);
      if (indices.length === 0) {
        console.log('[MIGRATE] 🔍 Criando índice para responsavel_id...');
        await connection.query('CREATE INDEX idx_tickets_responsavel ON tickets(responsavel_id)');
      }
    } catch (e) {
      console.warn('[MIGRATE] ⚠️ Falha ao criar índice para responsavel_id:', e);
    }

    try {
      const [indices]: any = await connection.query(`
        SHOW INDEX FROM empresas WHERE COLUMN_NAME = 'email_suporte'
      `);
      if (indices.length === 0) {
        console.log('[MIGRATE] 🔍 Criando índice para email_suporte...');
        await connection.query('CREATE INDEX idx_empresas_email_suporte ON empresas(email_suporte)');
      }
    } catch (e) {
      console.warn('[MIGRATE] ⚠️ Falha ao criar índice para email_suporte:', e);
    }

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
