declare namespace Express {
  interface User {
    id: string;
    email: string;
    userType: string;
    plan: string;
    country: string;
    documentType: string | null;
    documentNumber: string | null;
    role: string;
    subscriptionStatus: string;
  }

  interface Request {
    user: User;
    credentialsAesKey?: Buffer;
  }
}
