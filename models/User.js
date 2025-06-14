import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ["admin", "user"], default: "user" },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

const User = mongoose.model("Users", userSchema);
export default User;
 