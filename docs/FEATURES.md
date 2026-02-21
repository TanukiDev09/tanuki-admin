# Project Features - Tanuki Admin

Registration of all core features and modules as of Release 1.0.4.

## 📊 Dashboard & Analytics

- **Financial Health Overview**: Real-time KPIs for Total Income, Expenses, and Profit.
- **Interactive Charts**:
  - Income vs Expense historical bar/line charts.
  - **Profitability by Book**: Detailed accumulated performance for each title.
  - **Cost Center Analytics**: Donut charts showing participation in income/expenses.
  - Category distribution charts.
- **Sustainability Metrics**: Visualization of Runway, Burn Rate, and Financial Score by unit.

## 🧾 Invoice & Document Management

- **DIAN XML Import (UBL 2.1)**: Automatic processing of Colombian electronic invoices.
- **Massive Import Pipelines**: Python-based CLI tool and Premium Web Wizard for batch processing.
- **Newsletter Intelligence**: Automatic detection of customer subscriptions from purchase data.
- **Document Storage**: Integration with Vercel Blob for PDF and image attachments.

## 📚 Catalog Management

- **Book Registry**: Comprehensive metadata management (ISBN, Genre, Collections).
- **Creator Management**: Database of authors, illustrators, and contributors.
- **Category & Collection Hierarchies**: Logical organization for the entire catalog.
- **Auto-assignment Logic**: Dynamic linking between books and their respective cost centers.

## 💰 Financial Intelligence

- **Movement Tracking**: Detailed registration of incomes and expenses.
- **Fixed Amount Integrity**: Strict control over total movement values during itemization.
- **Real-time Validation**: Visual indicators for distribution balance (gaps/overages).
- **Cost Centers**: Multi-level assignment of financial operations.
- **Agreement Management**: Track contracts, royalties, and financial commitments.
- **Precision Arithmetic**: 100% accurate calculations using `big.js` and `Decimal128`.

## 📦 Inventory & Logistics

- **Multi-Warehouse Support**: Manage stock across different physical locations.
- **Two-Line Item Layout**: Optimized grid for high-density logistics data.
- **Stock Movements**: Input/Output tracking with automated balance updates.
- **Points of Sale (POS)**: Integration for physical sales locations and stock assignment.

## 🔐 Administration & Security

- **Role-Based Access Control (RBAC)**: Granular permission matrix for users.
- **Zero Hardcode Security**: All secrets and configurations managed via environment variables.
- **Audit & Performance**: Optimized MongoDB indexing strategy and session persistence.

## 🎨 Technical Excellence

- **Next.js 16 Framework**: Leveraging the latest App Router and Server Actions.
- **Hybrid Styling**: Premium SASS (BEM) for components + Tailwind CSS for layouts.
- **Responsive Design**: Fluid adaptation for desktop, tablet, and mobile.
- **Testing Suite**: Comprehensive coverage with Jest and Cypress (E2E & a11y).
