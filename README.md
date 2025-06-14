# ⚙️ Backend - Node.js + Express + MongoDB

Este es el backend del proyecto, desarrollado con **Node.js, Express y MongoDB**.

## 🚀 Funcionalidades

- Registro de usuarios.
- Login con validación.
- Roles: `admin` y `user`.
- Rutas protegidas para administración.
- CRUD de usuarios (`GET`, `POST`, `PUT`, `DELETE`).

## 📦 Instalación

```bash
cd backend
npm install
```

## 🧪 Ejecución en desarrollo

```bash
npm run dev
```

Servidor corriendo en [http://localhost:5000](http://localhost:5000)

## 🔐 Variables de entorno

Crea un archivo `.env` con:

```env
PORT=5000
MONGO_URI=mongodb+srv://Andres2389:Andres2389@prueba.9ysbmii.mongodb.net/?retryWrites=true&w=majority&appName=prueba
```

## 📁 Estructura base

```
backend/
├── controllers/
├── models/
├── routes/
├── config/
└── server.js
```

## 📝 Notas

- Los passwords no están encriptados por defecto (puedes implementar `bcrypt`).
- No se utiliza JWT todavía (ideal para futuro).
