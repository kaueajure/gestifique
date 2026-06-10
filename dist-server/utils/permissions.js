export const RolePermissions = {
    desenvolvedor: ['*'],
    administrador: ['*'],
    gestor: [
        'tickets.visualizar', 'tickets.criar', 'tickets.editar', 'tickets.finalizar', 'tickets.arquivar', 'tickets.atribuir', 'tickets.comentar_interno', 'tickets.ver_todos',
        'relatorios.visualizar',
        'configuracoes.gerenciar', 'automacoes.gerenciar', 'base_conhecimento.gerenciar', 'base_conhecimento.visualizar',
        'auditoria.visualizar'
    ],
    atendente: [
        'tickets.visualizar', 'tickets.criar', 'tickets.editar', 'tickets.finalizar', 'tickets.comentar_interno', 'tickets.ver_todos',
        'base_conhecimento.gerenciar', 'base_conhecimento.visualizar'
    ],
    cliente: [
        'tickets.visualizar', 'tickets.criar', 'base_conhecimento.visualizar'
    ]
};
export function hasPermission(user, permission) {
    if (!user)
        return false;
    if (user.desenvolvedor || user.administrador)
        return true; // fallback backwards compatibility
    const perfil = (user.perfil || 'atendente'); // default fallback if null
    const perms = RolePermissions[perfil] || RolePermissions['atendente'];
    if (perms.includes('*'))
        return true;
    return perms.includes(permission);
}
