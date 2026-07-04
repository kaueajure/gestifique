import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export interface StorageOptions {
  filename: string;
  mimeType: string;
}

class StorageService {
  private localPath: string;

  constructor() {
    this.localPath = path.resolve(process.cwd(), env.STORAGE_CONFIG.LOCAL_PATH);
  }

  private resolveLocalPath(caminho: string): string {
    const fullPath = path.resolve(caminho);
    const relativePath = path.relative(this.localPath, fullPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Caminho de arquivo fora do diretorio de uploads.');
    }
    return fullPath;
  }

  /**
   * Absatração para salvar arquivo.
   * Por enquanto suporta apenas local, mas a interface permite expansão.
   */
  async save(buffer: Buffer, options: StorageOptions): Promise<string> {
    if (env.STORAGE_TYPE === 'local') {
      const fullPath = this.resolveLocalPath(path.join(this.localPath, options.filename));
      
      // Garante que o diretório existe
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, buffer);
      return fullPath; // Em S3 retornaríamos a URL ou Key
    }
    
    // Futuro: S3 / GCS
    throw new Error(`Storage type ${env.STORAGE_TYPE} not implemented yet`);
  }

  /**
   * Deleta um arquivo do storage.
   */
  async delete(caminho: string): Promise<void> {
    if (env.STORAGE_TYPE === 'local') {
      const fullPath = this.resolveLocalPath(caminho);
      try {
        await fs.unlink(fullPath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error(`[Storage] Erro ao deletar arquivo local: ${caminho}`, err);
          throw err;
        }
      }
      return;
    }

    // Futuro: S3 / GCS
    throw new Error(`Storage type ${env.STORAGE_TYPE} not implemented yet`);
  }

  /**
   * Retorna o buffer do arquivo.
   */
  async get(caminho: string): Promise<Buffer> {
    if (env.STORAGE_TYPE === 'local') {
      return await fs.readFile(this.resolveLocalPath(caminho));
    }
    
    // Futuro: S3 / GCS
    throw new Error(`Storage type ${env.STORAGE_TYPE} not implemented yet`);
  }
}

export default new StorageService();
