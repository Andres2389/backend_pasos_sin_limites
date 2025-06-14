import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    console.log("🔐 Intentando buscar usuario con token:", token);
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ Token inválido o expirado");
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    console.log("✅ Contraseña actualizada exitosamente");
    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error("❌ Error interno en resetPassword:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
