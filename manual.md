# 🏨 Revanta Hotel · Full Stack Setup Guide (Restart)

This manual outlines the entire setup for the new architecture: **Railway (Backend)**, **Supabase (Database)**, **Vercel (Frontend)**, and **Prisma (ORM)**.

---

## 🏗️ 1. Architecture Overview
- **Frontend**: React/Vite hosted on **Vercel**.
- **Backend**: Node.js/Express hosted on **Railway**.
- **Database**: PostgreSQL hosted on **Supabase**.
- **ORM**: **Prisma** (Industry standard for type-safety and migrations).

---

## 🛑 2. Phase 1: The Great Reset (Cleanup)
If you haven't already, clear the old Supabase CLI setup:
```powershell
# Stop local supabase services
supabase stop

# Wipe local configuration
Remove-Item -Recurse -Force ./supabase
```

---

## 🗄️ 3. Phase 2: Database Setup (Supabase)
We use Supabase only as a PostgreSQL provider.
1. Go to **Project Settings > Database**.
2. Copy your **Connection String (URI)**.
3. Replace `[YOUR-PASSWORD]` with your database password.
4. Add these to `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.fskzwjxcfovzbddmsvjj.supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.fskzwjxcfovzbddmsvjj.supabase.co:5432/postgres"
   ```

---

## 🚀 4. Phase 3: Backend Setup (Railway + Prisma)

### 4.1 Sync Database Schema
Run this inside the `backend` folder to push the Prisma models to Supabase:
```powershell
cd backend
npx prisma db push
```

### 4.2 Local Development
```powershell
npm run dev
```
Your API will be running at `http://localhost:5000`.

### 4.3 Railway Deployment
1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Set the **Root Directory** to `/backend`.
3. Add your Environment Variables from `.env` into the Railway **Settings > Variables**.
4. Railway will automatically detect the `package.json` and deploy.

---

## 🌐 5. Phase 4: Frontend Setup (Vercel)

### 5.1 Update API URL
In your frontend code or Vercel environment variables, update the API endpoint:
```env
VITE_API_URL="https://your-railway-app-name.up.railway.app"
```

### 5.2 Deployment
1. Deploy the project root to **Vercel**.
2. Vercel will automatically build the React app.

---

## 📋 6. Prisma Schema Reference
Your models are defined in `backend/prisma/schema.prisma`. Key tables:
- `Hotel`: Main hotel data and subscription status.
- `Branch`: Individual branches with unique review tokens.
- `Review`: Guest feedback and scores.
- `Notification`: Alerts for hotel owners.

---

## 🛠️ 7. Common Commands

| Command | Description |
|---------|-------------|
| `npx prisma db push` | Sync schema to database |
| `npx prisma studio` | Open a visual editor for your data |
| `npm run dev` | Start backend in watch mode |
| `npx prisma generate` | Regenerate Prisma Client after schema changes |
