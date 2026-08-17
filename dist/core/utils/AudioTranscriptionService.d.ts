/**
 * Serviço de Transcrição de Áudio (Speech-to-Text).
 * Suporta formatos de áudio do WhatsApp (OGG, Opus, MP3, WAV, AAC).
 * Utiliza OpenAI Whisper, Groq Whisper ou Gemini Audio se configurado no .env,
 * com fallback inteligente para processamento de comandos de voz.
 */
export declare class AudioTranscriptionService {
    /**
     * Transcreve um áudio a partir de uma URL ou buffer/base64.
     */
    static transcribeAudio(params: {
        audioUrl?: string;
        audioBase64?: string;
        mimeType?: string;
    }): Promise<string | null>;
}
//# sourceMappingURL=AudioTranscriptionService.d.ts.map