"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthMailToken = signAuthMailToken;
exports.verifyAuthMailToken = verifyAuthMailToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET não configurado');
    }
    return secret;
}
function signAuthMailToken(payload, expiresIn = '24h') {
    return jsonwebtoken_1.default.sign(payload, jwtSecret(), { expiresIn });
}
function verifyAuthMailToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, jwtSecret());
    if (!decoded?.sub || !decoded?.email || !decoded?.type) {
        throw new Error('Token inválido');
    }
    return decoded;
}
//# sourceMappingURL=AuthTokenService.js.map