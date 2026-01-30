import express from 'express';
import Product from '../models/Product.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

/* =========================
   PDF INVENTARIO
========================= */
router.get('/inventory/pdf', async (req, res) => {
  try {
    const products = await Product.find();
    // Calcular total de ventas (suma de pedidos entregados)
    const Order = (await import('../models/Order.js')).default;
    const entregados = await Order.find({ estado: 'ENTREGADO' });
    let totalVentas = 0;
    entregados.forEach(order => {
      order.items.forEach(item => {
        totalVentas += item.cantidad * item.valorUnitario;
      });
    });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=inventory.pdf'
    );


    doc.pipe(res);

    // ...sin marca de agua...

    // Título
    doc.fontSize(16).font('Helvetica-Bold').text('Reporte de Inventario', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Tabla con estilos
    const tableTop = doc.y;
    const colX = [50, 250, 350];
    const colWidths = [200, 100, 100];
    const rowHeight = 24;

    // Encabezados
    doc.save();
    doc.rect(colX[0], tableTop, colWidths[0] + colWidths[1] + colWidths[2], rowHeight).fill('#f0f0f0');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(12);
    doc.text('Producto', colX[0] + 8, tableTop + 6, { width: colWidths[0] - 16, align: 'left' });
    doc.text('Stock', colX[1] + 8, tableTop + 6, { width: colWidths[1] - 16, align: 'right' });
    doc.text('Valor', colX[2] + 8, tableTop + 6, { width: colWidths[2] - 16, align: 'right' });
    doc.restore();

    // Bordes encabezado
    doc.moveTo(colX[0], tableTop).lineTo(colX[0] + colWidths[0] + colWidths[1] + colWidths[2], tableTop).stroke();
    doc.moveTo(colX[0], tableTop + rowHeight).lineTo(colX[0] + colWidths[0] + colWidths[1] + colWidths[2], tableTop + rowHeight).stroke();
    doc.moveTo(colX[0], tableTop).lineTo(colX[0], tableTop + rowHeight + products.length * rowHeight).stroke();
    doc.moveTo(colX[1], tableTop).lineTo(colX[1], tableTop + rowHeight + products.length * rowHeight).stroke();
    doc.moveTo(colX[2], tableTop).lineTo(colX[2], tableTop + rowHeight + products.length * rowHeight).stroke();
    doc.moveTo(colX[0] + colWidths[0] + colWidths[1] + colWidths[2], tableTop).lineTo(colX[0] + colWidths[0] + colWidths[1] + colWidths[2], tableTop + rowHeight + products.length * rowHeight).stroke();

    // Filas de productos
    let y = tableTop + rowHeight;
    doc.font('Helvetica').fontSize(11);
    products.forEach((p, idx) => {
      // Fondo alterno
      if (idx % 2 === 0) {
        doc.save();
        doc.rect(colX[0], y, colWidths[0] + colWidths[1] + colWidths[2], rowHeight).fill('#fafafa');
        doc.restore();
      }
      doc.fillColor('#000');
      doc.text(p.nombre, colX[0] + 8, y + 6, { width: colWidths[0] - 16, align: 'left' });
      doc.text(String(p.cantidad), colX[1] + 8, y + 6, { width: colWidths[1] - 16, align: 'right' });
      doc.text(`$${p.valor}`, colX[2] + 8, y + 6, { width: colWidths[2] - 16, align: 'right' });
      // Bordes fila
      doc.moveTo(colX[0], y + rowHeight).lineTo(colX[0] + colWidths[0] + colWidths[1] + colWidths[2], y + rowHeight).strokeColor('#ccc').stroke();
      y += rowHeight;
    });

    // Total productos
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(`Total productos: ${products.length}`, colX[0], y + 10, { align: 'left' });

    // Total de ventas resaltado
    doc.save();
    doc.rect(colX[0], y + 40, colWidths[0] + colWidths[1] + colWidths[2], rowHeight + 8).fill('#e0e7ff');
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(15);
    doc.text(`Total de ventas (entregados): $${totalVentas.toFixed(2)}`, colX[0] + 8, y + 48, {
      width: colWidths[0] + colWidths[1] + colWidths[2] - 16,
      align: 'center',
    });
    doc.restore();

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar PDF de inventario' });
  }
});

