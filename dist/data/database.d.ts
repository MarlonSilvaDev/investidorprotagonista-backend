import 'dotenv/config';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Camada de acesso a dados isolada do restante da aplicação.
 *
 * O objetivo desta classe é concentrar TODO o acesso ao banco de dados em um
 * único ponto. Controllers, middlewares e serviços nunca devem importar o
 * cliente do Supabase (ou de qualquer outro banco) diretamente — eles recebem
 * uma instância de `Database`.
 *
 * Para trocar o banco de dados no futuro:
 *   1. Crie uma nova implementação que exponha a mesma interface pública
 *      (`from`, `auth` e os helpers abaixo) — pode ser outra classe estendendo
 *      esta ou uma implementação completamente nova (Postgres via Prisma/Drizzle,
 *      MongoDB, etc.).
 *   2. Altere a factory `createDatabase(...)` para instanciar a nova classe.
 *   3. Nenhum outro arquivo do projeto precisa mudar.
 *
 * Em testes, use `setDatabase(mockDb)` para injetar um mock.
 */
export interface DatabaseAuth {
    getUser(token: string): Promise<any>;
    signInWithPassword(credentials: {
        email: string;
        password: string;
    }): Promise<any>;
    signInWithIdToken(params: {
        provider: string;
        token: string;
        access_token?: string;
    }): Promise<any>;
    refreshSession(params: {
        refresh_token: string;
    }): Promise<any>;
    admin: {
        createUser(attributes: any): Promise<any>;
        updateUserById(userId: string, attributes: any): Promise<any>;
        getUserById(userId: string): Promise<any>;
        deleteUser(userId: string): Promise<any>;
    };
}
export interface DatabaseQueryBuilder<T = any> extends PromiseLike<{
    data: T[] | null;
    count?: number | null;
    error: any;
}> {
    select(columns?: string, options?: {
        count?: 'exact' | 'planned' | 'estimated';
        head?: boolean;
    }): DatabaseQueryBuilder<T>;
    insert(rows: any, options?: any): DatabaseQueryBuilder<T>;
    update(row: Record<string, unknown>, options?: any): DatabaseQueryBuilder<T>;
    upsert(row: any, options?: any): DatabaseQueryBuilder<T>;
    delete(): DatabaseQueryBuilder<T>;
    eq(column: string, value: unknown): DatabaseQueryBuilder<T>;
    neq(column: string, value: unknown): DatabaseQueryBuilder<T>;
    is(column: string, value: unknown): DatabaseQueryBuilder<T>;
    or(filter: string): DatabaseQueryBuilder<T>;
    gt(column: string, value: unknown): DatabaseQueryBuilder<T>;
    gte(column: string, value: unknown): DatabaseQueryBuilder<T>;
    not(column: string, op: string, value: unknown): DatabaseQueryBuilder<T>;
    in(column: string, values: unknown[]): DatabaseQueryBuilder<T>;
    match(params: Record<string, unknown>): DatabaseQueryBuilder<T>;
    order(column: string, options?: any): DatabaseQueryBuilder<T>;
    limit(count: number): DatabaseQueryBuilder<T>;
    single(): Promise<{
        data: T | null;
        error: any;
    }>;
    maybeSingle(): Promise<{
        data: T | null;
        error: any;
    }>;
    selectWithResult(): Promise<{
        data: T[] | null;
        error: any;
    }>;
    execute(): Promise<{
        data: T | T[] | null;
        error: any;
    }>;
}
export interface DatabaseFromBuilder {
    select(columns?: string, options?: {
        count?: 'exact' | 'planned' | 'estimated';
        head?: boolean;
    }): DatabaseQueryBuilder;
    insert(rows: any, options?: any): DatabaseQueryBuilder;
    update(row: Record<string, unknown>, options?: any): DatabaseQueryBuilder;
    upsert(row: any, options?: any): DatabaseQueryBuilder;
    delete(): DatabaseQueryBuilder;
}
export declare class Database {
    protected client: SupabaseClient;
    constructor(client: SupabaseClient);
    /** Construtor de consultas para a tabela informada (mesma API do Supabase). */
    from(table: string): DatabaseFromBuilder;
    /** Namespace de autenticação (mesma API do Supabase Auth). */
    get auth(): DatabaseAuth;
}
export interface DatabaseConfig {
    url: string;
    anonKey?: string;
    serviceRoleKey?: string;
}
export declare function createDatabase(config: DatabaseConfig): Database;
export declare function getDatabase(): Database;
/** Substitui a instância global — usado em testes para injetar mocks. */
export declare function setDatabase(database: Database): Database;
/** Reseta a instância global (força recriação no próximo getDatabase). */
export declare function resetDatabase(): void;
//# sourceMappingURL=database.d.ts.map