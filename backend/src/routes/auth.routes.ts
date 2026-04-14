import { Router, Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Tenant } from '../db/models.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'epettyshop-super-secret-key-2026';

// GET /api/auth/tenants — List available tenants (demo only)
const getTenants: RequestHandler = async (_req, res) => {
  try {
    const tenants = await Tenant.find().sort({ name: 1 });
    res.json({ tenants });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/tenants', getTenants);

// POST /api/auth/login — Get JWT token for a tenant
const login: RequestHandler = async (req, res): Promise<void> => {
  const { tenantId } = req.body;

  if (!tenantId) {
    res.status(400).json({ error: 'tenantId is required' });
    return;
  }

  try {
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const token = jwt.sign(
      { tenantId: tenant.id, tenantName: tenant.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.post('/login', login);

export default router;
