# Revanta · Guest Feedback & Review System 🏨

A sophisticated, multi-platform feedback ecosystem developed by **EliTech CreaTives** to streamline customer engagement, service monitoring, and reputation management for modern hospitality and service businesses.

---

> [!CAUTION]
> ### 🛑 PROPRIETARY & PRIVATE
> Although this repository is hosted on a public platform for development tracking, the project is **strictly private**. 
> 
> **Reproduction, distribution, or copying of any part of this codebase, design system, or logic is strictly prohibited without explicit written permission from EliTech CreaTives.**

---

## 🌟 Key Features

- **📊 Comprehensive Admin Dashboard**: Real-time visualization of guest feedback, satisfaction scores, and service ratings.
- **📝 Multi-Step Feedback Form**: Interactive, user-friendly interface for guests to submit detailed reviews and suggestions.
- **📱 QR Code Ecosystem**: Automated generation and tracking of service-specific QR codes for easy physical-to-digital access.
- **✅ Resolution Tracking**: Dedicated workflow for managing, responding to, and resolving guest concerns.
- **🎨 Premium UI/UX**: Custom-built design system with fluid animations, dark mode support, and responsive layouts.

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Backend**: Node.js & Express (Deployed on Railway)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Payments**: [Paystack](https://paystack.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: Vanilla CSS (Modular & Design Tokens)
- **State Management**: React Context & Custom Hooks
- **Icons**: Material Icons (Round & Outlined)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

1. Clone the repository (Access restricted to authorized personnel)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
server/             # Express.js backend for Railway
src/
├── api/            # API client for Railway backend
├── components/     # Reusable UI components
├── context/        # Global state and theme providers
├── layouts/        # Page structural templates (Admin/Public)
├── pages/          # Feature-specific page components
│   ├── admin/      # Internal dashboard modules
│   └── public/     # Guest-facing feedback interfaces
├── store/          # Data persistence and logic
└── styles/         # Global design system and variables
supabase/           # Database migrations and legacy functions
```

---

*Copyright © 2026 EliTech CreaTives. All rights reserved.*
