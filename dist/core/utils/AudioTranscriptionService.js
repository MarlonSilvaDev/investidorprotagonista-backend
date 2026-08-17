"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioTranscriptionService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Serviço de Transcrição de Áudio (Speech-to-Text).
 * Suporta formatos de áudio do WhatsApp (OGG, Opus, MP3, WAV, AAC).
 * Utiliza OpenAI Whisper, Groq Whisper ou Gemini Audio se configurado no .env,
 * com fallback inteligente para processamento de comandos de voz.
 */
class AudioTranscriptionService {
    /**
     * Transcreve um áudio a partir de uma URL ou buffer/base64.
     */
    static async transcribeAudio(params) {
        try {
            const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
            // 1. Se houver chave OpenAI / Groq configurada, usa Whisper API
            if (apiKey && (params.audioUrl || params.audioBase64)) {
                let audioBuffer;
                if (params.audioBase64) {
                    audioBuffer = Buffer.from(params.audioBase64, 'base64');
                }
                else if (params.audioUrl) {
                    const response = await axios_1.default.get(params.audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                    });
                    audioBuffer = Buffer.from(response.data);
                }
                else {
                    return null;
                }
                const isGroq = !!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY;
                const apiUrl = isGroq
                    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
                    : 'https://api.openai.com/v1/audio/transcriptions';
                const FormData = require('form-data');
                const form = new FormData();
                form.append('file', audioBuffer, {
                    filename: 'whatsapp_audio.ogg',
                    contentType: params.mimeType || 'audio/ogg',
                });
                form.append('model', isGroq ? 'whisper-large-v3' : 'whisper-1');
                form.append('language', 'pt');
                form.append('prompt', 'Áudio de controle financeiro pessoal com valores em reais, gastos, receitas, compras e despesas.');
                const res = await axios_1.default.post(apiUrl, form, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        ...form.getHeaders(),
                    },
                    timeout: 20000,
                });
                if (res.data && res.data.text) {
                    return res.data.text.trim();
                }
            }
            // 2. Se nenhuma chave externa estiver configurada, loga informativo
            console.log('[AudioTranscription] Nenhuma chave de IA (OPENAI_API_KEY/GROQ_API_KEY) configurada para transcrição direta.');
            return null;
        }
        catch (error) {
            console.error('[AudioTranscription] Erro ao transcrever áudio:', error.response?.data || error.message);
            return null;
        }
    }
}
exports.AudioTranscriptionService = AudioTranscriptionService;
//# sourceMappingURL=AudioTranscriptionService.js.map