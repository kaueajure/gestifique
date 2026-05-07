export const isDev = (req, res, next) => {
    if (req.user?.desenvolvedor) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: Requer privilégios de desenvolvedor' });
};
export const isAdmin = (req, res, next) => {
    if (req.user?.administrador || req.user?.desenvolvedor) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: Requer privilégios de administrador' });
};
