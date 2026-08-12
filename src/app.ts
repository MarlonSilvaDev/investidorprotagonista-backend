/// <reference path="./shared/types/express.d.ts" />
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';
import { renderAuthCallbackGatewayPage } from './shared/utils/htmlpages/emailLinkErrorPage';

import { generalLimiter } from './shared/middlewares/rateLimiters';

const app = express();

app.use(generalLimiter);
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
app.use(express.json());

const frontendLoginUrl = () => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(
    /\/$/,
    ''
  );
  return `${base}/login`;
};

/** Site URL do Supabase: trata #error=otp_expired no hash do browser. */
app.get('/', (_request, response) => {
  return response
    .status(200)
    .type('html')
    .send(renderAuthCallbackGatewayPage({ loginUrl: frontendLoginUrl() }));
});

app.use(routes);
app.use(errorHandler);

export { app };
