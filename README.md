# Team Task Manager

A full‑stack web application for teams to manage projects, assign tasks, and track progress with role‑based access (Admin / Member). Built with **React**, **Node.js**, **Express**, **MongoDB**, and **TailwindCSS**.

## 🚀 Live Demo

- **Frontend:** [https://team-task-manager-tau-rouge.vercel.app](https://team-task-manager-tau-rouge.vercel.app)
- **Backend API:** [https://team-task-manager-production-757f.up.railway.app](https://team-task-manager-production-757f.up.railway.app)

## ✨ Features

- 🔐 **Authentication** – Signup / Login with JWT tokens
- 📁 **Project Management** – Admins create projects, add team members
- ✅ **Task Management** – Create tasks, assign to members, set priority & due date
- 📊 **Dashboard** – Real‑time statistics, completion rate, overdue tasks
- 👥 **Role‑Based Access**
  - **Admin** – full control (create/edit/delete projects, tasks, members)
  - **Member** – only see and update tasks assigned to them

## 🛠️ Tech Stack

| Layer       | Technologies                              |
|-------------|-------------------------------------------|
| Frontend    | React, Vite, TailwindCSS, Axios           |
| Backend     | Node.js, Express, JWT, bcrypt             |
| Database    | MongoDB (Mongoose ODM)                    |
| Deployment  | Railway (backend), Vercel (frontend)      |

## 🏃‍♂️ Run Locally

1. **Clone the repository**  
   ```bash
   git clone https://github.com/NancyRathee/team-task-manager.git
   cd team-task-manager