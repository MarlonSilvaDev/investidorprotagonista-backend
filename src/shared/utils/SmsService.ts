/**
 * Re-exporta o SmsService do core para manter imports legados funcionando.
 */
export { sendVerificationCode, sendVerificationSms, type VerificationChannel } from '../../core/utils/SmsService';