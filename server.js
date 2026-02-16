import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import OrderRoutes from './routes/orderRoutes.js';
import SalesRoutes from './routes/salesRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';



dotenv.config();
connectDB();


const app = express();

// Configurar CORS solo para el dominio de producción
const allowedOrigins = [process.env.FRONTEND_URL];
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) o desde el frontend permitido
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// =========================
// RUTAS
// =========================
app.use('/api', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/sales', SalesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);





// =========================
// PUERTO
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT);