/* =========================
   EXCEL INVENTARIO
========================= */
router.get('/inventory/excel', async (req, res) => {
  try {
    const products = await Product.find();
    // Calcular total de ventas (suma de pedidos entregados + ventas admin)
    const Order = (await import('../models/Order.js')).default;
    const Sale = (await import('../models/Sale.js')).default;
    const User = (await import('../models/User.js')).default;
    let totalVentas = 0;
    // Pedidos entregados
    const entregados = await Order.find({ estado: 'ENTREGADO' });
    entregados.forEach(order => {
      order.items.forEach(item => {
        totalVentas += item.cantidad * item.valorUnitario;
      });
    });
    // Ventas admin
    const admins = await User.find({ rol: 'admin' });
    const adminIds = admins.map(u => u._id);
    const ventasAdmin = await Sale.find({ user: { $in: adminIds }, status: 'completed' });
    if (ventasAdmin && Array.isArray(ventasAdmin)) {
      totalVentas += ventasAdmin.reduce((acc, v) => acc + v.total, 0);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventario');

    // Encabezados con estilos
    sheet.addRow(['Producto', 'Stock', 'Valor']);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Filas de productos
    products.forEach((p, idx) => {
      const row = sheet.addRow([p.nombre, p.cantidad, p.valor]);
      row.getCell(1).alignment = { horizontal: 'left' };
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).alignment = { horizontal: 'right' };
      row.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (idx % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFAFAFA' },
        };
      }
    });

    // Total productos
    const totalRow = sheet.addRow([`Total productos: ${products.length}`, '', '']);
    totalRow.font = { bold: true };
    totalRow.getCell(1).alignment = { horizontal: 'left' };

    // Fila vacía
    sheet.addRow(['', '', '']);

    // Total de ventas resaltado
    const ventasRow = sheet.addRow(['', '', `Total de ventas (entregados): $${totalVentas.toFixed(2)}`]);
    ventasRow.font = { bold: true, size: 14 };
    ventasRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };
    ventasRow.getCell(3).font = { bold: true, color: { argb: 'FF1E40AF' }, size: 14 };
    ventasRow.getCell(3).alignment = { horizontal: 'center' };

    // Bordes para la fila de total de ventas
    ventasRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Ajustar ancho de columnas
    sheet.columns = [
      { width: 30 },
      { width: 12 },
      { width: 18 },
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=inventory.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar Excel de inventario' });
  }
});

/* =========================
   PDF VENTAS DIARIAS
========================= */
router.get('/sales/pdf', async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const Order = (await import('../models/Order.js')).default;
    const orders = await Order.find({
      estado: 'ENTREGADO',
      ...filter,
    });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales.pdf'
    );

    doc.pipe(res);

    doc.fontSize(16).text('Reporte de Ventas Diarias', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Fecha: ${new Date().toLocaleString()}`);
    doc.moveDown();

    let totalVentas = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const total = item.cantidad * item.valorUnitario;
        totalVentas += total;

        doc.text(
          `${order.createdAt.toLocaleString()} | ${item.nombre} | ${item.cantidad} x $${item.valorUnitario} = $${total}`
        );
      });
    });

    doc.moveDown();
    doc.text(`Total ventas: $${totalVentas.toFixed(2)}`);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar PDF de ventas' });
  }
});

/* =========================
   EXCEL VENTAS DIARIAS
========================= */
router.get('/sales/excel', async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const Order = (await import('../models/Order.js')).default;
    const orders = await Order.find({
      estado: 'ENTREGADO',
      ...filter,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ventas Diarias');

    sheet.addRow([
      'Fecha',
      'Producto',
      'Cantidad',
      'Valor Unitario',
      'Total',
    ]);

    let totalVentas = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const total = item.cantidad * item.valorUnitario;
        totalVentas += total;

        sheet.addRow([
          order.createdAt.toLocaleString(),
          item.nombre,
          item.cantidad,
          item.valorUnitario,
          total,
        ]);
      });
    });

    sheet.addRow([]);
    sheet.addRow(['', '', '', 'TOTAL', totalVentas.toFixed(2)]);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar Excel de ventas' });
  }
});

export default router;
