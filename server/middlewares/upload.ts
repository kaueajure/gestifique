import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(process.cwd(), 'uploads', 'tickets');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure unique name using crypto
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    cb(null, `tk-${timestamp}-${randomName}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
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

  // Prevent suspicious file names (e.g. .exe.jpg or path traversal)
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
  
  // Images MUST have specific MIME
  if (isImageFile && !isSpecificAllowed) {
    return cb(new Error('Imagens devem ter um tipo MIME específico e válido.'), false);
  }

  // Other types can be specific or generic
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
    files: 5
  }
});
