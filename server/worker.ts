/**
 * Gestifique Worker Entrypoint
 * 
 * Este arquivo é um alias para rodar o processo como worker.
 * Ele configura as variáveis de ambiente para desativar o servidor web 
 * e focar apenas nas tarefas de background (jobs e listeners).
 */

import { env } from './config/env.js';

// Forçamos o modo worker se usado através deste entrypoint, 
// a menos que o usuário queira rodar ambos explicitamente.
if (process.env.ENABLE_WEB_SERVER === undefined) {
  process.env.ENABLE_WEB_SERVER = 'false';
}

console.log('--------------------------------------------------');
console.log('🛠️  GESTIFIQUE WORKER MODE');
console.log('--------------------------------------------------');

// Importamos e iniciamos o server.ts que já possui a lógica de toggles
import('./server.js').catch(err => {
  console.error('❌ Falha ao iniciar worker:', err);
  process.exit(1);
});
