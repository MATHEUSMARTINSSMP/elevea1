#!/usr/bin/env node

// Script de inicialização que força PORT=5000 e roda server.mjs
process.env.PORT = '5000';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🎯 Iniciando ELEVEA na porta 5000...');

// Importar e executar o servidor
import('./server.mjs');