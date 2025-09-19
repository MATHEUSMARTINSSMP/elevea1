#!/usr/bin/env node

/**
 * ELEVEA Backend Server Startup Script
 * 
 * This script starts the complete ELEVEA backend system with:
 * - SQLite database with all tables
 * - JWT authentication system
 * - All API routes for sites, settings, assets, leads, feedbacks, traffic
 * - VIP PIN validation system
 * - Subscription management
 * - File upload handling
 * - Automatic database seeding
 */

process.env.PORT = '5000';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🌟 Starting ELEVEA Digital Agency Platform...');
console.log('📋 Features: Sites, Settings, Assets, Leads, Feedbacks, Traffic, Auth');
console.log('🔐 Authentication: JWT with Role-based access control');
console.log('💎 Plans: Essential & VIP with PIN validation');
console.log('💾 Database: SQLite with automatic seeding');
console.log('');

// Start the ELEVEA backend server
import('./src/server.js').catch((error) => {
  console.error('❌ Failed to start ELEVEA server:', error);
  process.exit(1);
});