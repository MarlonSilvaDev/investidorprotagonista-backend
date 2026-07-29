import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class AuthenticateController {
  async register(request: Request, response: Response) {
    const { email, password, name } = request.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json(data.user);
  }

  async login(request: Request, response: Response) {
    const { email, password } = request.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({
      user: data.user,
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  }

  async google(request: Request, response: Response) {
    const { id_token: idToken, access_token: accessToken } = request.body;

    if (!idToken) {
      return response.status(400).json({ message: 'id_token is required' });
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({
      user: data.user,
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  }

  async refresh(request: Request, response: Response) {
    const { refresh_token: refreshToken } = request.body;

    if (!refreshToken) {
      return response.status(400).json({ message: 'refresh_token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return response.status(401).json({
        message: error?.message ?? 'Unable to refresh session',
      });
    }

    return response.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token: data.session.access_token,
      user: data.user,
    });
  }
}
