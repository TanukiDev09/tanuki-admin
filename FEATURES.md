# Project Features - Tanuki Admin

Registration of all core features and modules as of Release 1.0.0.

## 📊 Dashboard & Analytics

- **Financial Health Overview**: Real-time KPIs for Total Income, Expenses, and Profit.
- **Interactive Charts**:
  - Income vs Expense historical bar/line charts.
  - **Profitability by Book**: Detailed accumulated performance for each title.
  - Category distribution charts.
- **Projected Burn Rate**: Visualization of financial sustainability.

## 📚 Catalog Management

- **Book Registry**: Comprehensive metadata management (ISBN, Genre, Collections).
- **Creator Management**: Database of authors, illustrators, and contributors.
- **Category & Collection Hierarchies**: Logical organization for the entire catalog.
- **Cloud Image Hosting**: Integrated with Vercel Blob for high-performance asset delivery.

## 💰 Financial Intelligence

- **Movement Tracking**: Detailed registration of incomes and expenses.
- **Cost Centers**: Assign financial operations to specific business units.
- **Agreement Management**: Track contracts, royalties, and financial commitments with creators.
- **Flexible Validation**: Support for both minimal quick entries and detailed financial records.

## 📦 Inventory & Logistics

- **Multi-Warehouse Support**: Manage stock across different physical locations.
- **Stock Movements**: Input/Output tracking with automated balance updates.
- **Points of Sale (POS)**: Integration for physical sales locations and stock assignment.
- **Inventory Adjustments**: Tools for auditing and correcting stock levels.

## 🔐 Administration & Security

- **Role-Based Access Control (RBAC)**: Granular permission matrix for users.
- **Secure Authentication**: JWT-based login system with bcrypt password hashing.
- **Environment Isolation**: Zero hardcoded credentials; fully driven by environment variables.
- **Audit Tools**: Scripts for database inspection and integrity verification.

## 🎨 Technical Excellence

- **Next.js 16 Framework**: Leveraging the latest App Router and Server Actions.
- **Hybrid Styling (Migration in Progress)**:
  - SASS/BEM for premium components (StatCard, Button, Card).
  - Tailwind CSS for rapid layout prototyping.
- **Responsive Layout**: Mobile-first design optimized for all screen sizes.
- **Comprehensive Testing Suite**: Jest for unit/integration and Cypress for E2E/Accessibility.
