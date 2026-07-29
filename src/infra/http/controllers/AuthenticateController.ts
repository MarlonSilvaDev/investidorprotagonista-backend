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
}
