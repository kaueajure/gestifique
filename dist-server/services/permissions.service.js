import pool from '../db/connection.js';
import { PERMISSIONS_CATALOG, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions.js';
const userPermissionsCache = new Map();
export const permissionsService = {
    invalidateCache(userId) {
        userPermissionsCache.delete(userId);
    },
    async getCatalog() {
        const [rows] = await pool.query(`
      SELECT permission_key as \`key\`, modulo, grupo, nome, descricao, nivel_risco as nivel_risk, ativo, ordem
      FROM permissions_catalog
      WHERE ativo = 1
      ORDER BY ordem ASC
    `);
        return rows;
    },
    async syncCatalog() {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Mark all currently active permissions as inactive initially (we will re-activate/upsert in the loop)
            await connection.query('UPDATE permissions_catalog SET ativo = 0');
            for (const item of PERMISSIONS_CATALOG) {
                await connection.query(`
          INSERT INTO permissions_catalog (permission_key, modulo, grupo, nome, descricao, nivel_risco, ativo, ordem)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?)
          ON DUPLICATE KEY UPDATE
            modulo = VALUES(modulo),
            grupo = VALUES(grupo),
            nome = VALUES(nome),
            descricao = VALUES(descricao),
            nivel_risco = VALUES(nivel_risco),
            ativo = 1,
            ordem = VALUES(ordem)
        `, [item.key, item.modulo, item.grupo, item.nome, item.descricao, item.nivel_risk, item.order]);
            }
            // Restore/Add default role permissions that might be missing
            for (const [perfil, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
                for (const key of keys) {
                    await connection.query(`
            INSERT IGNORE INTO role_permissions (perfil, permission_key, allowed)
            VALUES (?, ?, 1)
          `, [perfil, key]);
                }
            }
            await connection.commit();
            // Invalidate all caches
            userPermissionsCache.clear();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async getRolePermissions(perfil) {
        if (!perfil)
            return [];
        const [rows] = await pool.query('SELECT permission_key FROM role_permissions WHERE perfil = ? AND allowed = 1', [perfil]);
        return rows.map((r) => r.permission_key);
    },
    async getUserOverrides(userId) {
        const [rows] = await pool.query('SELECT permission_key, effect FROM user_permission_overrides WHERE usuario_id = ?', [userId]);
        return rows;
    },
    async getEffectivePermissions(user) {
        if (!user)
            return [];
        if (user.desenvolvedor === 1 || user.desenvolvedor === true || user.perfil === 'desenvolvedor') {
            return ['*'];
        }
        if (user.administrador === 1 || user.administrador === true || user.perfil === 'administrador') {
            return ['*'];
        }
        const userId = Number(user.id);
        const now = Date.now();
        const cached = userPermissionsCache.get(userId);
        if (cached && cached.expiresAt > now) {
            return cached.permissions;
        }
        // Fetch from database
        const roleKeys = await this.getRolePermissions(user.perfil);
        const overrides = await this.getUserOverrides(userId);
        const permissionSet = new Set(roleKeys);
        // Apply overrides: allow adds, deny removes.
        // Deny strictly wins over allow.
        const allows = overrides.filter(o => o.effect === 'allow').map(o => o.permission_key);
        const denies = overrides.filter(o => o.effect === 'deny').map(o => o.permission_key);
        for (const key of allows) {
            permissionSet.add(key);
        }
        for (const key of denies) {
            permissionSet.delete(key);
        }
        const effective = Array.from(permissionSet);
        userPermissionsCache.set(userId, {
            permissions: effective,
            expiresAt: now + 60000 // 60 seconds
        });
        return effective;
    },
    async hasPermission(user, permissionKey) {
        if (!user)
            return false;
        const effective = await this.getEffectivePermissions(user);
        if (effective.includes('*'))
            return true;
        return effective.includes(permissionKey);
    },
    async setUserPermissionOverride(params) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Get old override if exists
            const [oldRows] = await connection.query('SELECT effect FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, params.permissionKey]);
            const oldEffect = oldRows.length > 0 ? oldRows[0].effect : null;
            // Upsert override
            await connection.query(`
        INSERT INTO user_permission_overrides (usuario_id, permission_key, effect, granted_by, motivo)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          effect = VALUES(effect),
          granted_by = VALUES(granted_by),
          motivo = VALUES(motivo)
      `, [params.usuarioId, params.permissionKey, params.effect, params.grantedBy, params.motivo || null]);
            // Audit Log
            await connection.query(`
        INSERT INTO permission_audit_logs (usuario_alvo_id, usuario_executor_id, action, permission_key, old_effect, new_effect, motivo, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                params.usuarioId,
                params.grantedBy,
                params.effect === 'allow' ? 'grant' : 'deny',
                params.permissionKey,
                oldEffect,
                params.effect,
                params.motivo || null,
                params.ip || null,
                params.userAgent || null
            ]);
            await connection.commit();
            this.invalidateCache(params.usuarioId);
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async removeUserPermissionOverride(params) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Get current override
            const [oldRows] = await connection.query('SELECT effect FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, params.permissionKey]);
            if (oldRows.length === 0) {
                await connection.rollback();
                connection.release();
                return;
            }
            const oldEffect = oldRows[0].effect;
            // Delete override
            await connection.query('DELETE FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, params.permissionKey]);
            // Audit Log
            await connection.query(`
        INSERT INTO permission_audit_logs (usuario_alvo_id, usuario_executor_id, action, permission_key, old_effect, new_effect, ip, user_agent)
        VALUES (?, ?, 'remove_override', ?, ?, NULL, ?, ?)
      `, [
                params.usuarioId,
                params.executorId,
                params.permissionKey,
                oldEffect,
                params.ip || null,
                params.userAgent || null
            ]);
            await connection.commit();
            this.invalidateCache(params.usuarioId);
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async resetUserPermissions(usuarioId, executorId, ip, userAgent) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM user_permission_overrides WHERE usuario_id = ?', [usuarioId]);
            // Audit Log
            await connection.query(`
        INSERT INTO permission_audit_logs (usuario_alvo_id, usuario_executor_id, action, ip, user_agent)
        VALUES (?, ?, 'reset_user', ?, ?)
      `, [usuarioId, executorId, ip || null, userAgent || null]);
            await connection.commit();
            this.invalidateCache(usuarioId);
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async setUserPermissionOverridesBulk(params) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const key of params.permissionKeys) {
                // Get old override if exists
                const [oldRows] = await connection.query('SELECT effect FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, key]);
                const oldEffect = oldRows.length > 0 ? oldRows[0].effect : null;
                // Upsert override
                await connection.query(`
          INSERT INTO user_permission_overrides (usuario_id, permission_key, effect, granted_by, motivo)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            effect = VALUES(effect),
            granted_by = VALUES(granted_by),
            motivo = VALUES(motivo)
        `, [params.usuarioId, key, params.effect, params.grantedBy, params.motivo || null]);
                // Audit Log
                await connection.query(`
          INSERT INTO permission_audit_logs (usuario_alvo_id, usuario_executor_id, action, permission_key, old_effect, new_effect, motivo, ip, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    params.usuarioId,
                    params.grantedBy,
                    params.effect === 'allow' ? 'grant' : 'deny',
                    key,
                    oldEffect,
                    params.effect,
                    params.motivo || null,
                    params.ip || null,
                    params.userAgent || null
                ]);
            }
            await connection.commit();
            this.invalidateCache(params.usuarioId);
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async removeUserPermissionOverridesBulk(params) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const key of params.permissionKeys) {
                // Get current override
                const [oldRows] = await connection.query('SELECT effect FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, key]);
                if (oldRows.length === 0)
                    continue;
                const oldEffect = oldRows[0].effect;
                // Delete override
                await connection.query('DELETE FROM user_permission_overrides WHERE usuario_id = ? AND permission_key = ?', [params.usuarioId, key]);
                // Audit Log
                await connection.query(`
          INSERT INTO permission_audit_logs (usuario_alvo_id, usuario_executor_id, action, permission_key, old_effect, new_effect, ip, user_agent)
          VALUES (?, ?, 'remove_override', ?, ?, NULL, ?, ?)
        `, [
                    params.usuarioId,
                    params.executorId,
                    key,
                    oldEffect,
                    params.ip || null,
                    params.userAgent || null
                ]);
            }
            await connection.commit();
            this.invalidateCache(params.usuarioId);
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    },
    async getUserPermissionMatrix(usuarioId) {
        const [userRows] = await pool.query('SELECT id, nome, email, perfil, administrador, desenvolvedor, empresa_id FROM usuarios WHERE id = ?', [usuarioId]);
        if (userRows.length === 0) {
            throw new Error('Usuário não encontrado.');
        }
        const user = userRows[0];
        // Catalog Grouped from Database catalog table
        const catalog = await this.getCatalog();
        const rolePermissions = await this.getRolePermissions(user.perfil);
        const overrides = await this.getUserOverrides(usuarioId);
        const effectivePermissions = await this.getEffectivePermissions(user);
        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil,
                administrador: !!user.administrador,
                desenvolvedor: !!user.desenvolvedor,
                empresa_id: user.empresa_id
            },
            rolePermissions,
            overrides,
            effectivePermissions,
            catalog
        };
    }
};
