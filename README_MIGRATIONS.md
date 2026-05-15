# Gestifique3 - Migrações de Banco de Dados

O projeto utiliza um sistema de migrações versionadas para garantir que a estrutura do banco de dados (MySQL) esteja sempre atualizada e consistente entre os ambientes de desenvolvimento e produção.

## Estrutura

- `server/db/migrations/`: Contém os arquivos de migração (`.ts`). Cada arquivo segue o padrão `NOME_DA_MIGRACAO.ts`.
- `server/db/migration-runner.ts`: Motor que executa as migrações pendentes.
- `server/db/migrate.ts`: Script CLI para execução manual.

## Como funciona

Ao iniciar o servidor (`npm run dev` ou `npm start`), o sistema chama automaticamente o `migration-runner`.
1. Ele verifica a tabela `schema_migrations`.
2. Se não existir, ele a cria automaticamente.
3. Ele lê os arquivos na pasta `migrations/` e executa apenas aqueles que ainda não constam na tabela `schema_migrations`.
4. Utiliza uma trava (`migration_lock`) para evitar que múltiplas instâncias do servidor tentem rodar migrações ao mesmo tempo.

## Comandos

### Executar migrações manualmente
```bash
npm run db:migrate
```

## Criando uma nova migração

Para criar uma nova migração, adicione um arquivo em `server/db/migrations/` (ex: `003_add_feature_x.ts`):

```typescript
import { PoolConnection } from 'mysql2/promise';

export async function up(connection: PoolConnection) {
  // Sua lógica de SQL aqui
  await connection.query('ALTER TABLE table_name ADD COLUMN column_name VARCHAR(255)');
}
```

**Importante:** Cada migração é executada dentro de uma transação. Se houver erro, ela sofrerá rollback automático. No entanto, lembre-se que comandos DDL (como CREATE TABLE, ALTER TABLE) fazem commit implícito no MySQL, então tente ser o mais idempotente possível ou divida migrações grandes.

## Tabelas de Controle

- `schema_migrations`: Armazena o histórico de migrações executadas.
- `migration_lock`: Garante exclusividade de execução.
