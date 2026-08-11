import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { validatePasswordStrength } from '../utils/validators';

export const registerUser = async (email: string, username: string, password: string) => {
  // 1. Password Strength Validation
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  // 2. Strict case-insensitive check for existing email or username
  const { data: existingUsers, error: checkError } = await supabaseAdmin
    .from('User')
    .select('id, email, username')
    .or(`email.ilike.${cleanEmail},username.ilike.${cleanUsername}`);

  if (checkError) {
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (existingUsers && existingUsers.length > 0) {
    const isEmailTaken = existingUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (isEmailTaken) throw new Error('An account with this email address already exists.');
    throw new Error('This username is already taken. Please choose a different username.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;

  // Insert user into Supabase "User" table
  const { data: newUser, error: insertError } = await supabaseAdmin
    .from('User')
    .insert([{ email: cleanEmail, username: cleanUsername, passwordHash, avatarUrl }])
    .select('id, email, username, avatarUrl')
    .single();

  if (insertError) {
    throw new Error(`Failed to create user: ${insertError.message}`);
  }

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: newUser, token };
};

export const loginUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabaseAdmin
    .from('User')
    .select('*')
    .ilike('email', cleanEmail)
    .single();

  if (error || !user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
    },
    token,
  };
};

export const updateUserProfile = async (
  userId: string,
  updates: { username?: string; avatarUrl?: string; status?: string }
) => {
  if (updates.username) {
    const cleanUsername = updates.username.trim();
    // Case-insensitive username uniqueness check
    const { data: existing } = await supabaseAdmin
      .from('User')
      .select('id')
      .ilike('username', cleanUsername)
      .neq('id', userId)
      .single();

    if (existing) {
      throw new Error('This username is already taken by another user.');
    }
    updates.username = cleanUsername;
  }

  const { data: updatedUser, error } = await supabaseAdmin
    .from('User')
    .update(updates)
    .eq('id', userId)
    .select('id, email, username, avatarUrl, status')
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return updatedUser;
};

export const requestPasswordReset = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('id, email, username')
    .ilike('email', cleanEmail)
    .single();

  if (!user) {
    throw new Error('No user account found with this email address.');
  }

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

  const { error: insertError } = await supabaseAdmin
    .from('PasswordReset')
    .insert([
      {
        userId: user.id,
        otp,
        expiresAt,
        used: false,
      },
    ]);

  if (insertError) {
    throw new Error(`Failed to create reset code: ${insertError.message}`);
  }

  console.log(`✉️ [PASSWORD RESET OTP] Sent to ${cleanEmail}: Code = ${otp}`);
  return { message: 'Reset OTP sent successfully!', otp };
};

export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
  // Password Strength Validation
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('id, email')
    .ilike('email', cleanEmail)
    .single();

  if (!user) {
    throw new Error('Invalid email address');
  }

  // Fetch active OTP
  const { data: resetRecord, error } = await supabaseAdmin
    .from('PasswordReset')
    .select('*')
    .eq('userId', user.id)
    .eq('otp', otp)
    .eq('used', false)
    .order('createdAt', { ascending: false })
    .limit(1)
    .single();

  if (error || !resetRecord) {
    throw new Error('Invalid or expired OTP code');
  }

  if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
    throw new Error('OTP code has expired. Please request a new one.');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  const { error: updateError } = await supabaseAdmin
    .from('User')
    .update({ passwordHash })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }

  // Mark OTP as used
  await supabaseAdmin
    .from('PasswordReset')
    .update({ used: true })
    .eq('id', resetRecord.id);

  return { message: 'Password reset successfully!' };
};
