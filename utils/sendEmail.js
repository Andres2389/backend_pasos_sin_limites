import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,         // Tu correo de Gmail
    pass: process.env.EMAIL_APP_PASS,     // Contraseña de aplicación de 16 caracteres
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Pasos Sin Límites" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Correo enviado correctamente a", to);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
  }
};
