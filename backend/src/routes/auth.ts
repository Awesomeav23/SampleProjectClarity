import { Router } from 'express';
import { z } from 'zod';
import { getMockUserByEmail, getRoleById } from '../services/authConfig.js';
import { verifyJWT, signJWT } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { unauthorized } from '../lib/AppError.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(), // ignored in mock mode
});

/**
 * POST /api/auth/login
 * In mock mode: accepts any MOCK_USERS email, password ignored.
 * Returns JWT token with user profile and permissions.
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const mockUser = getMockUserByEmail(email);
    if (!mockUser) {
      throw unauthorized(`No user found with email: ${email}`);
    }

    const role = getRoleById(mockUser.roleId);
    if (!role) {
      throw unauthorized(`Invalid role: ${mockUser.roleId}`);
    }

    const token = signJWT({
      sub: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      roleId: mockUser.roleId,
      permissions: role.permissions,
      buPractice: mockUser.buPractice,
      location: mockUser.location,
      resourceId: mockUser.resourceId,
    });

    res.json({
      token,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        roleId: mockUser.roleId,
        roleName: role.name,
        permissions: role.permissions,
      },
      expiresIn: '1h',
    });
  })
);

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile from the JWT.
 */
router.get(
  '/me',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = getRoleById(user.roleId);

    res.json({
      id: user.sub,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleName: role?.name ?? 'Unknown',
      permissions: user.permissions,
      buPractice: user.buPractice,
      location: user.location,
      resourceId: user.resourceId,
    });
  })
);

export default router;
