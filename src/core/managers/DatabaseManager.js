// src/core/managers/DatabaseManager.js

class DatabaseManager {
    static instance = null;
    
    constructor(db) {
        if (DatabaseManager.instance) {
            return DatabaseManager.instance;
        }
        this.db = db;
        this.migrations = new Map();
        DatabaseManager.instance = this;
    }

    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager(window.APP.db);
        }
        return DatabaseManager.instance;
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

    registerMigration(version, up, down) {
        this.migrations.set(version, { up, down });
    }

    async migrate(targetVersion) {
        try {
            await this.executeUpdate('BEGIN TRANSACTION');
            
            const currentVersion = await this.getCurrentVersion();
            const migrations = Array.from(this.migrations.entries())
                .sort(([a], [b]) => a - b);

            for (const [version, migration] of migrations) {
                if (version > currentVersion && version <= targetVersion) {
                    await this.executeUpdate(migration.up);
                    await this.updateVersion(version);
                }
            }

            await this.executeUpdate('COMMIT');
        } catch (error) {
            await this.executeUpdate('ROLLBACK');
            throw error;
        }
    }

    async getCurrentVersion() {
        try {
            const result = await this.executeQuery('SELECT version FROM schema_version');
            return result[0]?.version || 0;
        } catch (error) {
            await this.executeUpdate('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER)');
            await this.executeUpdate('INSERT INTO schema_version (version) VALUES (0)');
            return 0;
        }
    }

    async updateVersion(version) {
        await this.executeUpdate('UPDATE schema_version SET version = ?', [version]);
    }

    async backup(path) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const backup = new this.db.backup(path);
                backup.step(-1, (err) => {
                    if (err) reject(err);
                    backup.finish(() => resolve());
                });
            });
        });
    }
}

export default DatabaseManager;