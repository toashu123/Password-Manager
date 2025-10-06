# 🔐 PassOP - Secure Password Manager

A full-stack password manager application with end-to-end encryption, multi-factor authentication, and a modern React interface.

## ✨ Features

- 🔒 **End-to-End Encryption** - AES-256-GCM encryption with PBKDF2 key derivation
- 🔐 **Multi-Factor Authentication (MFA)** - TOTP-based 2FA support
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Built with React and Tailwind CSS
- 📊 **Password Analytics** - Strength analysis and security insights
- 🏷️ **Category Management** - Organize passwords by categories
- 👤 **User Authentication** - Powered by Clerk
- ☁️ **Cloud Storage** - MongoDB Atlas for secure data persistence

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Clerk (Authentication)
- React Toastify

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Web Crypto API

## 📁 Project Structure
```
password-manager/
├── front-end/
│ ├── src/
│ │ ├── components/
│ │ │ ├── auth/ # MFA components
│ │ │ ├── shared/ # Navbar, Footer
│ │ │ └── dashboard/ # Dashboard components
│ │ ├── contexts/
│ │ │ └── PasswordContext.jsx
│ │ ├── utils/
│ │ │ └── cryptoUtils.js
│ │ ├── views/
│ │ │ ├── Landing.jsx
│ │ │ ├── Manager.jsx
│ │ │ └── Dashboard.jsx
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── package.json
│ └── vite.config.js
│
└── back-end/
├── config/
│ └── database.js
├── controllers/
│ ├── passwordController.js
│ └── categoryController.js
├── models/
│ ├── Password.js
│ └── Category.js
├── routes/
│ ├── passwords.js
│ ├── categories.js
│ └── stats.js
├── services/
│ ├── passwordService.js
│ └── categoryService.js
├── middleware/
│ └── errorHandler.js
├── server.js
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Clerk account (for authentication)

### Installation

1. **Clone the repository**
git clone https://github.com/yourusername/password-manager.git
cd password-manager

2. **Setup Backend**
cd back-end
npm install



Create `.env` file in `back-end/`:
PORT=3000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=passop
NODE_ENV=development



3. **Setup Frontend**
cd ../front-end
npm install



Create `.env` file in `front-end/`:
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:3000



### Running Locally

1. **Start Backend Server**
cd back-end
npm start


Backend runs on: `http://localhost:3000`

2. **Start Frontend Development Server**
cd front-end
npm run dev


Frontend runs on: `http://localhost:5173`

## 🌐 Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `back-end`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add environment variables:
   - `MONGODB_URI`
   - `DB_NAME`
   - `PORT` (set to 3000)

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `front-end`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_BACKEND_URL` (your Render backend URL)

## 🔑 Environment Variables

### Backend (.env)
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=passop
NODE_ENV=production



### Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_BACKEND_URL=https://your-backend.onrender.com



## 📝 API Endpoints

### Passwords
- `GET /api/passwords?userId={userId}` - Get all passwords
- `POST /api/passwords` - Create new password
- `PUT /api/passwords/:id` - Update password
- `DELETE /api/passwords/:id` - Delete password

### Categories
- `GET /api/categories?userId={userId}` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `POST /api/categories/initialize` - Initialize default categories

### Stats
- `GET /api/stats/:userId` - Get user password statistics

### Health
- `GET /api/health` - Health check endpoint

## 🔒 Security Features

1. **Client-Side Encryption**
   - Passwords encrypted before sending to backend
   - AES-256-GCM encryption
   - PBKDF2 with 210,000 iterations

2. **Master Password**
   - Deterministic salt generation per user
   - Key caching with TTL
   - Automatic timeout after 1 hour

3. **Authentication**
   - Clerk-powered authentication
   - Optional TOTP-based MFA
   - Secure session management

## 🛠️ Development

### Available Scripts

**Frontend:**
npm run dev # Start development server
npm run build # Build for production
npm run preview # Preview production build
npm run lint # Run ESLint



**Backend:**
npm start # Start server
npm run dev # Start with nodemon



## 📦 Dependencies

### Frontend Key Dependencies
- `react`: ^18.3.1
- `react-router-dom`: ^6.28.0
- `@clerk/clerk-react`: ^5.17.0
- `react-toastify`: ^10.0.6
- `tailwindcss`: ^3.4.14

### Backend Key Dependencies
- `express`: ^4.21.1
- `mongodb`: ^6.10.0
- `dotenv`: ^16.4.5
- `cors`: ^2.8.5