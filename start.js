const { execSync } = require('child_process');
const path = require('path');

// Verificar se TypeScript está compilado
console.log('🔥 Iniciando sistema Elevea nativo...');

try {
  // Compilar TypeScript se necessário
  console.log('📦 Compilando TypeScript...');
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  
  // Iniciar servidor
  console.log('🚀 Iniciando servidor...');
  require('./dist/server/index.js');
  
} catch (error) {
  console.error('❌ Erro ao iniciar:', error);
  process.exit(1);
}