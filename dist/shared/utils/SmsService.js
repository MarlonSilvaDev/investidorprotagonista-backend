"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationSms = exports.sendVerificationCode = void 0;
/**
 * Re-exporta o SmsService do core para manter imports legados funcionando.
 */
var SmsService_1 = require("../../core/utils/SmsService");
Object.defineProperty(exports, "sendVerificationCode", { enumerable: true, get: function () { return SmsService_1.sendVerificationCode; } });
Object.defineProperty(exports, "sendVerificationSms", { enumerable: true, get: function () { return SmsService_1.sendVerificationSms; } });
//# sourceMappingURL=SmsService.js.map