import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

export const getProductsGallery = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const productos = await Product.find().skip(skip).limit(limit);
    const total = await Product.countDocuments();

    res.json({ productos, total });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

export const createProduct = async (req, res) => {
  const { nombre, cantidad, valor, descripcion } = req.body;
  const imagen = req.file?.filename;

  try {
    const nuevo = new Product({ nombre, cantidad, valor, descripcion, imagen });
    await nuevo.save();
    res.status(201).json({ message: 'Producto creado correctamente', producto: nuevo });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el producto', error });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (product.imagen) {
      const imagePath = path.join('uploads', product.imagen);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

export const updateProduct = async (req, res) => {
  const { nombre, cantidad, valor, descripcion } = req.body;
  

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (req.file) {
      if (product.imagen) {
        const oldPath = path.join('uploads', product.imagen);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      product.imagen = req.file.filename;
    }

    product.nombre = nombre;
    product.cantidad = cantidad;
    product.valor = valor;
    product.descripcion = descripcion;

    await product.save();

    res.json({ message: 'Producto actualizado', producto: product });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error });
  }
};


export const searchProducts = async (req, res) => {
  try {
    const query = req.query.query || "";
    const productos = await Product.find({
      nombre: { $regex: query, $options: "i" }, // búsqueda insensible a mayúsculas/minúsculas
    });

    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar productos" });
  }
};
