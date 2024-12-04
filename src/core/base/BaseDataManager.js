// src/core/base/BaseDataManager.js

class BaseDataManager {
    constructor() {
        this.db = window.APP.db;
    }

    async initialize() {
        await this.validateConnection();
    }

    async validateConnection() {
        if (!this.db) {
            throw new Error('Database connection not available');
        }
    }

    async executeQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async executeUpdate(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async beginTransaction() {
        return this.executeUpdate('BEGIN TRANSACTION');
    }

    async commit() {
        return this.executeUpdate('COMMIT');
    }

    async rollback() {
        return this.executeUpdate('ROLLBACK');
    }

    async executeInTransaction(operation) {
        try {
            await this.beginTransaction();
            const result = await operation();
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async findById(table, id) {
        const sql = `SELECT * FROM ${table} WHERE id = ? AND ativo = 1`;
        const rows = await this.executeQuery(sql, [id]);
        return rows[0];
    }

    async findAll(table, where = 'ativo = 1', params = []) {
        const sql = `SELECT * FROM ${table} WHERE ${where}`;
        return this.executeQuery(sql, params);
    }

    async insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        
        const sql = `
            INSERT INTO ${table} (${keys.join(',')})
            VALUES (${placeholders})
        `;

        return this.executeUpdate(sql, values);
    }

    async update(table, id, data) {
        const sets = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(',');
        const values = [...Object.values(data), id];
        
        const sql = `
            UPDATE ${table}
            SET ${sets}
            WHERE id = ?
        `;

        return this.executeUpdate(sql, values);
    }

    async delete(table, id) {
        return this.update(table, id, { ativo: 0 });
    }
}

export default BaseDataManager;