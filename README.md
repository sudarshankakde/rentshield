# RentShield Web

<div align="center">
  <p><strong>A modern, comprehensive tenancy management and real estate operations platform.</strong></p>
</div>

---

## 🚀 Overview

RentShield is a state-of-the-art web application designed to streamline the entire rental lifecycle for tenants, landlords, and administrators. Built with a premium, mobile-first design system utilizing Glassmorphism, RentShield offers a robust suite of modules ranging from KYC and property discovery to finance management and maintenance tracking.

## 🛠️ Tech Stack

- **Framework**: [Angular 18](https://angular.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [NgRx](https://ngrx.io/) for global state & [@tanstack/angular-query](https://tanstack.com/query) for server state caching
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a custom Glassmorphism design system
- **UI Components**: Custom ShadCN-inspired components & Angular Material
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) & [AG Grid](https://www.ag-grid.com/)
- **Real-time**: [Socket.io](https://socket.io/)

## ✨ Key Modules & Features

The platform is divided into comprehensive modules reflecting the complete lifecycle of property management:

- **🔐 Identity & Access**: Secure authentication, role-based access control (RBAC), and user profile management.
- **📄 KYC & Verification**: Robust identity verification workflows.
- **🏢 Property Management**: Property discovery, filtering, and bookmarking.
- **🤝 Tenancies & Agreements**: Move-in tracking, lease timelines, and e-signatures for digital contracts.
- **💰 Finance**: Ledgers, payment processing, and digital receipts.
- **🛠️ Maintenance**: Ticket raising, tracking, and resolution for property repairs.
- **💬 Communication**: Real-time chat integration for support and community discussions.
- **⚖️ Disputes & Exits**: Dispute resolution and streamlined move-out operations.
- **👑 Admin Hub**: Complete global oversight, module toggling, platform statistics, and support.

## 💻 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rentshield
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy the example environment file and update variables as needed:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will typically be served on `http://localhost:5173/`.*

## 📖 Development Guidelines

We enforce strict architectural and aesthetic guidelines to maintain code quality and user experience. 

**All developers MUST read and adhere to the [Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md) before contributing.**

Key takeaways:
- **Architecture**: Strict modular structure matching the backend. One module, one folder.
- **UI/UX**: Mobile-first, Glassmorphism aesthetics, dynamic micro-animations.
- **State**: Use TanStack Query for API caching; NgRx for global state.
- **Quality**: Husky pre-commit hooks are enforced (100% test coverage for core components).

## 📜 Scripts

- `npm run dev` - Starts the development server using Vite/tsx.
- `npm run build` - Builds the application for production.
- `npm run preview` - Locally previews the production build.
- `npm run lint` - Runs TypeScript compiler checks (`tsc --noEmit`).
- `npm run clean` - Removes the `dist` directory.

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'feat: Add some amazing feature'`)
3. Ensure linting and tests pass (Husky will automatically run pre-commit checks)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

*Built with ❤️ for a seamless rental experience.*
