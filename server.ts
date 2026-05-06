import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pool from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { initDB } from "./init-db";

// Strict Security: Fail if secret is missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET environment variable is not defined!");
  process.exit(1);
}

// Log Helper
async function logSystemAction(userId: number | null, empresaId: number | null, acao: string, descricao: string, req: express.Request) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await pool.query(
      "INSERT INTO logs_sistema (usuario_id, empresa_id, acao, descricao, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, empresaId, acao, descricao, Array.isArray(ip) ? ip[0] : ip, userAgent]
    );
  } catch (error) {
    console.error("Log error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  try {
    if (process.env.DB_HOST) {
       await initDB();
    }
  } catch (err) {
    console.error("Init fallback err:", err);
  }

  app.use(express.json());
  app.use(cookieParser());

  // --- Middlewares ---

  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Acesso negado. Faça login." });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.clearCookie('token');
      res.status(401).json({ message: "Sessão expirada. Faça login novamente." });
    }
  };

  const isDev = (req: any, res: any, next: any) => {
    if (!req.user.desenvolvedor) return res.status(403).json({ message: "Acesso exclusivo para desenvolvedores." });
    next();
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user.administrador && !req.user.desenvolvedor) return res.status(403).json({ message: "Acesso administrativo necessário." });
    next();
  };

  // --- API Routes ---

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const [rows]: any = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
      const user = rows[0];

      if (!user || user.ativo === 0) {
        return res.status(401).json({ message: "Credenciais inválidas ou conta inativa." });
      }

      const isMatch = await bcrypt.compare(password, user.senha_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          empresa_id: user.empresa_id,
          nome: user.nome,
          email: user.email,
          administrador: !!user.administrador,
          desenvolvedor: !!user.desenvolvedor 
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

      await pool.query("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?", [user.id]);
      await logSystemAction(user.id, user.empresa_id, 'LOGIN', 'Usuário realizou login no sistema', req);

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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro interno no servidor." });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Off" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ user: decoded });
    } catch {
      res.status(401).json({ message: "Session expired" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    await logSystemAction(req.user.id, req.user.empresa_id, 'LOGOUT', 'Usuário saiu do sistema', req);
    res.clearCookie('token');
    res.json({ message: "Logout realizado." });
  });

  // --- Dashboard ---
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    const { empresa_id, desenvolvedor } = req.user;
    
    try {
      let filter = "";
      let params: any[] = [];

      if (!desenvolvedor) {
        filter = "empresa_id = ?";
        params = [empresa_id];
      }

      const q = (condition: string) => `SELECT COUNT(*) as count FROM tickets ${filter ? 'WHERE ' + filter + ' AND ' + condition : 'WHERE ' + condition}`;
      const qTotal = `SELECT COUNT(*) as count FROM tickets ${filter ? 'WHERE ' + filter : ''}`;

      const [total]: any = await pool.query(qTotal, params);
      const [open]: any = await pool.query(q("status = 'aberto'"), params);
      const [progress]: any = await pool.query(q("status = 'em_andamento'"), params);
      const [resolved]: any = await pool.query(q("status = 'resolvido'"), params);
      const [urgent]: any = await pool.query(q("prioridade = 'urgente'"), params);

      res.json({
        total: total[0].count,
        open: open[0].count,
        progress: progress[0].count,
        resolved: resolved[0].count,
        urgent: urgent[0].count
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao sumarizar dados." });
    }
  });

  // --- Tickets ---
  app.get("/api/tickets", authenticateToken, async (req: any, res) => {
    const { id, empresa_id, desenvolvedor, administrador } = req.user;
    const { status, prioridade, busca } = req.query;

    try {
      let query = `
        SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome 
        FROM tickets t 
        LEFT JOIN usuarios u ON t.usuario_id = u.id 
        LEFT JOIN usuarios r ON t.responsavel_id = r.id
      `;
      let where = [];
      let params = [];

      if (!desenvolvedor) {
        where.push("t.empresa_id = ?");
        params.push(empresa_id);
        if (!administrador) {
          where.push("t.usuario_id = ?");
          params.push(id);
        }
      }

      if (status) { where.push("t.status = ?"); params.push(status); }
      if (prioridade) { where.push("t.prioridade = ?"); params.push(prioridade); }
      if (busca) {
        where.push("(t.titulo LIKE ? OR t.descricao LIKE ? OR t.id = ?)");
        params.push(`%${busca}%`, `%${busca}%`, busca);
      }

      if (where.length > 0) query += " WHERE " + where.join(" AND ");
      query += " ORDER BY t.created_at DESC LIMIT 100";

      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Falha ao listar tickets." });
    }
  });

  app.post("/api/tickets", authenticateToken, async (req: any, res) => {
    const { titulo, descricao, prioridade, categoria } = req.body;
    const { id, empresa_id } = req.user;

    if (!titulo || !descricao) return res.status(400).json({ message: "Título e descrição são obrigatórios." });

    try {
      const [result]: any = await pool.query(
        "INSERT INTO tickets (empresa_id, usuario_id, titulo, descricao, prioridade, categoria) VALUES (?, ?, ?, ?, ?, ?)",
        [empresa_id, id, titulo, descricao, prioridade || 'media', categoria || 'suporte']
      );
      
      await logSystemAction(id, empresa_id, 'TICKET_CREATE', `Novo ticket #${result.insertId} criado por ${req.user.nome}`, req);
      res.status(201).json({ id: result.insertId, message: "Ticket aberto com sucesso." });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar ticket." });
    }
  });

  app.get("/api/tickets/:id", authenticateToken, async (req: any, res) => {
    const { empresa_id, desenvolvedor } = req.user;
    try {
      const [rows]: any = await pool.query(
        "SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome FROM tickets t LEFT JOIN usuarios u ON t.usuario_id = u.id LEFT JOIN usuarios r ON t.responsavel_id = r.id WHERE t.id = ?",
        [req.params.id]
      );
      const ticket = rows[0];

      if (!ticket) return res.status(404).json({ message: "Ticket não encontrado." });
      if (!desenvolvedor && ticket.empresa_id !== empresa_id) return res.status(403).json({ message: "Acesso negado a este recurso." });

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar detalhes." });
    }
  });

  app.patch("/api/tickets/:id", authenticateToken, isAdmin, async (req: any, res) => {
    const { status, prioridade, responsavel_id } = req.body;
    const { empresa_id, desenvolvedor } = req.user;

    try {
      const [rows]: any = await pool.query("SELECT empresa_id FROM tickets WHERE id = ?", [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ message: "Ticket não existe." });
      if (!desenvolvedor && rows[0].empresa_id !== empresa_id) return res.status(403).json({ message: "Proibido alterar tickets de outras empresas." });

      let updates = [];
      let params = [];
      if (status) { updates.push("status = ?"); params.push(status); }
      if (prioridade) { updates.push("prioridade = ?"); params.push(prioridade); }
      if (responsavel_id !== undefined) { updates.push("responsavel_id = ?"); params.push(responsavel_id); }

      if (updates.length > 0) {
        params.push(req.params.id);
        await pool.query(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`, params);
        await logSystemAction(req.user.id, empresa_id, 'TICKET_UPDATE', `Ticket #${req.params.id} atualizado.`, req);
      }
      res.json({ message: "Atualizado com sucesso." });
    } catch (error) {
      res.status(500).json({ message: "Erro na atualização." });
    }
  });

  // --- Messages ---
  app.get("/api/tickets/:id/messages", authenticateToken, async (req: any, res) => {
    const { id, empresa_id, desenvolvedor, administrador } = req.user;
    
    try {
      const [tRows]: any = await pool.query("SELECT empresa_id, usuario_id FROM tickets WHERE id = ?", [req.params.id]);
      if (tRows.length === 0) return res.status(404).json({ message: "Ticket inexistente." });
      
      const ticket = tRows[0];
      if (!desenvolvedor && ticket.empresa_id !== empresa_id) return res.status(403).json({ message: "Acesso negado." });

      let msgQuery = `
        SELECT m.*, u.nome as usuario_nome 
        FROM ticket_mensagens m 
        JOIN usuarios u ON m.usuario_id = u.id 
        WHERE m.ticket_id = ?
      `;
      let params: any[] = [req.params.id];

      // Regular users can't see internal messages
      if (!administrador && !desenvolvedor) {
        msgQuery += " AND m.interno = 0";
      }

      const [messages]: any = await pool.query(msgQuery + " ORDER BY m.created_at ASC", params);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro ao carregar chat." });
    }
  });

  app.post("/api/tickets/:id/messages", authenticateToken, async (req: any, res) => {
    const { mensagem, interno } = req.body;
    const { id, empresa_id, desenvolvedor, administrador } = req.user;

    if (!mensagem) return res.status(400).json({ message: "Mensagem vazia." });

    try {
      const [tRows]: any = await pool.query("SELECT empresa_id FROM tickets WHERE id = ?", [req.params.id]);
      if (tRows.length === 0) return res.status(404).json({ message: "Ticket inexistente." });
      if (!desenvolvedor && tRows[0].empresa_id !== empresa_id) return res.status(403).json({ message: "Acesso negado." });

      const isInternal = interno && (administrador || desenvolvedor) ? 1 : 0;

      await pool.query(
        "INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, interno) VALUES (?, ?, ?, ?)",
        [req.params.id, id, mensagem, isInternal]
      );

      res.status(201).json({ message: "Enviado." });
    } catch (error) {
      res.status(500).json({ message: "Erro no envio." });
    }
  });

  // --- User Management ---
  app.get("/api/users", authenticateToken, isAdmin, async (req: any, res) => {
    const { empresa_id, desenvolvedor } = req.user;
    try {
      let q = "SELECT id, nome, email, cargo, administrador, desenvolvedor, ativo, ultimo_login FROM usuarios";
      let params = [];
      if (!desenvolvedor) {
        q += " WHERE empresa_id = ?";
        params.push(empresa_id);
      }
      const [users]: any = await pool.query(q, params);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar usuários." });
    }
  });

  app.post("/api/users", authenticateToken, isAdmin, async (req: any, res) => {
    const { nome, email, senha, cargo, is_admin, is_dev, empresa_id_target } = req.body;
    const { desenvolvedor, empresa_id } = req.user;

    // Protection: only dev can create dev
    if (is_dev && !desenvolvedor) return res.status(403).json({ message: "Apenas desenvolvedores master podem criar outros desenvolvedores." });

    // Protection: normal admin only creates for own company
    const finalEmpresaId = desenvolvedor ? empresa_id_target : empresa_id;

    try {
      const hash = await bcrypt.hash(senha, 12);
      const [resul]: any = await pool.query(
        "INSERT INTO usuarios (empresa_id, nome, email, senha_hash, cargo, administrador, desenvolvedor) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [finalEmpresaId, nome, email, hash, cargo, is_admin ? 1 : 0, is_dev ? 1 : 0]
      );
      await logSystemAction(req.user.id, empresa_id, 'USER_CREATE', `Usuário ${email} criado por ${req.user.nome}`, req);
      res.status(201).json({ id: resul.insertId, message: "Usuário cadastrado." });
    } catch (error) {
      res.status(500).json({ message: "Erro ou e-mail duplicado." });
    }
  });

  // --- Company Management ---
  app.get("/api/companies", authenticateToken, isDev, async (req: any, res) => {
    try {
      const [cos]: any = await pool.query("SELECT * FROM empresas ORDER BY created_at DESC");
      res.json(cos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar empresas." });
    }
  });

  app.post("/api/companies", authenticateToken, isDev, async (req: any, res) => {
    const { nome, cnpj, email } = req.body;
    try {
      const [re]: any = await pool.query("INSERT INTO empresas (nome, cnpj, email) VALUES (?, ?, ?)", [nome, cnpj, email]);
      await logSystemAction(req.user.id, null, 'COMPANY_CREATE', `Empresa ${nome} criada.`, req);
      res.status(201).json({ id: re.insertId, message: "Empresa criada." });
    } catch (error) {
      res.status(500).json({ message: "Erro na criação." });
    }
  });

  // --- Catch-all / Static ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gestifique 2.0 running on port ${PORT}`);
  });
}

startServer();
