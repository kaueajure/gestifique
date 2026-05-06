import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pool from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { initDB } from "./init-db";

const JWT_SECRET = process.env.JWT_SECRET || 'gestifique-secret-key-2026';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB tables
  try {
    if (!process.env.DB_HOST) {
       console.warn('⚠️  DB_HOST não configurado. Verifique as variáveis de ambiente.');
    } else {
       await initDB();
    }
  } catch (dbError) {
    console.error('❌ Erro crítico ao conectar no MySQL:', dbError instanceof Error ? dbError.message : dbError);
    console.warn('A aplicação continuará rodando, mas funcionalidades de banco de dados falharão até que a conexão seja estabelecida.');
  }

  app.use(express.json());
  app.use(cookieParser());

  // --- Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Não autenticado" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.clearCookie('token');
      res.status(401).json({ message: "Sessão inválida" });
    }
  };

  // --- API Routes ---

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!process.env.DB_HOST) {
        return res.status(503).json({ message: "Configuração de banco de dados ausente. Configure o DB_HOST nos Secrets." });
    }

    try {
      const [rows]: any = await pool.query("SELECT * FROM usuarios WHERE email = ? AND ativo = 1", [email]);
      const user = rows[0];

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isMatch = await bcrypt.compare(password, user.senha_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Update last login
      await pool.query("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?", [user.id]);

      const token = jwt.sign(
        { 
          id: user.id, 
          empresa_id: user.empresa_id,
          nome: user.nome,
          email: user.email,
          administrador: user.administrador,
          desenvolvedor: user.desenvolvedor 
        }, 
        JWT_SECRET, 
        { expiresIn: '8h' }
      );

      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000 
      });

      res.json({
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          administrador: !!user.administrador,
          desenvolvedor: !!user.desenvolvedor,
          empresa_id: user.empresa_id
        }
      });
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ message: "Impossível conectar ao banco de dados. Verifique Host, Usuário e Senha nos Secrets." });
      }
      res.status(500).json({ message: "Erro interno no servidor" });
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { nome, email, empresa, password } = req.body;

    if (!process.env.DB_HOST) {
        return res.status(503).json({ message: "Configuração de banco de dados ausente. Configure o DB_HOST nos Secrets." });
    }

    try {
      // Check if email exists
      const [existingUsers]: any = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      // Create Empresa first
      const [empresaRes]: any = await pool.query(
        "INSERT INTO empresas (nome, ativo) VALUES (?, ?)",
        [empresa, 1]
      );
      const empresaId = empresaRes.insertId;

      // Create Admin User for this Empresa
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userRes]: any = await pool.query(
        "INSERT INTO usuarios (empresa_id, nome, email, senha_hash, cargo, administrador) VALUES (?, ?, ?, ?, ?, ?)",
        [empresaId, nome, email, hashedPassword, 'Administrador', 1]
      );

      res.status(201).json({ message: "Conta criada com sucesso" });
    } catch (error: any) {
      console.error('Register Error:', error);
      if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ message: "Impossível conectar ao banco de dados. Verifique Host, Usuário e Senha nos Secrets." });
      }
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Sessão encerrada" });
  });

  // Auth: Me (Verify session)
  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Não autenticado" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ user: decoded });
    } catch (error) {
      res.status(401).json({ message: "Sessão inválida" });
    }
  });

  // --- Protected Routes ---

  // Dashboard Stats
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    const { empresa_id, desenvolvedor } = req.user;
    
    try {
      let whereClause = "";
      let params: any[] = [];

      if (!desenvolvedor) {
        whereClause = "WHERE empresa_id = ?";
        params = [empresa_id];
      }

      const [totalCount]: any = await pool.query(`SELECT COUNT(*) as count FROM tickets ${whereClause}`, params);
      const [openCount]: any = await pool.query(`SELECT COUNT(*) as count FROM tickets ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status IN ('aberto', 'em_andamento')`, params);
      const [resolvedCount]: any = await pool.query(`SELECT COUNT(*) as count FROM tickets ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'resolvido'`, params);
      const [urgentCount]: any = await pool.query(`SELECT COUNT(*) as count FROM tickets ${whereClause} ${whereClause ? 'AND' : 'WHERE'} prioridade = 'urgente'`, params);

      res.json({
        total: totalCount[0].count,
        open: openCount[0].count,
        resolved: resolvedCount[0].count,
        urgent: urgentCount[0].count
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Tickets: List
  app.get("/api/tickets", authenticateToken, async (req: any, res) => {
    const { id, empresa_id, desenvolvedor, administrador } = req.user;
    
    try {
      let query = "SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome FROM tickets t LEFT JOIN usuarios u ON t.usuario_id = u.id LEFT JOIN usuarios r ON t.responsavel_id = r.id";
      let params = [];

      if (desenvolvedor) {
        // Dev sees everything
      } else if (administrador) {
        query += " WHERE t.empresa_id = ?";
        params.push(empresa_id);
      } else {
        query += " WHERE t.empresa_id = ? AND t.usuario_id = ?";
        params.push(empresa_id, id);
      }

      query += " ORDER BY t.created_at DESC";
      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar tickets" });
    }
  });

  // Tickets: Create
  app.post("/api/tickets", authenticateToken, async (req: any, res) => {
    const { id, empresa_id } = req.user;
    const { titulo, descricao, prioridade, categoria } = req.body;

    try {
      const [result]: any = await pool.query(
        "INSERT INTO tickets (empresa_id, usuario_id, titulo, descricao, prioridade, categoria) VALUES (?, ?, ?, ?, ?, ?)",
        [empresa_id, id, titulo, descricao, prioridade || 'media', categoria || 'suporte']
      );
      res.status(201).json({ id: result.insertId, message: "Ticket criado com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao criar ticket" });
    }
  });

  // Tickets: Get Details
  app.get("/api/tickets/:id", authenticateToken, async (req: any, res) => {
    const { empresa_id, desenvolvedor } = req.user;
    const ticketId = req.params.id;

    try {
      let query = "SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome FROM tickets t LEFT JOIN usuarios u ON t.usuario_id = u.id LEFT JOIN usuarios r ON t.responsavel_id = r.id WHERE t.id = ?";
      let params = [ticketId];

      if (!desenvolvedor) {
        query += " AND t.empresa_id = ?";
        params.push(empresa_id);
      }

      const [rows]: any = await pool.query(query, params);
      if (rows.length === 0) return res.status(404).json({ message: "Ticket não encontrado" });
      
      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar ticket" });
    }
  });

  // Tickets: List Messages
  app.get("/api/tickets/:id/messages", authenticateToken, async (req: any, res) => {
    const ticketId = req.params.id;
    try {
      const [rows]: any = await pool.query(
        "SELECT m.*, u.nome as usuario_nome FROM ticket_mensagens m JOIN usuarios u ON m.usuario_id = u.id WHERE m.ticket_id = ? ORDER BY m.created_at ASC",
        [ticketId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  // Tickets: Add Message
  app.post("/api/tickets/:id/messages", authenticateToken, async (req: any, res) => {
    const { id } = req.user;
    const ticketId = req.params.id;
    const { mensagem, interno } = req.body;

    try {
      await pool.query(
        "INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, interno) VALUES (?, ?, ?, ?)",
        [ticketId, id, mensagem, interno ? 1 : 0]
      );
      res.status(201).json({ message: "Mensagem enviada" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // Users: List
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    const { empresa_id, desenvolvedor, administrador } = req.user;
    if (!administrador && !desenvolvedor) return res.status(403).json({ message: "Acesso negado" });

    try {
      let query = "SELECT id, nome, email, cargo, administrador, desenvolvedor, ativo, ultimo_login FROM usuarios";
      let params = [];

      if (!desenvolvedor) {
        query += " WHERE empresa_id = ?";
        params.push(empresa_id);
      }

      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Companies: List (Developer Only)
  app.get("/api/companies", authenticateToken, async (req: any, res) => {
    if (!req.user.desenvolvedor) return res.status(403).json({ message: "Acesso reservado para desenvolvedores" });

    try {
      const [rows]: any = await pool.query("SELECT * FROM empresas ORDER BY created_at DESC");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  // --- End of API Routes ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
