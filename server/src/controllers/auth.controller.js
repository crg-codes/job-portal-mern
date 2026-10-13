import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { generateTokens, verifyRefreshToken, generateResetToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendEmail } from '../services/email.service.js';
import crypto from 'crypto';
const cookieOptions = () => {
  const options = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  };
  // Only set a domain for real deployments (never "localhost")
  if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
};

const setTokenCookie = (res, tokenName, token, expiresDays = 7) => {
  res.cookie(tokenName, token, {
    ...cookieOptions(),
    expires: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
  });
};

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 400, 'User already exists');
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: password,
      phone,
      role,
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token in DB
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    setTokenCookie(res, 'refreshToken', refreshToken, 7);

    // Remove password hash from response
    user.passwordHash = undefined;

    return sendSuccess(res, 201, 'User registered successfully', {
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 403, `Account is ${user.status.toLowerCase()}`);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setTokenCookie(res, 'refreshToken', refreshToken, 7);
    
    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: false });

    user.passwordHash = undefined;

    return sendSuccess(res, 200, 'Login successful', { user, accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;
    if (refreshTokenStr) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshTokenStr },
        { revoked: true }
      );
    }

    res.clearCookie('refreshToken', cookieOptions());
    
    return sendSuccess(res, 200, 'User logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshTokenStr = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshTokenStr) {
      return sendError(res, 401, 'Not authorized, no refresh token');
    }

    // Verify token structure
    const decoded = verifyRefreshToken(refreshTokenStr);

    // Check if token exists in DB and is not revoked
    const savedToken = await RefreshToken.findOne({ token: refreshTokenStr });
    if (!savedToken || savedToken.revoked) {
      return sendError(res, 401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 401, 'User not found or inactive');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Revoke old token and save new one
    savedToken.revoked = true;
    savedToken.replacedByToken = newRefreshToken;
    await savedToken.save();

    await RefreshToken.create({
      token: newRefreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setTokenCookie(res, 'refreshToken', newRefreshToken, 7);

    return sendSuccess(res, 200, 'Token refreshed successfully', { accessToken });
  } catch (error) {
    return sendError(res, 401, 'Not authorized, token failed');
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return sendSuccess(res, 200, 'User profile fetched successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const { resetToken, hashedToken } = generateResetToken();
      const expiresAt = new Date(Date.now() + (process.env.PASSWORD_RESET_EXPIRES_MINUTES || 30) * 60 * 1000);

      // Remove any existing tokens for this user
      await PasswordResetToken.deleteMany({ user: user._id });

      await PasswordResetToken.create({
        user: user._id,
        hashedToken,
        expiresAt,
      });

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      
      const html = `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>If you didn't request this, you can ignore this email.</p>
        <p>This link is valid for ${process.env.PASSWORD_RESET_EXPIRES_MINUTES || 30} minutes.</p>
      `;

      if (!process.env.SMTP_HOST) {
        // No mail server configured (local development): show the link in the server console
        console.log(`\n[DEV] Password reset link for ${user.email}:\n${resetUrl}\n`);
      }

      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html,
      });
    }

    // Always send the same generic response
    return sendSuccess(res, 200, 'If an account exists, a password reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 400, 'Please provide token and new password');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordResetToken.findOne({
      hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!resetRecord) {
      return sendError(res, 400, 'Invalid or expired password reset token');
    }

    const user = await User.findById(resetRecord.user);
    if (!user) {
      return sendError(res, 400, 'Invalid token');
    }

    user.passwordHash = newPassword;
    await user.save(); // pre-save hook will hash the new password

    // Delete the token
    await PasswordResetToken.deleteOne({ _id: resetRecord._id });

    // Invalidate all refresh tokens for this user
    await RefreshToken.updateMany({ user: user._id }, { revoked: true });

    return sendSuccess(res, 200, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword === newPassword) {
      return sendError(res, 400, 'New password must be different from the current password');
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid current password');
    }

    user.passwordHash = newPassword;
    await user.save();

    // Invalidate other refresh tokens
    const currentRefreshTokenStr = req.cookies?.refreshToken;
    if (currentRefreshTokenStr) {
       await RefreshToken.updateMany(
         { user: user._id, token: { $ne: currentRefreshTokenStr } },
         { revoked: true }
       );
    } else {
       await RefreshToken.updateMany({ user: user._id }, { revoked: true });
    }

    return sendSuccess(res, 200, 'Password has been changed successfully');
  } catch (error) {
    next(error);
  }
};

