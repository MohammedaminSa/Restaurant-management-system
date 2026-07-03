# Smart Restaurant Menu & Ordering System

A modern, web-based Progressive Web App (PWA) restaurant ordering system that enables customers to scan QR codes, browse menus, customize orders, and submit them directly to the kitchen with real-time updates.

## 🚀 Features

### Customer Features
- 📱 QR code menu access (no login required)
- 🍽️ Browse menu by categories with images
- 🔍 Search and filter menu items
- ⚙️ Customize orders with variants (size, spice level, etc.)
- 🛒 Shopping cart with real-time updates
- 📊 Track order status in real-time
- 💵 View session bill

### Kitchen Staff Features
- 📋 View incoming orders by priority
- ✅ Update order status (preparing, ready)
- ⏱️ Track preparation time
- 🔔 Real-time order notifications

### Waiter Features
- 🪑 Manage tables and assignments
- 📝 Place orders on behalf of customers
- 🍽️ Mark orders as served
- 👥 View customer session details

### Cashier Features
- 💰 Process payments (cash, card, digital wallet)
- 🧾 Generate bills and invoices
- 📄 Print/email receipts
- 📊 View transaction history

### Admin Features
- 📊 Comprehensive dashboard with analytics
- 🍔 Full menu management (CRUD)
- 🏷️ Category management
- 🪑 Table management with QR code generation
- 👥 User management (staff accounts)
- 📦 Inventory tracking
- 🎁 Promotion management
- 📈 Sales reports and analytics
- ⚙️ Restaurant settings

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 19 with TypeScript
- ⚡ Vite for build tooling
- 📱 Progressive Web App (PWA)
- 🎨 Responsive design (mobile-first)

### Backend
- 🟢 Node.js with Express.js
- 📘 TypeScript
- 🐘 PostgreSQL
- 🔴 Redis
- 🔌 WebSocket for real-time updates
- 🔐 JWT authentication

### Infrastructure
- 🐳 Docker containers
- 🔄 CI/CD pipeline
- ☁️ Cloud-ready deployment

## 📁 Project Structure

```
restaurant-ordering-system/
├── backend/          # Node.js backend API
├── frontend/         # React frontend application
├── .kiro/
│   └── specs/        # Design specifications and tasks
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd restaurant-ordering-system
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up environment variables (see `.env.example` in each directory)

5. Run database migrations:
```bash
cd backend
npm run migrate
```

6. Start development servers:

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run dev
```

## 📖 Documentation

Detailed documentation is available in the `.kiro/specs/restaurant-ordering-system/` directory:
- `spec.md` - Complete system design and architecture
- `tasks.md` - Implementation roadmap and tasks

## 🗺️ Roadmap

- [x] Project setup and design specification
- [ ] Phase 1: Foundation & Setup
- [ ] Phase 2: Core Customer Experience
- [ ] Phase 3: Real-Time Order Management
- [ ] Phase 4: Kitchen Interface
- [ ] Phase 5: Waiter Interface
- [ ] Phase 6: Cashier & Payment
- [ ] Phase 7: Admin Panel
- [ ] Phase 8: Multi-Restaurant Support
- [ ] Phase 9: PWA & Offline Features
- [ ] Phase 10: Testing & QA
- [ ] Phase 11: Deployment & DevOps
- [ ] Phase 12: Polish & Launch

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📄 License

[Your chosen license]

## 👥 Team

[Your team information]

## 📧 Contact

[Your contact information]

---

Built with ❤️ for better restaurant experiences
