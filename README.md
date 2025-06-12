# Scatch - Full-Stack E-commerce Platform

## Description

Scatch is a full-stack e-commerce application featuring separate frontend and backend services. It allows users to browse products, manage a shopping cart, and register/login. Owners can manage products through an admin panel.

## Key Features

*   **User Authentication**: Secure registration and login for users.
*   **Owner Authentication**: Separate login for administrators/owners.
*   **Product Management (Admin)**:
    *   Create, View, Edit, and Delete products.
    *   Image uploads for products.
    *   Dynamic product display customization (colors, etc.).
*   **Product Browsing (User)**:
    *   Shop page with product listings.
    *   Product image display with discount badges.
*   **Shopping Cart**:
    *   Add products to cart.
    *   Adjust item quantities.
    *   Remove items from cart.
    *   Clear entire cart.
    *   Price breakdown (MRP, discounts, fees).
*   **Context API**: Frontend state management for User, Owner, and Theme contexts.
*   **Environment-based API Configuration**: Securely manages API base URLs.
*   **Dark Mode Theme**: User-selectable theme preference.

## Tech Stack

### Frontend

*   **Framework/Library**: React (with Vite)
*   **Styling**: Tailwind CSS
*   **State Management**: React Context API
*   **Routing**: React Router DOM
*   **Language**: JavaScript (JSX)

### Backend

*   **Framework**: Node.js with Express.js
*   **Database**: MongoDB (with Mongoose ODM)
*   **Authentication**: JWT (implied by `generateToken.js`), session/cookies for OTP and login.
*   **Image Handling**: Multer for file uploads
*   **Templating (Admin Views - if any still used)**: EJS (though primary interaction seems to be via API for React frontend)
*   **Language**: JavaScript

## Folder Structure

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

## Prerequisites

*   Node.js (v14.x or higher recommended)
*   npm (or yarn)
*   MongoDB (local instance or a cloud-hosted one like MongoDB Atlas)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/PrashantTarbundiya/SCATCH.git
    cd SCATCH
    ```

2.  **Backend Setup:**
    *   Navigate to the `Backend` directory:
        ```bash
        cd Backend
        ```
    *   Create a `.env` file by copying `.env.example` (if you create one) or by creating it manually.
        It should contain variables like:
        ```env
        MONGODB_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret_key
        PORT=3000 # Or your desired backend port
        # Add any other backend-specific environment variables
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```

3.  **Frontend Setup:**
    *   Navigate to the `Frontend` directory (from the root):
        ```bash
        cd ../Frontend 
        # Or from Backend: cd ../Frontend
        ```
    *   Create a `.env` file. It should contain:
        ```env
        VITE_API_BASE_URL=http://localhost:3000 # Or the URL where your backend is running
        ```
        (Note: Ensure the backend port matches the `PORT` in the backend's `.env` file if running locally).
    *   Install dependencies:
        ```bash
        npm install
        ```

## How to Run

1.  **Start the Backend Server:**
    *   In the `Backend` directory:
        ```bash
        npm start 
        # Or your defined script, e.g., npm run dev
        ```
    *   The backend server should typically be running on `http://localhost:3000` (or the port specified in its `.env`).

2.  **Start the Frontend Development Server:**
    *   In the `Frontend` directory:
        ```bash
        npm run dev
        ```
    *   The frontend application will usually be available at `http://localhost:5173` (Vite's default) or another port specified in the terminal output.

Open your browser and navigate to the frontend URL to use the application.

---

This README provides a good starting point. You can expand it further with sections like:
*   **API Endpoints**: A brief list or link to API documentation.
*   **Deployment**: Instructions or notes if you plan to deploy it.
*   **Screenshots/GIFs**: To showcase the application.
*   **License**: If you wish to add one.
