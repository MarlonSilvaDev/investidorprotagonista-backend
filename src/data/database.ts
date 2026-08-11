import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  refreshSession(params: { refresh_token: string }): Promise<any>;
  admin: {
    createUser(attributes: any): Promise<any>;
    updateUserById(userId: string, attributes: any): Promise<any>;
    getUserById(userId: string): Promise<any>;
    deleteUser(userId: string): Promise<any>;
  };
}

export interface DatabaseQueryBuilder<T = any> extends PromiseLike<{ data: T[] | null; count?: number | null; error: any }> {
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): DatabaseQueryBuilder<T>;
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
  single(): Promise<{ data: T | null; error: any }>;
  maybeSingle(): Promise<{ data: T | null; error: any }>;
  selectWithResult(): Promise<{ data: T[] | null; error: any }>;
  execute(): Promise<{ data: T | T[] | null; error: any }>;
}

export interface DatabaseFromBuilder {
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): DatabaseQueryBuilder;
  insert(rows: any, options?: any): DatabaseQueryBuilder;
  update(row: Record<string, unknown>, options?: any): DatabaseQueryBuilder;
  upsert(row: any, options?: any): DatabaseQueryBuilder;
  delete(): DatabaseQueryBuilder;
}

export class Database {
  protected client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /** Construtor de consultas para a tabela informada (mesma API do Supabase). */
  from(table: string): DatabaseFromBuilder {
    return new SupabaseQueryBuilder(this.client, table);
  }

  /** Namespace de autenticação (mesma API do Supabase Auth). */
  get auth(): DatabaseAuth {
    return this.client.auth as unknown as DatabaseAuth;
  }
}

/** Adapter que traduz a API fluente do Supabase para nossa interface. */
class SupabaseQueryBuilder implements DatabaseQueryBuilder {
  private chain: any;

  constructor(
    private client: SupabaseClient,
    private table: string
  ) {}

  // ─── Awaitable (PromiseLike) ────────────────────────────────────────
  // Permite `const { data, error } = await supabase.from(...).select(...)`
  // sem precisar chamar .execute() — igual ao comportamento do SDK real.
  then<TResult1 = { data: any[] | null; count?: number | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any[] | null; count?: number | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.chain).then(onfulfilled as any, onrejected) as any;
  }

  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): DatabaseQueryBuilder {
    this.chain = this.client.from(this.table).select(columns ?? '*', options as any);
    return this;
  }

  insert(rows: any, options?: any): DatabaseQueryBuilder {
    this.chain = this.client.from(this.table).insert(rows, options);
    return this;
  }

  update(row: Record<string, unknown>, options?: any): DatabaseQueryBuilder {
    this.chain = this.client.from(this.table).update(row, options);
    return this;
  }

  upsert(row: any, options?: any): DatabaseQueryBuilder {
    this.chain = this.client.from(this.table).upsert(row, options);
    return this;
  }

  delete(): DatabaseQueryBuilder {
    this.chain = this.client.from(this.table).delete();
    return this;
  }

  eq(column: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.eq(column, value);
    return this;
  }

  neq(column: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.neq(column, value);
    return this;
  }

  is(column: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.is(column, value);
    return this;
  }

  or(filter: string): DatabaseQueryBuilder {
    this.chain = this.chain.or(filter);
    return this;
  }

  gt(column: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.gt(column, value);
    return this;
  }

  gte(column: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.gte(column, value);
    return this;
  }

  not(column: string, op: string, value: unknown): DatabaseQueryBuilder {
    this.chain = this.chain.not(column, op, value);
    return this;
  }

  in(column: string, values: unknown[]): DatabaseQueryBuilder {
    this.chain = this.chain.in(column, values);
    return this;
  }

  match(params: Record<string, unknown>): DatabaseQueryBuilder {
    this.chain = this.chain.match(params);
    return this;
  }

  order(column: string, options?: any): DatabaseQueryBuilder {
    this.chain = this.chain.order(column, options);
    return this;
  }

  limit(count: number): DatabaseQueryBuilder {
    this.chain = this.chain.limit(count);
    return this;
  }

  async single(): Promise<{ data: any; error: any }> {
    return this.chain.single();
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    return this.chain.maybeSingle();
  }

  async selectWithResult(): Promise<{ data: any[]; error: any }> {
    const result = await this.chain;
    return { data: result.data ?? [], error: result.error };
  }

  async execute(): Promise<{ data: any; error: any }> {
    return this.chain;
  }
}

/* ───────────────────────────── Factory ───────────────────────────── */

export interface DatabaseConfig {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
}

export function createDatabase(config: DatabaseConfig): Database {
  const url = (config.url || '').replace(/\/rest\/v1\/?$/, '');
  const key = config.serviceRoleKey || config.anonKey;

  if (!url || !url.startsWith('http')) {
    throw new Error(
      'SUPABASE_URL inválida. Use a URL do projeto (ex: https://xxxx.supabase.co), sem /rest/v1/'
    );
  }

  const isPlaceholderKey =
    !key || key === 'YOUR_SUPABASE_ANON_KEY' || !key.startsWith('eyJ');

  if (isPlaceholderKey) {
    throw new Error(
      'SUPABASE_KEY inválida. Configure a chave JWT do projeto no arquivo .env'
    );
  }

  if (
    !config.serviceRoleKey ||
    !config.serviceRoleKey.startsWith('eyJ') ||
    config.serviceRoleKey.includes('COLE_AQUI')
  ) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY inválida. No Dashboard → API Keys → legacy service_role, cole no .env'
    );
  }

  const client = createClient(url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return new Database(client);
}

/* ─────────────────────────── Singleton / injeção ─────────────────── */

let instance: Database | null = null;

export function getDatabase(): Database {
  if (!instance) {
    instance = createDatabase({
      url: process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '') || '',
      anonKey: process.env.SUPABASE_KEY,
      serviceRoleKey:
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    });
  }
  return instance;
}

/** Substitui a instância global — usado em testes para injetar mocks. */
export function setDatabase(database: Database): Database {
  instance = database;
  return database;
}

/** Reseta a instância global (força recriação no próximo getDatabase). */
export function resetDatabase(): void {
  instance = null;
}
