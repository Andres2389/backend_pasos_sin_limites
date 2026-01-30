import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductsGallery,
  searchProducts
} from '../controllers/productController.js';

const router = express.Router();

/* Multer */
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

/* ⚠️ RUTAS ESPECÍFICAS PRIMERO */
router.get('/productos-gallery', getProductsGallery);
router.get('/buscar', searchProducts);

/* CRUD */
router.get('/', getProducts);
router.post('/', upload.single('imagen'), createProduct);

router.put('/:id', upload.single('imagen'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
