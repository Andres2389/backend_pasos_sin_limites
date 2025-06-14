import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../utils/sendEmail.js';

export const register = async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const existingUser = await User.findOne({ correo });

    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ nombre, correo, password: hashedPassword });
    await newUser.save();

    // Enviar correo de bienvenida
    const html = `
      <h2>¡Bienvenido a Farmacenter, ${nombre}!</h2>
      <p>Tu cuenta ha sido creada exitosamente con el correo <strong>${correo}</strong>.</p>
      <p>Gracias por confiar en nosotros.</p>
    `;
    await sendEmail(correo, '🎉 Bienvenido Farmacenter', html);

    const userWithoutPassword = {
      _id: newUser._id,
      nombre: newUser.nombre,
      correo: newUser.correo,
    };

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: userWithoutPassword });
  } catch (error) {
    console.error("❌ Error en el registro:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
