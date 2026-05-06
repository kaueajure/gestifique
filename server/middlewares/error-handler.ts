import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Internal Error:", err);
  
  const status = err.status || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor';
  
  res.status(status).json({
    success: false,
    message,
    errors: process.env.NODE_ENV === 'development' ? [err.stack] : []
  });
};
