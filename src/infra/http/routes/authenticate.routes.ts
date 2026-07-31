import { Router } from 'express';
import express from 'express';
import { AuthenticateController } from '../controllers/AuthenticateController';
import { decryptAuthCredentials } from '../middlewares/decryptAuthCredentials';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { renderEmailConfirmedPage } from '../pages/emailConfirmedPage';
import { renderEmailLinkErrorPage } from '../pages/emailLinkErrorPage';

const authenticateRoutes = Router();
const authenticateController = new AuthenticateController();

const frontendLoginUrl = () => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(
    /\/$/,
    ''
  );
  return `${base}/login`;
};

/** Confirmação de e-mail (link enviado pelo nosso SMTP). */
authenticateRoutes.get('/confirm-email', (req, res) =>
  authenticateController.confirmEmail(req, res)
);

/** Páginas auxiliares (legado / deep link). */
authenticateRoutes.get('/email-confirmed', (_req, res) => {
  res
    .status(200)
    .type('html')
    .send(renderEmailConfirmedPage({ loginUrl: frontendLoginUrl() }));
});

authenticateRoutes.get('/email-link-error', (req, res) => {
  const description =
    typeof req.query.description === 'string'
      ? decodeURIComponent(req.query.description.replace(/\+/g, ' '))
      : undefined;

  res.status(200).type('html').send(
    renderEmailLinkErrorPage({
      loginUrl: frontendLoginUrl(),
      description,
    })
  );
});

authenticateRoutes.get('/reset-password', (req, res) =>
  authenticateController.resetPasswordForm(req, res)
);
authenticateRoutes.post(
  '/reset-password',
  express.urlencoded({ extended: false }),
  (req, res) => authenticateController.resetPassword(req, res)
);

authenticateRoutes.post('/login', decryptAuthCredentials, (req, res) =>
  authenticateController.login(req, res)
);
authenticateRoutes.post('/register', decryptAuthCredentials, (req, res) =>
  authenticateController.register(req, res)
);
authenticateRoutes.post('/forgot-password', decryptAuthCredentials, (req, res) =>
  authenticateController.forgotPassword(req, res)
);
authenticateRoutes.post(
  '/change-password',
  ensureAuthenticated,
  decryptAuthCredentials,
  (req, res) => authenticateController.changePassword(req, res)
);

authenticateRoutes.post('/google', (req, res) => authenticateController.google(req, res));
authenticateRoutes.post('/refresh', (req, res) => authenticateController.refresh(req, res));

export { authenticateRoutes };
