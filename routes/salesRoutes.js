import express from 'express';
import { getDailySales, createAdminSale } from '../controllers/salesController.js';

const router = express.Router();

// GET /api/sales/daily?date=YYYY-MM-DD
router.get('/daily', getDailySales);

// Registrar venta admin
router.post('/admin', createAdminSale);

export default router;
