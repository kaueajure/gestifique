import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';
// Resolve o caminho de upload a partir da configuração do env
const uploadDir = path.resolve(process.cwd(), env.STORAGE_CONFIG.LOCAL_PATH);
// Garante que o diretório existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gera nome único seguro usando crypto
        const ext = path.extname(file.originalname).toLowerCase();
        const randomName = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        // Prefixamos com tk- para facilitar identificação
        cb(null, `tk-${timestamp}-${randomName}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
    const allowedMimetypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain'
    ];
    // Prevenção de ataques de Path Traversal ou nomes maliciosos
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return cb(new Error('Nome de arquivo inválido e suspeito.'), false);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(new Error(`Extensão ${ext} não permitida.`), false);
    }
    const isImageFile = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const isSpecificAllowed = allowedMimetypes.includes(file.mimetype);
    const isGenericMime = ['application/octet-stream', 'application/x-download', 'application/download'].includes(file.mimetype);
    // Imagens DEVEM ter MIME específico válido
    if (isImageFile && !isSpecificAllowed) {
        return cb(new Error('Imagens devem ter um tipo MIME específico e válido.'), false);
    }
    // Outros tipos podem ser específicos ou genéricos
    if (!isSpecificAllowed && !isGenericMime) {
        return cb(new Error('Tipo de arquivo (MIME) não permitido.'), false);
    }
    cb(null, true);
};
export const ticketUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // Máximo de 5 arquivos por vez
    }
});
