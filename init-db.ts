import pool from './db';
import bcrypt from 'bcryptjs';

async function initDB() {
  if (!process.env.DB_HOST) {
    throw new Error('Variável de ambiente DB_HOST não definida.');
  }

  let connection;
  try {
    console.log(`Tentando conectar ao banco em: ${process.env.DB_HOST}...`);
    connection = await pool.getConnection();
    console.log('Conexão estabelecida. Verificando tabelas...');

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
        email VARCHAR(255) UNIQUE NOT NULL,
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
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
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
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Tables created or already exist.');

    // Seed Initial Developer if not exists
    const [devs]: any = await connection.query('SELECT id FROM usuarios WHERE desenvolvedor = 1 LIMIT 1');
    if (devs.length === 0) {
      console.log('Seeding initial developer user...');
      const devEmail = process.env.DEV_EMAIL || 'admin@gestifique.com';
      const devPass = process.env.DEV_PASSWORD || 'gestifique2026';
      const hashedPassword = await bcrypt.hash(devPass, 10);
      
      await connection.query(
        'INSERT INTO usuarios (nome, email, senha_hash, cargo, administrador, desenvolvedor) VALUES (?, ?, ?, ?, ?, ?)',
        ['Desenvolvedor Master', devEmail, hashedPassword, 'System Developer', 1, 1]
      );
      console.log(`Initial developer created: ${devEmail}`);
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
}

export { initDB };
