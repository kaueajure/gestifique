# Gestifique3 - SaaS de Gestão de Tickets

Sistema profissional de atendimento ao cliente com suporte Omnichannel, SLA, Portal do Cliente e Base de Conhecimento.

## 🚀 Guia de Deploy para Hostinger (VPS ou Compartilhada)

### 1. Preparação do Ambiente
- Certifique-se de que o Node.js v18+ está instalado.
- Crie um banco de dados MySQL/MariaDB.
- Configure o arquivo `.env` baseado no `.env.example`.

### 2. Configuração Inicial Recomendada
Para o primeiro deploy, use as seguintes configurações no `.env`:
```env
ENABLE_WEB_SERVER=true
ENABLE_TICKET_JOBS=true
ENABLE_EMAIL_LISTENER=false  # Só ative após configurar IMAP real
```

### 3. Build e Migrations
Execute os seguintes comandos no servidor:
```bash
npm install
npm run build
npm run db:migrate # Aplica todas as tabelas e correções estruturais
```

### 4. Execução
Utilize `pm2` ou similar para manter o processo rodando:
```bash
pm2 start dist-server/server.js --name gestifique
```

## 🛠️ Modos de Escala (Workload Separation)

O Gestifique3 permite separar a carga de trabalho em diferentes processos (WEB vs WORKER):

- **Modo Monolítico (Padrão)**: `node dist-server/server.js` (Roda tudo).
- **Modo Worker-Only**: `node dist-server/worker.js` (Focado em e-mails e automações. Desabilita rotas e frontend para economizar recursos e focar em background processing).

## 🛡️ Segurança e Armazenamento

- **Storage**: O sistema utiliza o `StorageService` para abstrair uploads. Configure `UPLOAD_DIR` no `.env` para o caminho absoluto ou relativo onde deseja salvar anexos.
- **Segurança**: Helmet.js configurado com CSP rígida. Certifique-se de incluir seus domínios reais em `CORS_ORIGINS`.

## 📂 Estrutura de Migrations
As migrations são idempotentes e utilizam `INFORMATION_SCHEMA` para garantir compatibilidade com ambientes MariaDB comuns na Hostinger, permitindo execuções repetidas sem erros de "Coluna duplicada".

---
Desenvolvido com foco em performance e escala para times de suporte modernos.
