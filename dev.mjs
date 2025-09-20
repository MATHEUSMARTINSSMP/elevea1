#!/usr/bin/env node
/**
 * Custom Development Server
 * Replaces 'npm run dev' with ELEVEA backend + Vite frontend integration
 * This ensures the system works correctly in the Replit environment
 */

console.log('🚀 Starting ELEVEA Development Server...');

// Set environment for ELEVEA
process.env.PORT = '5000';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🔧 Configuring ELEVEA Backend with Vite Integration');

// Import and start the ELEVEA server
try {
  await import('./server.mjs');
} catch (error) {
  console.error('❌ Failed to start ELEVEA server:', error);
  process.exit(1);
}