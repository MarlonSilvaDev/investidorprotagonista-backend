import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { supabaseAdmin } from '../../database/supabase';

export const ALLOWED_POST_CATEGORIES = [
  'FINANCEIRO',
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
  if (!ALLOWED_POST_CATEGORIES.includes(category as (typeof ALLOWED_POST_CATEGORIES)[number])) {
    return `Category must be one of: ${ALLOWED_POST_CATEGORIES.join(', ')}`;
  }
  return null;
}

export class PostController {
  /** GET /posts — lista pública */
  async listPublic(_request: Request, response: Response) {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({
      success: true,
      posts: (data as PostRow[]).map(toApiPost),
    });
  }

  /** GET /posts/:slug — detalhe público */
  async getBySlug(request: Request, response: Response) {
    const { slug } = request.params;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return response.status(400).json({ message: error.message });
    }
    if (!data) {
      return response.status(404).json({ message: 'Post not found' });
    }

    return response.json({
      success: true,
      post: toApiPost(data as PostRow),
    });
  }

  /** POST /posts/:slug/view — incrementa views (público) */
  async trackView(request: Request, response: Response) {
    const { slug } = request.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, views')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError) {
      return response.status(400).json({ message: fetchError.message });
    }
    if (!existing) {
      return response.status(404).json({ message: 'Post not found' });
    }

    const nextViews = (existing.views ?? 0) + 1;
    const { data, error } = await supabaseAdmin
      .from('posts')
      .update({ views: nextViews, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('views')
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, views: data.views });
  }

  /** GET /admin/posts — lista admin + categorias */
  async listAdmin(_request: Request, response: Response) {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    const posts = (data as PostRow[]).map(toApiPost);
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

    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return response.status(400).json({ message: error.message });
    }
    if (!data) {
      return response.status(404).json({ message: 'Post not found' });
    }

    return response.json({
      success: true,
      post: toApiPost(data as PostRow),
    });
  }

  /** POST /admin/posts */
  async create(request: Request, response: Response) {
    const validationError = validateRequiredFields(request.body);
    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const { title, content, excerpt, coverImage, category, author } = request.body;
    const id = randomUUID();
    const slug = `${slugify(title)}-${id.slice(0, 8)}`;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('posts')
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

  /** PUT /admin/posts/:id */
  async update(request: Request, response: Response) {
    const id = String(request.params.id || '');
    const { title, content, excerpt, coverImage, category, author } = request.body;

    if (!id) {
      return response.status(400).json({ message: 'Post ID is required' });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return response.status(400).json({ message: fetchError.message });
    }
    if (!existing) {
      return response.status(404).json({ message: 'Post not found' });
    }

    if (category !== undefined) {
      if (
        !ALLOWED_POST_CATEGORIES.includes(
          category as (typeof ALLOWED_POST_CATEGORIES)[number]
        )
      ) {
        return response.status(400).json({
          message: `Category must be one of: ${ALLOWED_POST_CATEGORIES.join(', ')}`,
        });
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updatePayload.title = title;
      if (title !== existing.title) {
        updatePayload.slug = `${slugify(title)}-${id.slice(0, 8)}`;
      }
    }
    if (content !== undefined) updatePayload.content = content;
    if (excerpt !== undefined) updatePayload.excerpt = excerpt;
    if (coverImage !== undefined) updatePayload.cover_image = coverImage;
    if (category !== undefined) updatePayload.category = category;
    if (author !== undefined) updatePayload.author = author || null;

    const { data, error } = await supabaseAdmin
      .from('posts')
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

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return response.status(400).json({ message: fetchError.message });
    }
    if (!existing) {
      return response.status(404).json({ message: 'Post not found' });
    }

    const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ success: true, message: 'Post deleted' });
  }

  /** GET /admin/posts/analytics */
  async analytics(_request: Request, response: Response) {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, slug, category, views, created_at')
      .order('views', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    const posts = data ?? [];
    const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const byCategory: Record<string, number> = {};
    for (const p of posts) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    }

    return response.json({
      success: true,
      totalPosts: posts.length,
      totalViews,
      byCategory,
      topPosts: posts.slice(0, 10).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        views: p.views ?? 0,
        createdAt: p.created_at,
      })),
    });
  }
}
