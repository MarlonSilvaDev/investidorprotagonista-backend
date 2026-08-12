import { Router } from 'express';
import express from 'express';
import { AuthenticateController } from '../modules/auth/AuthenticateController';
import { decryptAuthCredentials } from '../shared/middlewares/decryptAuthCredentials';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { renderEmailConfirmedPage } from '../shared/utils/htmlpages/emailConfirmedPage';
import { renderEmailLinkErrorPage } from '../shared/utils/htmlpages/emailLinkErrorPage';

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
      ...(description ? { description } : {}),
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
authenticateRoutes.post('/verify-sms', decryptAuthCredentials, (req, res) =>
  authenticateController.verifySms(req, res)
);
authenticateRoutes.post('/resend-verification-code', decryptAuthCredentials, (req, res) =>
  authenticateController.sendVerificationCode(req, res)
);
authenticateRoutes.post('/send-verification-code', decryptAuthCredentials, (req, res) =>
  authenticateController.sendVerificationCode(req, res)
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
authenticateRoutes.post(
  '/complete-cpf',
  ensureAuthenticated,
  (req, res) => authenticateController.completeCpf(req, res)
);
authenticateRoutes.post('/refresh', (req, res) => authenticateController.refresh(req, res));

export { authenticateRoutes };
