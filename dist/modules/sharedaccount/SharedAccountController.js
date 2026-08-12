"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedAccountController = void 0;
const supabase_1 = require("../../config/supabase");
const MailService_1 = require("../../core/utils/MailService");
const i18n_1 = require("../../core/utils/i18n");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function normalizeEmail(email) {
    return String(email ?? '')
        .trim()
        .toLowerCase();
}
function mapSharedAccount(row) {
    return {
        id: row.id,
        owner_id: row.owner_id,
        partner_id: row.partner_id,
        partner_name: row.partner_name,
        partner_email: row.partner_email,
        partner_avatar_url: row.partner_avatar_url,
        owner_permission: row.owner_permission,
        partner_permission: row.partner_permission,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}
class SharedAccountController {
    /**
     * POST /shared/invite
     * Body: { email }
     */
    async invite(request, response) {
        const { id: userId } = request.user;
        const email = normalizeEmail(request.body?.email);
        if (!email) {
            return response.status(400).json({ message: 'email is required' });
        }
        if (!EMAIL_RE.test(email)) {
            return response.status(400).json({ message: 'Invalid email format' });
        }
        const { data: ownerProfile, error: ownerError } = await supabase_1.supabase
            .from('profiles')
            .select('id, email, name')
            .eq('id', userId)
            .maybeSingle();
        if (ownerError || !ownerProfile) {
            return response.status(400).json({ message: 'Owner profile not found' });
        }
        if (normalizeEmail(ownerProfile.email) === email) {
            return response.status(400).json({ message: 'Cannot share account with yourself' });
        }
        const { data: existingShare } = await supabase_1.supabase
            .from('shared_accounts')
            .select('id')
            .eq('is_active', true)
            .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
            .limit(1)
            .maybeSingle();
        if (existingShare) {
            return response.status(409).json({
                message: 'You already have an active shared account. Unlink first.',
            });
        }
        const { data: pendingInvite } = await supabase_1.supabase
            .from('shared_account_invites')
            .select('id')
            .eq('owner_id', userId)
            .eq('partner_email', email)
            .eq('status', 'pending')
            .limit(1)
            .maybeSingle();
        if (pendingInvite) {
            return response.status(409).json({
                message: 'Invite already pending for this email',
                invite_id: pendingInvite.id,
            });
        }
        const { data: invite, error } = await supabase_1.supabase
            .from('shared_account_invites')
            .insert([
            {
                owner_id: userId,
                partner_email: email,
                status: 'pending',
            },
        ])
            .select()
            .single();
        if (error || !invite) {
            return response.status(400).json({
                message: error?.message ?? 'Failed to create invite',
            });
        }
        try {
            const locale = (0, i18n_1.resolveLocale)(request.body?.locale);
            const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
            await (0, MailService_1.sendSharedInviteEmail)({
                to: email,
                ownerName: ownerProfile.name || ownerProfile.email || 'Parceiro',
                inviteId: invite.id,
                acceptHintUrl: `${frontendBase}/shared-accounts?invite_id=${invite.id}`,
                locale,
            });
        }
        catch (mailError) {
            // Convite permanece válido mesmo se o SMTP falhar.
            console.warn('[SharedAccount] Failed to send invite email:', mailError instanceof Error ? mailError.message : mailError);
        }
        return response.status(201).json({
            invite_id: invite.id,
            partner_email: invite.partner_email,
            status: invite.status,
            expires_at: invite.expires_at,
        });
    }
    /**
     * POST /shared/accept
     * Body: { invite_id }
     */
    async accept(request, response) {
        const { id: userId } = request.user;
        const inviteId = String(request.body?.invite_id ?? '').trim();
        if (!inviteId) {
            return response.status(400).json({ message: 'invite_id is required' });
        }
        const { data: invite, error: inviteError } = await supabase_1.supabase
            .from('shared_account_invites')
            .select('*')
            .eq('id', inviteId)
            .maybeSingle();
        if (inviteError || !invite) {
            return response.status(404).json({ message: 'Invite not found' });
        }
        if (invite.status !== 'pending') {
            return response.status(400).json({ message: `Invite is ${invite.status}` });
        }
        if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
            await supabase_1.supabase
                .from('shared_account_invites')
                .update({ status: 'expired', updated_at: new Date().toISOString() })
                .eq('id', inviteId);
            return response.status(400).json({ message: 'Invite expired' });
        }
        if (invite.owner_id === userId) {
            return response.status(400).json({ message: 'Owner cannot accept own invite' });
        }
        const { data: partnerProfile, error: partnerError } = await supabase_1.supabase
            .from('profiles')
            .select('id, email, name, avatar_url')
            .eq('id', userId)
            .maybeSingle();
        if (partnerError || !partnerProfile) {
            return response.status(400).json({ message: 'Partner profile not found' });
        }
        if (normalizeEmail(partnerProfile.email) !== normalizeEmail(invite.partner_email)) {
            return response.status(403).json({
                message: 'Invite email does not match the authenticated user',
            });
        }
        const { data: existingShare } = await supabase_1.supabase
            .from('shared_accounts')
            .select('id')
            .eq('is_active', true)
            .or(`owner_id.eq.${invite.owner_id},partner_id.eq.${invite.owner_id},owner_id.eq.${userId},partner_id.eq.${userId}`)
            .limit(1)
            .maybeSingle();
        if (existingShare) {
            return response.status(409).json({
                message: 'One of the users already has an active shared account',
            });
        }
        const { data: ownerProfile } = await supabase_1.supabase
            .from('profiles')
            .select('id, name, email, avatar_url')
            .eq('id', invite.owner_id)
            .maybeSingle();
        const { data: shared, error: shareError } = await supabase_1.supabase
            .from('shared_accounts')
            .insert([
            {
                owner_id: invite.owner_id,
                partner_id: userId,
                partner_name: partnerProfile.name ?? partnerProfile.email,
                partner_email: partnerProfile.email,
                partner_avatar_url: partnerProfile.avatar_url ?? null,
                owner_permission: 'full',
                partner_permission: 'full',
                is_active: true,
            },
        ])
            .select()
            .single();
        if (shareError || !shared) {
            return response.status(400).json({
                message: shareError?.message ?? 'Failed to create shared account',
            });
        }
        await supabase_1.supabase
            .from('shared_account_invites')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', inviteId);
        return response.json({
            message: 'Invite accepted',
            shared_account: mapSharedAccount(shared),
            owner: ownerProfile
                ? {
                    id: ownerProfile.id,
                    name: ownerProfile.name,
                    email: ownerProfile.email,
                }
                : null,
        });
    }
    /**
     * POST /shared/unlink
     */
    async unlink(request, response) {
        const { id: userId } = request.user;
        const { data: shares, error } = await supabase_1.supabase
            .from('shared_accounts')
            .select('id')
            .eq('is_active', true)
            .or(`owner_id.eq.${userId},partner_id.eq.${userId}`);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        if (!shares?.length) {
            return response.status(404).json({ message: 'No active shared account found' });
        }
        const ids = shares.map((s) => s.id);
        const { error: updateError } = await supabase_1.supabase
            .from('shared_accounts')
            .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
            .in('id', ids);
        if (updateError) {
            return response.status(400).json({ message: updateError.message });
        }
        // Cancela convites pendentes do usuário como owner.
        await supabase_1.supabase
            .from('shared_account_invites')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('owner_id', userId)
            .eq('status', 'pending');
        return response.json({ message: 'Shared account unlinked', unlinked: ids.length });
    }
    /**
     * GET /shared/list  (também GET /shared/)
     * Retorna conta ativa + convites pendentes relevantes.
     */
    async list(request, response) {
        const { id: userId } = request.user;
        const { data: profile } = await supabase_1.supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
        const { data: sharedRows, error: sharedError } = await supabase_1.supabase
            .from('shared_accounts')
            .select('*')
            .eq('is_active', true)
            .or(`owner_id.eq.${userId},partner_id.eq.${userId}`);
        if (sharedError) {
            return response.status(400).json({ message: sharedError.message });
        }
        const email = normalizeEmail(profile?.email);
        let pendingQuery = supabase_1.supabase
            .from('shared_account_invites')
            .select('*')
            .eq('status', 'pending');
        if (email) {
            // Aspas duplas evitam quebra do filtro PostgREST com '@' no e-mail.
            pendingQuery = pendingQuery.or(`owner_id.eq.${userId},partner_email.eq."${email}"`);
        }
        else {
            pendingQuery = pendingQuery.eq('owner_id', userId);
        }
        const { data: pendingInvites, error: inviteError } = await pendingQuery;
        if (inviteError) {
            return response.status(400).json({ message: inviteError.message });
        }
        const sharedAccounts = (sharedRows ?? []).map((row) => mapSharedAccount(row));
        return response.json({
            shared_account: sharedAccounts[0] ?? null,
            shared_accounts: sharedAccounts,
            pending_invites: pendingInvites ?? [],
        });
    }
}
exports.SharedAccountController = SharedAccountController;
//# sourceMappingURL=SharedAccountController.js.map