#!/usr/bin/env node

// Override do comando dev para usar nosso servidor na porta 5000
console.log('🔧 Sobrescrevendo comando dev...');
console.log('🎯 Forçando PORT=5000 e inicializando servidor correto');

process.env.PORT = '5000';
process.env.NODE_ENV = 'development';

// Importar e executar o servidor
import('./server.mjs');