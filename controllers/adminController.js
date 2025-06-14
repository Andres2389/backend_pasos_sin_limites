import User from "../models/User.js";

// ✅ Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // omitimos el password por seguridad
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// ✅ Eliminar usuario por ID
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// ✅ Editar usuario por ID
export const updateUser = async (req, res) => {
  const { nombre, correo, rol } = req.body;

  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.nombre = nombre || user.nombre;
    user.correo = correo || user.correo;
    user.rol = rol || user.rol;

    const updatedUser = await user.save();

    res.json({
      message: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};
