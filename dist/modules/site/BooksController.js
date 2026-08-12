"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = void 0;
const crypto_1 = require("crypto");
const siteDatabase_1 = require("../../config/siteDatabase");
class BooksController {
    /** GET /site/books ou /admin/books — lista livros */
    async list(_request, response) {
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, books: data || [] });
    }
    /** GET /admin/books/:id — busca por ID */
    async getById(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('books')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            return response.status(400).json({ message: error.message });
        if (!data)
            return response.status(404).json({ message: 'Livro não encontrado' });
        return response.json({ success: true, book: data });
    }
    /** POST /admin/books — cria registro na tabela books */
    async create(request, response) {
        const { title, author, publishedYear, rating, badge, category, coverUrl, summary, keyTakeaways } = request.body;
        if (!title || !author || !summary) {
            return response.status(400).json({ message: 'Campos obrigatórios: title, author, summary' });
        }
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const id = (0, crypto_1.randomUUID)();
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
        if (error)
            return response.status(400).json({ message: error.message });
        return response.status(201).json({ success: true, book: data });
    }
    /** PUT /admin/books/:id — atualiza registro na tabela books */
    async update(request, response) {
        const { id } = request.params;
        const { title, author, publishedYear, rating, badge, category, coverUrl, summary, keyTakeaways } = request.body;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const updatePayload = {};
        if (title !== undefined)
            updatePayload.title = title;
        if (author !== undefined)
            updatePayload.author = author;
        if (publishedYear !== undefined)
            updatePayload.published_year = publishedYear;
        if (rating !== undefined)
            updatePayload.rating = rating;
        if (badge !== undefined)
            updatePayload.badge = badge;
        if (category !== undefined)
            updatePayload.category = category;
        if (coverUrl !== undefined)
            updatePayload.cover_url = coverUrl;
        if (summary !== undefined)
            updatePayload.summary = summary;
        if (keyTakeaways !== undefined)
            updatePayload.key_takeaways = keyTakeaways;
        const { data, error } = await db
            .from('books')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, book: data });
    }
    /** DELETE /admin/books/:id — exclui registro da tabela books */
    async delete(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { error } = await db.from('books').delete().eq('id', id);
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, message: 'Livro excluído da tabela books' });
    }
}
exports.BooksController = BooksController;
//# sourceMappingURL=BooksController.js.map