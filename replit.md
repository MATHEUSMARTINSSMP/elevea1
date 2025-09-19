# ELEVEA - Plataforma de Sites para Pequenos Negócios

## Overview

ELEVEA is a comprehensive digital agency platform that democratizes web presence for small local businesses in Brazil. The platform provides a complete solution including professional websites, Google My Business integration, and automated customer service through chatbots and WhatsApp integration. The system operates on a subscription model similar to Netflix, offering accessible pricing plans starting at R$ 50/month without setup fees.

The application serves multiple user types: end customers visiting business websites, small business owners managing their digital presence through a client dashboard, and administrators overseeing the entire platform. The platform integrates with Google Apps Script for backend data management, Mercado Pago for payments, and various third-party services for email, file storage, and communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a modern React single-page application using:
- **Vite** as the build tool for fast development and optimized production builds
- **TypeScript** for type safety and better developer experience
- **React Router** for client-side routing with role-based access control
- **Tailwind CSS** with shadcn/ui components for consistent, responsive design
- **Radix UI primitives** for accessible, customizable UI components

The application implements a multi-tenant architecture where each client gets their own site slug, allowing for personalized branding and content management. The UI follows a professional design system with a golden color palette (#d4af37) and elegant gradients.

### Backend Architecture
The system uses a hybrid serverless architecture combining multiple backend approaches:

**Primary Data Management:**
- **Google Apps Script (GAS)** serves as the main backend, managing data in Google Sheets
- All business logic for user management, site configurations, leads, and analytics runs in GAS
- GAS provides REST-like endpoints for GET and POST operations

**Serverless Functions (Netlify):**
- **Proxy functions** handle API communication between frontend and GAS
- **Authentication system** using JWT tokens and HTTP-only cookies
- **Payment webhooks** for Mercado Pago integration
- **Email service** integration with Resend API
- **File upload handling** with Drive integration

**Local Development Backend:**
- **Express.js server** with SQLite database using Drizzle ORM
- **Better-sqlite3** for local data storage during development
- **Multer** for file upload handling
- **CORS** configuration for cross-origin requests

### Data Storage Solutions
The platform uses a multi-tier data storage approach:

**Production Storage:**
- **Google Sheets** as the primary database, managed through Apps Script
- **Google Drive** for file storage (logos, images, documents)
- **Local SQLite** for development and testing environments

**Data Models:**
- Sites table storing business information, plans, and settings
- Leads table for customer inquiries and contact forms
- Feedbacks table for testimonials and reviews
- Traffic analytics for usage tracking
- Assets management for uploaded files

### Authentication and Authorization
The authentication system implements role-based access control:

**Session Management:**
- JWT tokens stored in HTTP-only cookies for security
- Server-side session validation through Netlify functions
- Automatic session refresh and logout handling

**User Roles:**
- **Admin users** have full platform access and management capabilities
- **Client users** can only access their own site dashboard and data
- **Public access** for viewing business websites without authentication

**Security Features:**
- CORS configuration for API access control
- Request validation and sanitization
- Rate limiting through serverless function constraints
- Secure cookie settings with SameSite and HttpOnly flags

### External Dependencies
The platform integrates with multiple third-party services to provide comprehensive functionality:

**Payment Processing:**
- **Mercado Pago** for subscription management and payment processing
- Webhook integration for real-time payment status updates
- Support for PIX, credit cards, and bank slips

**Communication Services:**
- **WhatsApp Business API** integration for customer support
- **Resend** for transactional email delivery
- **Netlify Forms** for contact form handling

**Google Services Integration:**
- **Google Apps Script** for serverless backend functionality
- **Google Sheets API** for data persistence and management
- **Google Drive API** for file storage and sharing
- **Google My Business** setup and optimization (VIP plans)

**Development and Deployment:**
- **Netlify** for frontend hosting and serverless functions
- **Lovable** development platform integration
- **GitHub** for version control and continuous deployment

**Monitoring and Analytics:**
- Custom traffic tracking and analytics dashboard
- Error logging and monitoring through console outputs
- Performance metrics collection for business intelligence

## Key Architectural Decisions

**Serverless-First Approach:** The platform prioritizes serverless architecture to minimize operational costs and complexity, making it sustainable for the target market of small businesses with limited budgets.

**Google Sheets as Database:** Using Google Sheets through Apps Script eliminates database hosting costs while providing a familiar interface for administrators to manage data directly.

**Multi-Tenant Design:** Each client gets their own site slug and isolated data space, enabling the platform to serve multiple businesses efficiently while maintaining data separation.

**Progressive Web App Features:** The frontend is designed to work well on mobile devices, considering that many small business owners primarily use smartphones for business management.

**Hybrid Development Environment:** The system supports both local development with SQLite and production deployment with Google Sheets, allowing developers to work efficiently while maintaining production compatibility.