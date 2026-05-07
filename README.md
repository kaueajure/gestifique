# Gestifique3 - Sistema de Gestão de Tickets

Um sistema moderno e seguro para gerenciamento de chamados e atendimento ao cliente.

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (v18 ou superior)
- MySQL (v8 ou superior)

### Passo a Passo

1.  **Instalar dependências**:
    ```bash
    npm install
    ```

2.  **Configurar Variáveis de Ambiente**:
    Copie o arquivo de exemplo e preencha com suas credenciais:
    ```bash
    cp .env.example .env
    ```

3.  **Configurar o Banco de Dados**:
    Crie um banco de dados no MySQL e configure os dados no arquivo `.env`. O sistema criará as tabelas automaticamente no primeiro boot.

4.  **Desenvolvimento**:
    ```bash
    npm run dev
    ```

5.  **Produção**:
    ```bash
    npm run build
    npm run start
    ```

## 🔐 Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
| :--- | :--- |
| `NODE_ENV` | Ambiente (`development` ou `production`) |
| `PORT` | Porta de execução (Padrão: 3000) |
| `JWT_SECRET` | Chave secreta para assinatura dos Tokens JWT |
| `DB_HOST` | Host do banco de dados MySQL |
| `DB_USER` | Usuário do MySQL |
| `DB_PASSWORD` | Senha do MySQL |
| `DB_NAME` | Nome do banco de dados |
| `DB_PORT` | Porta do MySQL (Padrão: 3306) |
| `DEV_EMAIL` | E-mail da conta de desenvolvedor inicial |
| `DEV_PASSWORD` | Senha da conta de desenvolvedor inicial |
| `CORS_ORIGINS` | Lista de URLs permitidas separadas por vírgula |

## 🛡️ Segurança e Regras de Negócio

- **JWT**: Sessões seguras com cookies httpOnly. Usuários inativados são bloqueados instantaneamente.
- **ACL (Controle de Acesso)**:
  - **Desenvolvedores**: Acesso total ao sistema.
  - **Administradores**: Gestão total apenas da sua própria empresa.
  - **Clientes/Comuns**: Acesso restrito aos próprios chamados.
- **Anexos**: Validação rigorosa de tipos de arquivos (proibido executáveis e compactados sem varredura) e vínculo obrigatório com o ticket correto.
- **Validações**: Sanitização de entradas, verificação de cores hexadecimais, e-mails válidos e tipos numéricos.

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React, Tailwind CSS, Vite, Radix UI.
- **Backend**: Node.js, Express, MySQL, JWT, Multer.
