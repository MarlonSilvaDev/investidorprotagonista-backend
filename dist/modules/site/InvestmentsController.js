"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsController = void 0;
const crypto_1 = require("crypto");
const siteDatabase_1 = require("../../config/siteDatabase");
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
class InvestmentsController {
    /** GET /site/investments ou /admin/investments — lista pública/admin */
    async list(_request, response) {
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('investments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({ success: true, items: data || [] });
    }
    /** GET /site/investments/:slug — busca por slug */
    async getBySlug(request, response) {
        const { slug } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('investments')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        if (error)
            return response.status(400).json({ message: error.message });
        if (!data)
            return response.status(404).json({ message: 'Artigo de investimento não encontrado' });
        return response.json({ success: true, item: data });
    }
    /** GET /admin/investments/:id — busca por ID */
    async getById(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('investments')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            return response.status(400).json({ message: error.message });
        if (!data)
            return response.status(404).json({ message: 'Artigo de investimento não encontrado' });
        return response.json({ success: true, item: data });
    }
    /** POST /admin/investments — cria registro na tabela investments */
    async create(request, response) {
        const { title, content, excerpt, coverImage, category, author } = request.body;
        if (!title || !content || !excerpt || !coverImage) {
            return response.status(400).json({ message: 'Campos obrigatórios: title, content, excerpt, coverImage' });
        }
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const id = (0, crypto_1.randomUUID)();
        const slug = `${slugify(title)}-${id.slice(0, 8)}`;
        const now = new Date().toISOString();
        const { data, error } = await db
            .from('investments')
            .insert([
            {
                id,
                slug,
                title,
                content,
                excerpt,
                cover_image: coverImage,
                category: category || 'Investimentos',
                author: author || null,
                views: 0,
                created_at: now,
                updated_at: now,
            },
        ])
            .select('*')
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.status(201).json({ success: true, item: data });
    }
    /** PUT /admin/investments/:id — atualiza registro na tabela investments */
    async update(request, response) {
        const { id } = request.params;
        const { title, content, excerpt, coverImage, category, author } = request.body;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const updatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (title !== undefined) {
            updatePayload.title = title;
            updatePayload.slug = `${slugify(title)}-${id.slice(0, 8)}`;
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
        const { data, error } = await db
            .from('investments')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, item: data });
    }
    /** DELETE /admin/investments/:id — exclui registro da tabela investments */
    async delete(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { error } = await db.from('investments').delete().eq('id', id);
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, message: 'Item excluído da tabela investments' });
    }
}
exports.InvestmentsController = InvestmentsController;
//# sourceMappingURL=InvestmentsController.js.map