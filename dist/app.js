"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
/// <reference path="./shared/types/express.d.ts" />
require("dotenv/config");
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const errorHandler_1 = require("./shared/middlewares/errorHandler");
const emailLinkErrorPage_1 = require("./shared/utils/htmlpages/emailLinkErrorPage");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express_1.default.json());
const frontendLoginUrl = () => {
    const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
    return `${base}/login`;
};
/** Site URL do Supabase: trata #error=otp_expired no hash do browser. */
app.get('/', (_request, response) => {
    return response
        .status(200)
        .type('html')
        .send((0, emailLinkErrorPage_1.renderAuthCallbackGatewayPage)({ loginUrl: frontendLoginUrl() }));
});
app.use(routes_1.routes);
app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map