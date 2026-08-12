import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { getSiteDatabase } from '../../config/siteDatabase';

export const ALLOWED_POST_CATEGORIES = [
  'FINANCEIRO',
  'INVESTIMENTOS',
  'EDUCACAO',
] as const;

type PostRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  category: string;
  author: string | null;
  views: number;
  created_at: string;
  updated_at: string;
};

type BookRow = {
  id: string;
  title: string;
  author: string;
  published_year: number;
  rating: number;
  badge: string;
  category: string;
  cover_url: string | null;
  summary: string;
  key_takeaways: any;
  created_at: string;
};

type MarketAssetRow = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getSiteTableForCategory(category: string): 'financial' | 'investments' {
  const catUpper = (category || '').toUpperCase();
  if (catUpper.includes('FINAN') || catUpper === 'FINANCEIRO') {
    return 'financial';
  }
  return 'investments';
}

function toApiPost(row: PostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    category: row.category,
    author: row.author ?? undefined,
    views: row.views ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateRequiredFields(body: Record<string, unknown>) {
  const { title, content, excerpt, coverImage, category } = body;

  if (!title || typeof title !== 'string') {
    return 'Title is required';
  }
  if (!content || typeof content !== 'string') {
    return 'Content is required';
  }
  if (!excerpt || typeof excerpt !== 'string') {
    return 'Excerpt is required';
  }
  if (!coverImage || typeof coverImage !== 'string') {
    return 'Cover image is required';
  }
  if (!category || typeof category !== 'string') {
    return 'Category is required';
  }
  return null;
}

async function findPostBySlug(slug: string): Promise<{ row: PostRow; table: 'financial' | 'investments' } | null> {
  const db = getSiteDatabase();

  const { data: finData } = await db.from('financial').select('*').eq('slug', slug).maybeSingle();
  if (finData) {
    return { row: finData as PostRow, table: 'financial' };
  }

  const { data: invData } = await db.from('investments').select('*').eq('slug', slug).maybeSingle();
  if (invData) {
    return { row: invData as PostRow, table: 'investments' };
  }

  return null;
}

async function findPostById(id: string): Promise<{ row: PostRow; table: 'financial' | 'investments' } | null> {
  const db = getSiteDatabase();

  const { data: finData } = await db.from('financial').select('*').eq('id', id).maybeSingle();
  if (finData) {
    return { row: finData as PostRow, table: 'financial' };
  }

  const { data: invData } = await db.from('investments').select('*').eq('id', id).maybeSingle();
  if (invData) {
    return { row: invData as PostRow, table: 'investments' };
  }

  return null;
}

export class SiteContentController {
  // ─── POSTS / ARTIGOS DO SITE (financial e investments) ───

  /** GET /site/articles — lista pública unificada */
  async listPublic(_request: Request, response: Response) {
    const db = getSiteDatabase();

    const [finRes, invRes] = await Promise.all([
      db.from('financial').select('*'),
      db.from('investments').select('*'),
    ]);

    const finPosts = (finRes.data as PostRow[]) || [];
    const invPosts = (invRes.data as PostRow[]) || [];

    const all = [...finPosts, ...invPosts].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return response.json({
      success: true,
      posts: all.map(toApiPost),
    });
  }

  /** GET /posts/:slug — detalhe público por slug */
  async getBySlug(request: Request, response: Response) {
    const { slug } = request.params;
    const found = await findPostBySlug(slug);

    if (!found) {
      return response.status(404).json({ message: 'Post not found' });
    }

    return response.json({
      success: true,
      post: toApiPost(found.row),
    });
  }

  /** POST /posts/:slug/view — incrementa visualizações */
  async trackView(request: Request, response: Response) {
    const { slug } = request.params;
    const found = await findPostBySlug(slug);

    if (!found) {
      return response.status(404).json({ message: 'Post not found' });
    }

    const db = getSiteDatabase();
    const nextViews = (found.row.views ?? 0) + 1;

    const { data, error } = await db
      .from(found.table)
      .update({ views: nextViews, updated_at: new Date().toISOString() })
      .eq('id', found.row.id)
      .select('views')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, views: data.views });
  }

  /** GET /admin/posts — lista admin */
  async listAdmin(_request: Request, response: Response) {
    const db = getSiteDatabase();

    const [finRes, invRes] = await Promise.all([
      db.from('financial').select('*'),
      db.from('investments').select('*'),
    ]);

    const finPosts = (finRes.data as PostRow[]) || [];
    const invPosts = (invRes.data as PostRow[]) || [];

    const all = [...finPosts, ...invPosts].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const posts = all.map(toApiPost);
    const categories = Array.from(
      new Set(posts.map((p) => p.category).filter(Boolean))
    );

    return response.json({
      success: true,
      posts,
      categories,
      allowedCategories: ALLOWED_POST_CATEGORIES,
    });
  }

  /** GET /admin/posts/:id */
  async getById(request: Request, response: Response) {
    const id = String(request.params.id || '');

    if (!id) {
      return response.status(400).json({ message: 'Post ID is required' });
    }

    const found = await findPostById(id);
    if (!found) {
      return response.status(404).json({ message: 'Post not found' });
    }

    return response.json({
      success: true,
      post: toApiPost(found.row),
    });
  }

  /** POST /admin/posts — cria post na tabela correspondente do site */
  async create(request: Request, response: Response) {
    const validationError = validateRequiredFields(request.body);
    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const { title, content, excerpt, coverImage, category, author } = request.body;
    const id = randomUUID();
    const slug = `${slugify(title)}-${id.slice(0, 8)}`;
    const now = new Date().toISOString();
    const table = getSiteTableForCategory(category);
    const db = getSiteDatabase();

    const { data, error } = await db
      .from(table)
      .insert([
        {
          id,
          slug,
          title,
          content,
          excerpt,
          cover_image: coverImage,
          category,
          author: author || null,
          views: 0,
          created_at: now,
          updated_at: now,
        },
      ])
      .select('*')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json({
      success: true,
      message: 'Post created',
      post: toApiPost(data as PostRow),
    });
  }

  /** PUT /admin/posts/:id — atualiza post no site */
  async update(request: Request, response: Response) {
    const id = String(request.params.id || '');
    const { title, content, excerpt, coverImage, category, author } = request.body;

    if (!id) {
      return response.status(400).json({ message: 'Post ID is required' });
    }

    const found = await findPostById(id);
    if (!found) {
      return response.status(404).json({ message: 'Post not found' });
    }

    const db = getSiteDatabase();
    const newCategory = category || found.row.category;
    const newTable = getSiteTableForCategory(newCategory);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updatePayload.title = title;
      if (title !== found.row.title) {
        updatePayload.slug = `${slugify(title)}-${id.slice(0, 8)}`;
      }
    }
    if (content !== undefined) updatePayload.content = content;
    if (excerpt !== undefined) updatePayload.excerpt = excerpt;
    if (coverImage !== undefined) updatePayload.cover_image = coverImage;
    if (category !== undefined) updatePayload.category = category;
    if (author !== undefined) updatePayload.author = author || null;

    if (newTable !== found.table) {
      const mergedRow = {
        ...found.row,
        ...updatePayload,
      };

      await db.from(found.table).delete().eq('id', id);
      const { data: inserted, error: insertError } = await db
        .from(newTable)
        .insert([mergedRow])
        .select('*')
        .single();

      if (insertError) {
        return response.status(400).json({ message: insertError.message });
      }

      return response.json({
        success: true,
        message: 'Post updated',
        post: toApiPost(inserted as PostRow),
      });
    }

    const { data, error } = await db
      .from(found.table)
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({
      success: true,
      message: 'Post updated',
      post: toApiPost(data as PostRow),
    });
  }

  /** DELETE /admin/posts/:id */
  async delete(request: Request, response: Response) {
    const id = String(request.params.id || '');

    if (!id) {
      return response.status(400).json({ message: 'Post ID is required' });
    }

    const found = await findPostById(id);
    if (!found) {
      return response.status(404).json({ message: 'Post not found' });
    }

    const db = getSiteDatabase();
    const { error } = await db.from(found.table).delete().eq('id', id);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, message: 'Post deleted' });
  }

  /** GET /admin/posts/analytics */
  async analytics(_request: Request, response: Response) {
    const db = getSiteDatabase();

    const [finRes, invRes] = await Promise.all([
      db.from('financial').select('id, title, slug, category, views, created_at'),
      db.from('investments').select('id, title, slug, category, views, created_at'),
    ]);

    const posts = [
      ...((finRes.data as any[]) || []),
      ...((invRes.data as any[]) || []),
    ].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

    const totalViews = posts.reduce((sum: number, p: any) => sum + (p.views ?? 0), 0);
    const byCategory: Record<string, number> = {};
    for (const p of posts) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    }

    return response.json({
      success: true,
      totalPosts: posts.length,
      totalViews,
      byCategory,
      topPosts: posts.slice(0, 10).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        views: p.views ?? 0,
        createdAt: p.created_at,
      })),
    });
  }

  // ─── BOOKS DO SITE (books CRUD) ───

  /** GET /admin/books ou /site/books — lista livros */
  async listBooks(_request: Request, response: Response) {
    const db = getSiteDatabase();
    const { data, error } = await db.from('books').select('*').order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, books: data || [] });
  }

  /** POST /admin/books — adiciona livro */
  async createBook(request: Request, response: Response) {
    const { title, author, publishedYear, rating, badge, category, coverUrl, summary, keyTakeaways } = request.body;

    if (!title || !author || !summary) {
      return response.status(400).json({ message: 'Title, author, and summary are required' });
    }

    const db = getSiteDatabase();
    const id = randomUUID();

    const { data, error } = await db
      .from('books')
      .insert([
        {
          id,
          title,
          author,
          published_year: publishedYear || new Date().getFullYear(),
          rating: rating ?? 5.0,
          badge: badge || 'Recomendado',
          category: category || 'Finanças',
          cover_url: coverUrl || null,
          summary,
          key_takeaways: keyTakeaways || [],
        },
      ])
      .select('*')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json({ success: true, book: data });
  }

  /** PUT /admin/books/:id — atualiza livro */
  async updateBook(request: Request, response: Response) {
    const id = String(request.params.id || '');
    if (!id) {
      return response.status(400).json({ message: 'Book ID is required' });
    }

    const db = getSiteDatabase();
    const { title, author, publishedYear, rating, badge, category, coverUrl, summary, keyTakeaways } = request.body;

    const updatePayload: Record<string, unknown> = {};
    if (title !== undefined) updatePayload.title = title;
    if (author !== undefined) updatePayload.author = author;
    if (publishedYear !== undefined) updatePayload.published_year = publishedYear;
    if (rating !== undefined) updatePayload.rating = rating;
    if (badge !== undefined) updatePayload.badge = badge;
    if (category !== undefined) updatePayload.category = category;
    if (coverUrl !== undefined) updatePayload.cover_url = coverUrl;
    if (summary !== undefined) updatePayload.summary = summary;
    if (keyTakeaways !== undefined) updatePayload.key_takeaways = keyTakeaways;

    const { data, error } = await db.from('books').update(updatePayload).eq('id', id).select('*').single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, book: data });
  }

  /** DELETE /admin/books/:id — exclui livro */
  async deleteBook(request: Request, response: Response) {
    const id = String(request.params.id || '');
    if (!id) {
      return response.status(400).json({ message: 'Book ID is required' });
    }

    const db = getSiteDatabase();
    const { error } = await db.from('books').delete().eq('id', id);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, message: 'Book deleted' });
  }

  // ─── MARKET ASSETS DO SITE (market_assets CRUD) ───

  /** GET /admin/market-assets ou /site/market-assets — lista ativos */
  async listMarketAssets(_request: Request, response: Response) {
    const db = getSiteDatabase();
    const { data, error } = await db
      .from('market_assets')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, assets: data || [] });
  }

  /** POST /admin/market-assets — cria novo ativo de mercado */
  async createMarketAsset(request: Request, response: Response) {
    const { symbol, name, price, changePercent, sortOrder, isActive } = request.body;

    if (!symbol || !name || price === undefined) {
      return response.status(400).json({ message: 'Symbol, name, and price are required' });
    }

    const db = getSiteDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('market_assets')
      .insert([
        {
          id,
          symbol,
          name,
          price,
          change_percent: changePercent ?? 0,
          sort_order: sortOrder ?? 0,
          is_active: isActive ?? true,
          created_at: now,
          updated_at: now,
        },
      ])
      .select('*')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json({ success: true, asset: data });
  }

  /** PUT /admin/market-assets/:id — atualiza ativo de mercado */
  async updateMarketAsset(request: Request, response: Response) {
    const id = String(request.params.id || '');
    if (!id) {
      return response.status(400).json({ message: 'Asset ID is required' });
    }

    const { symbol, name, price, changePercent, sortOrder, isActive } = request.body;
    const db = getSiteDatabase();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (symbol !== undefined) updatePayload.symbol = symbol;
    if (name !== undefined) updatePayload.name = name;
    if (price !== undefined) updatePayload.price = price;
    if (changePercent !== undefined) updatePayload.change_percent = changePercent;
    if (sortOrder !== undefined) updatePayload.sort_order = sortOrder;
    if (isActive !== undefined) updatePayload.is_active = isActive;

    const { data, error } = await db.from('market_assets').update(updatePayload).eq('id', id).select('*').single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, asset: data });
  }

  /** DELETE /admin/market-assets/:id — exclui ativo */
  async deleteMarketAsset(request: Request, response: Response) {
    const id = String(request.params.id || '');
    if (!id) {
      return response.status(400).json({ message: 'Asset ID is required' });
    }

    const db = getSiteDatabase();
    const { error } = await db.from('market_assets').delete().eq('id', id);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, message: 'Asset deleted' });
  }
}
