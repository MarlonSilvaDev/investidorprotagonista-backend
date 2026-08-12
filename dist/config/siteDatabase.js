"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteDatabase = getSiteDatabase;
exports.resetSiteDatabase = resetSiteDatabase;
require("dotenv/config");
const database_1 = require("./database");
let siteInstance = null;
/**
 * Retorna a instância do banco de dados do SITE (SITE_SUPABASE_URL).
 * NÃO utiliza o SUPABASE_URL do app como fallback.
 */
function getSiteDatabase() {
    if (!siteInstance) {
        const url = process.env.SITE_SUPABASE_URL || '';
        const serviceRoleKey = process.env.SITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SITE_SUPABASE_KEY ||
            '';
        if (!url || !url.startsWith('http')) {
            throw new Error('SITE_SUPABASE_URL não configurada no arquivo .env. Defina a URL do projeto do site.');
        }
        if (!serviceRoleKey || !serviceRoleKey.startsWith('eyJ')) {
            throw new Error('SITE_SUPABASE_SERVICE_ROLE_KEY não configurada no arquivo .env.');
        }
        siteInstance = (0, database_1.createDatabase)({
            url: url.replace(/\/rest\/v1\/?$/, ''),
            anonKey: process.env.SITE_SUPABASE_KEY,
            serviceRoleKey,
        });
    }
    return siteInstance;
}
function resetSiteDatabase() {
    siteInstance = null;
}
//# sourceMappingURL=siteDatabase.js.map