"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = exports.ALLOWED_POST_CATEGORIES = void 0;
const crypto_1 = require("crypto");
const supabase_1 = require("../../config/supabase");
exports.ALLOWED_POST_CATEGORIES = [
    'FINANCEIRO',
    'EDUCACAO',
];
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function toApiPost(row) {
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
function validateRequiredFields(body) {
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
    if (!exports.ALLOWED_POST_CATEGORIES.includes(category)) {
        return `Category must be one of: ${exports.ALLOWED_POST_CATEGORIES.join(', ')}`;
    }
    return null;
}
class PostController {
    /** GET /posts — lista pública */
    async listPublic(_request, response) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({
            success: true,
            posts: data.map(toApiPost),
        });
    }
    /** GET /posts/:slug — detalhe público */
    async getBySlug(request, response) {
        const { slug } = request.params;
        const { data, error } = await supabase_1.supabaseAdmin
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
            post: toApiPost(data),
        });
    }
    /** POST /posts/:slug/view — incrementa views (público) */
    async trackView(request, response) {
        const { slug } = request.params;
        const { data: existing, error: fetchError } = await supabase_1.supabaseAdmin
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
        const { data, error } = await supabase_1.supabaseAdmin
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
    async listAdmin(_request, response) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        const posts = data.map(toApiPost);
        const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
        return response.json({
            success: true,
            posts,
            categories,
            allowedCategories: exports.ALLOWED_POST_CATEGORIES,
        });
    }
    /** GET /admin/posts/:id */
    async getById(request, response) {
        const id = String(request.params.id || '');
        if (!id) {
            return response.status(400).json({ message: 'Post ID is required' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
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
            post: toApiPost(data),
        });
    }
    /** POST /admin/posts */
    async create(request, response) {
        const validationError = validateRequiredFields(request.body);
        if (validationError) {
            return response.status(400).json({ message: validationError });
        }
        const { title, content, excerpt, coverImage, category, author } = request.body;
        const id = (0, crypto_1.randomUUID)();
        const slug = `${slugify(title)}-${id.slice(0, 8)}`;
        const now = new Date().toISOString();
        const { data, error } = await supabase_1.supabaseAdmin
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
            post: toApiPost(data),
        });
    }
    /** PUT /admin/posts/:id */
    async update(request, response) {
        const id = String(request.params.id || '');
        const { title, content, excerpt, coverImage, category, author } = request.body;
        if (!id) {
            return response.status(400).json({ message: 'Post ID is required' });
        }
        const { data: existing, error: fetchError } = await supabase_1.supabaseAdmin
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
            if (!exports.ALLOWED_POST_CATEGORIES.includes(category)) {
                return response.status(400).json({
                    message: `Category must be one of: ${exports.ALLOWED_POST_CATEGORIES.join(', ')}`,
                });
            }
        }
        const updatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (title !== undefined) {
            updatePayload.title = title;
            if (title !== existing.title) {
                updatePayload.slug = `${slugify(title)}-${id.slice(0, 8)}`;
            }
        }
        if (content !== undefined)
            updatePayload.content = content;
        if (excerpt !== undefined)
            updatePayload.excerpt = excerpt;
        if (coverImage !== undefined)
            updatePayload.cover_image = coverImage;
        if (category !== undefined)
            updatePayload.category = category;
        if (author !== undefined)
            updatePayload.author = author || null;
        const { data, error } = await supabase_1.supabaseAdmin
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
            post: toApiPost(data),
        });
    }
    /** DELETE /admin/posts/:id */
    async delete(request, response) {
        const id = String(request.params.id || '');
        if (!id) {
            return response.status(400).json({ message: 'Post ID is required' });
        }
        const { data: existing, error: fetchError } = await supabase_1.supabaseAdmin
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
        const { error } = await supabase_1.supabaseAdmin.from('posts').delete().eq('id', id);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({ success: true, message: 'Post deleted' });
    }
    /** GET /admin/posts/analytics */
    async analytics(_request, response) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select('id, title, slug, category, views, created_at')
            .order('views', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        const posts = data ?? [];
        const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);
        const byCategory = {};
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
exports.PostController = PostController;
//# sourceMappingURL=PostController.js.map