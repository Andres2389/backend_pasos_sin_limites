import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export const login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const user = await User.findOne({ correo });
    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user._id, correo: user.correo, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Error en el login:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
