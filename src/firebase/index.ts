// src/firebase/index.ts
/**
 * Stub temporário para evitar dependência do pacote "firebase/app" no build.
 * Assim o Vite/Netlify não quebra enquanto o Firebase não for realmente usado.
 * 
 * Quando for integrar Firebase, remova este stub e implemente a
 * inicialização real aqui (importando de "firebase/app" etc.).
 */

export type FirebaseAppStub = null;

export function getFirebaseApp(): FirebaseAppStub {
  // Retorna null propositalmente – não usado por enquanto.
  return null;
}
