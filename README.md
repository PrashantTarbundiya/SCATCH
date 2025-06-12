# SCATCH 🎨

SCATCH is a full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It includes secure user authentication, email-based OTP verification, and a clean frontend interface to interact with your data.

---

## 🚀 Features

- ✅ User Registration & Login with JWT
- 📩 Email-based OTP verification (using Gmail SMTP)
- 🧾 Session support with Express
- ⚙️ Environment-specific configuration
- 🔐 Secure credentials handling using `.env` files
- 📦 MongoDB Atlas integration for scalable data storage

---

## 🛠️ Tech Stack

**Frontend:**
- React.js + Vite
- Axios
- Tailwind CSS

**Backend:**
- Node.js + Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- Nodemailer for email OTP

---

## 📁 Project Structure

```
.
├── Backend/                 # Node.js/Express backend
│   ├── config/              # Database connection, Multer config
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Custom middleware (auth, etc.)
│   ├── models/              # Mongoose schemas
│   ├── public/              # Static assets (if served by backend)
│   ├── routes/              # API route definitions
│   ├── utils/               # Utility functions (e.g., token generation)
│   ├── views/               # EJS templates (if applicable)
│   ├── app.js               # Express application setup
│   ├── .env.example         # Example environment variables for backend
│   └── package.json
├── Frontend/                # React/Vite frontend
│   ├── public/              # Static assets for Vite
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # Reusable React components
│   │   ├── context/         # React Context API providers
│   │   ├── pages/           # Page-level components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example         # Example environment variables for frontend
│   ├── vite.config.js
│   └── package.json
└── README.md                # This file
```

---

## 🔐 Environment Variables

### 🔧 Frontend (`client/.env`)
```env
VITE_API_BASE_URL= backend_app_uri
```

### 🖥️ Backend (`server/.env`)
```env
PORT=3000
MONGODB_URI = your_mongodb_uri 
JWT_KEY= your_jwt_key
EXPRESS_SESSION_SECRET= your_session_key
FRONTEND_URI= your_frontend_uri
GMAIL_USER= your_support_email
GMAIL_APP_PASS= support_email_pass
NODE_ENV=production
```

---

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/PrashantTarbundiya/SCATCH.git
cd SCATCH
```

### 2. Setup Backend

```bash
cd Backend
npm install
cp .env.example .env
# Fill in your secrets in the new .env file
npm run dev
```

### 3. Setup Frontend

```bash
cd Frontend
npm install
cp .env.example .env
# Add your VITE_API_BASE_URL
npm run dev
```

---


## 📬 Contact

Created with ❤️ by [Prashant Tarbundiya](https://github.com/PrashantTarbundiya)  
Email: prashanttarbundita2@gmail.com

---

