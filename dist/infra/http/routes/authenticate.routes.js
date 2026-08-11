"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRoutes = void 0;
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const AuthenticateController_1 = require("../../controllers/AuthenticateController");
const decryptAuthCredentials_1 = require("../middlewares/decryptAuthCredentials");
const ensureAuthenticated_1 = require("../middlewares/ensureAuthenticated");
const emailConfirmedPage_1 = require("../pages/emailConfirmedPage");
const emailLinkErrorPage_1 = require("../pages/emailLinkErrorPage");
const authenticateRoutes = (0, express_1.Router)();
exports.authenticateRoutes = authenticateRoutes;
const authenticateController = new AuthenticateController_1.AuthenticateController();
const frontendLoginUrl = () => {
    const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
    return `${base}/login`;
};
/** Confirmação de e-mail (link enviado pelo nosso SMTP). */
authenticateRoutes.get('/confirm-email', (req, res) => authenticateController.confirmEmail(req, res));
/** Páginas auxiliares (legado / deep link). */
authenticateRoutes.get('/email-confirmed', (_req, res) => {
    res
        .status(200)
        .type('html')
        .send((0, emailConfirmedPage_1.renderEmailConfirmedPage)({ loginUrl: frontendLoginUrl() }));
});
authenticateRoutes.get('/email-link-error', (req, res) => {
    const description = typeof req.query.description === 'string'
        ? decodeURIComponent(req.query.description.replace(/\+/g, ' '))
        : undefined;
    res.status(200).type('html').send((0, emailLinkErrorPage_1.renderEmailLinkErrorPage)({
        loginUrl: frontendLoginUrl(),
        ...(description ? { description } : {}),
    }));
});
authenticateRoutes.get('/reset-password', (req, res) => authenticateController.resetPasswordForm(req, res));
authenticateRoutes.post('/reset-password', express_2.default.urlencoded({ extended: false }), (req, res) => authenticateController.resetPassword(req, res));
authenticateRoutes.post('/login', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.login(req, res));
authenticateRoutes.post('/register', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.register(req, res));
authenticateRoutes.post('/verify-sms', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.verifySms(req, res));
authenticateRoutes.post('/resend-verification-code', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.sendVerificationCode(req, res));
authenticateRoutes.post('/send-verification-code', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.sendVerificationCode(req, res));
authenticateRoutes.post('/forgot-password', decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.forgotPassword(req, res));
authenticateRoutes.post('/change-password', ensureAuthenticated_1.ensureAuthenticated, decryptAuthCredentials_1.decryptAuthCredentials, (req, res) => authenticateController.changePassword(req, res));
authenticateRoutes.post('/google', (req, res) => authenticateController.google(req, res));
authenticateRoutes.post('/complete-cpf', ensureAuthenticated_1.ensureAuthenticated, (req, res) => authenticateController.completeCpf(req, res));
authenticateRoutes.post('/refresh', (req, res) => authenticateController.refresh(req, res));
//# sourceMappingURL=authenticate.routes.js.map