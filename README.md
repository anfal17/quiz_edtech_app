# 📖 Ilm Path - Islamic Learning Platform

Ilm Path is an interactive educational platform designed to provide a structured and engaging way to learn about Islamic topics. It features a modern, responsive UI, gamified learning elements, and robust content management.

![Ilm Path Screenshot](https://via.placeholder.com/800x400?text=Ilm+Path+Dashboard)

## ✨ Features

- **Authentication & Roles**
  - Secure Login & Signup with JWT.
  - **Guest Mode**: Try the app without an account (progress not saved).
  - **Role-based Access**: Student, Admin, and Super Admin roles.

- **Interactive Learning**
  - **Structured Courses**: Organized by Domains and Chapters.
  - **Reading Mode**: Distraction-free reading with progress tracking.
  - **Quizzes**: Interactive quizzes with instant feedback and scoring.

- **Gamification**
  - **XP System**: Earn XP for completing chapters and passing quizzes.
  - **Streaks**: Track daily learning activity.
  - **Progress Tracking**: Visual progress bars for courses and chapters.

- **Admin Dashboard**
  - **Manage Content**: Create/Edit/Delete Domains, Chapters, and Quizzes.
  - **User Management**: View and manage users.
  - **Analytics**: View platform statistics.
  - **Bulk Import**: JSON import support for Quizzes.

- **Technical Highlights**
  - **Modern UI**: Built with React, TailwindCSS, and Lucide Icons.
  - **Responsive Design**: Fully optimized for mobile and desktop.
  - **Dark/Light Mode**: User preference support.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TailwindCSS, React Router, Context API.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Authentication**: JSON Web Tokens (JWT).
- **Tools**: ESLint, Postman (for API testing).

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/quiz_app.git
    cd quiz_app
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

### Configuration

1.  Create a `.env` file in the `server` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/quiz_app
    JWT_SECRET=your_jwt_secret_key_here
    NODE_ENV=development
    ```

### Running the App

1.  **Start the Backend Server**
    ```bash
    # From the server directory
    npm run dev
    ```
    Server will run on `http://localhost:5000`.

2.  **Start the Frontend Development Server**
    ```bash
    # From the root directory
    npm run dev
    ```
    Client will run on `http://localhost:5173`.

## 📂 Project Structure

```
quiz_app/
├── public/             # Static assets
├── server/             # Backend (Node/Express)
│   ├── config/         # DB and constants
│   ├── controllers/    # Route logic
│   ├── middleware/     # Auth and error handling
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── index.js        # Server entry point
├── src/                # Frontend (React)
│   ├── assets/         # Images and styles
│   ├── components/     # Reusable UI components
│   ├── context/        # Global state (Auth, Theme)
│   ├── pages/          # Page components
│   ├── services/       # API client services
│   └── App.jsx         # Main App component
└── README.md           # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
