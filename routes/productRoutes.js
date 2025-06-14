import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProducts, createProduct, deleteProduct, updateProduct, getProductsGallery, searchProducts } from '../controllers/productController.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/', getProducts);
router.post('/', upload.single('imagen'), createProduct);
router.put('/:id', upload.single('imagen'), updateProduct);
router.delete('/:id', deleteProduct);
router.get('/productos-gallery', getProductsGallery);
router.get('/buscar', searchProducts);

export default router;