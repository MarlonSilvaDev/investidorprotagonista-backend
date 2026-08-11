/// <reference path="../../types/express.d.ts" />
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { renderAuthCallbackGatewayPage } from './pages/emailLinkErrorPage';

const app = express();

app.use(
  cors({
    origin: '*',
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

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
