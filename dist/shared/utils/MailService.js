"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSharedInviteEmail = exports.sendPasswordResetEmail = exports.sendConfirmationEmail = void 0;
/**
 * Re-exporta o MailService do core para manter imports legados funcionando.
 */
var MailService_1 = require("../../core/utils/MailService");
Object.defineProperty(exports, "sendConfirmationEmail", { enumerable: true, get: function () { return MailService_1.sendConfirmationEmail; } });
Object.defineProperty(exports, "sendPasswordResetEmail", { enumerable: true, get: function () { return MailService_1.sendPasswordResetEmail; } });
Object.defineProperty(exports, "sendSharedInviteEmail", { enumerable: true, get: function () { return MailService_1.sendSharedInviteEmail; } });
//# sourceMappingURL=MailService.js.map