import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import dotenv from 'dotenv';
dotenv.config();

export const forgotPassword = async (req, res) => {
  const { correo } = req.body;

  try {
    const user = await User.findOne({ correo });
    if (!user) return res.status(404).json({ message: "Correo no registrado" });

    // Generar token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = Date.now() + 3600000; // 1 hora

    user.resetPasswordToken = token;
    user.resetPasswordExpires = tokenExpiration;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const html = `
      <h2>Solicitud de cambio de contraseña</h2>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetLink}">Restablecer contraseña</a>
      <p>Este enlace expirará en 1 hora.</p>
    `;

    await sendEmail(correo, "🔐 Recuperar contraseña", html);

    res.status(200).json({ message: "Correo enviado con instrucciones" });
  } catch (err) {
    console.error("❌ Error en forgotPassword:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
