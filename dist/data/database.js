"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
exports.createDatabase = createDatabase;
exports.getDatabase = getDatabase;
exports.setDatabase = setDatabase;
exports.resetDatabase = resetDatabase;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
class Database {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Construtor de consultas para a tabela informada (mesma API do Supabase). */
    from(table) {
        return new SupabaseQueryBuilder(this.client, table);
    }
    /** Namespace de autenticação (mesma API do Supabase Auth). */
    get auth() {
        return this.client.auth;
    }
}
exports.Database = Database;
/** Adapter que traduz a API fluente do Supabase para nossa interface. */
class SupabaseQueryBuilder {
    client;
    table;
    chain;
    constructor(client, table) {
        this.client = client;
        this.table = table;
    }
    // ─── Awaitable (PromiseLike) ────────────────────────────────────────
    // Permite `const { data, error } = await supabase.from(...).select(...)`
    // sem precisar chamar .execute() — igual ao comportamento do SDK real.
    then(onfulfilled, onrejected) {
        return Promise.resolve(this.chain).then(onfulfilled, onrejected);
    }
    select(columns, options) {
        this.chain = this.client.from(this.table).select(columns ?? '*', options);
        return this;
    }
    insert(rows, options) {
        this.chain = this.client.from(this.table).insert(rows, options);
        return this;
    }
    update(row, options) {
        this.chain = this.client.from(this.table).update(row, options);
        return this;
    }
    upsert(row, options) {
        this.chain = this.client.from(this.table).upsert(row, options);
        return this;
    }
    delete() {
        this.chain = this.client.from(this.table).delete();
        return this;
    }
    eq(column, value) {
        this.chain = this.chain.eq(column, value);
        return this;
    }
    neq(column, value) {
        this.chain = this.chain.neq(column, value);
        return this;
    }
    is(column, value) {
        this.chain = this.chain.is(column, value);
        return this;
    }
    or(filter) {
        this.chain = this.chain.or(filter);
        return this;
    }
    gt(column, value) {
        this.chain = this.chain.gt(column, value);
        return this;
    }
    gte(column, value) {
        this.chain = this.chain.gte(column, value);
        return this;
    }
    not(column, op, value) {
        this.chain = this.chain.not(column, op, value);
        return this;
    }
    in(column, values) {
        this.chain = this.chain.in(column, values);
        return this;
    }
    match(params) {
        this.chain = this.chain.match(params);
        return this;
    }
    order(column, options) {
        this.chain = this.chain.order(column, options);
        return this;
    }
    limit(count) {
        this.chain = this.chain.limit(count);
        return this;
    }
    async single() {
        return this.chain.single();
    }
    async maybeSingle() {
        return this.chain.maybeSingle();
    }
    async selectWithResult() {
        const result = await this.chain;
        return { data: result.data ?? [], error: result.error };
    }
    async execute() {
        return this.chain;
    }
}
function createDatabase(config) {
    const url = (config.url || '').replace(/\/rest\/v1\/?$/, '');
    const key = config.serviceRoleKey || config.anonKey;
    if (!url || !url.startsWith('http')) {
        throw new Error('SUPABASE_URL inválida. Use a URL do projeto (ex: https://xxxx.supabase.co), sem /rest/v1/');
    }
    const isPlaceholderKey = !key || key === 'YOUR_SUPABASE_ANON_KEY' || !key.startsWith('eyJ');
    if (isPlaceholderKey) {
        throw new Error('SUPABASE_KEY inválida. Configure a chave JWT do projeto no arquivo .env');
    }
    if (!config.serviceRoleKey ||
        !config.serviceRoleKey.startsWith('eyJ') ||
        config.serviceRoleKey.includes('COLE_AQUI')) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY inválida. No Dashboard → API Keys → legacy service_role, cole no .env');
    }
    const client = (0, supabase_js_1.createClient)(url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return new Database(client);
}
/* ─────────────────────────── Singleton / injeção ─────────────────── */
let instance = null;
function getDatabase() {
    if (!instance) {
        instance = createDatabase({
            url: process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '') || '',
            anonKey: process.env.SUPABASE_KEY,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
        });
    }
    return instance;
}
/** Substitui a instância global — usado em testes para injetar mocks. */
function setDatabase(database) {
    instance = database;
    return database;
}
/** Reseta a instância global (força recriação no próximo getDatabase). */
function resetDatabase() {
    instance = null;
}
//# sourceMappingURL=database.js.map