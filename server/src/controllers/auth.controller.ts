import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as authService from '../services/auth.service';

export const handleRegister = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const data = await authService.registerUser(email, username, password);
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = await authService.loginUser(email, password);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const handleUpdateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { username, avatarUrl, status } = req.body;
    const updatedUser = await authService.updateUserProfile(userId, { username, avatarUrl, status });
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const handleForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await authService.requestPasswordReset(email);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const handleResetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const result = await authService.resetPasswordWithOTP(email, otp, newPassword);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
