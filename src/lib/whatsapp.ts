// src/lib/whatsapp.ts
const PHONE = "5596981032928"; // DDI + DDD + número, só dígitos

const DEFAULT_MSG = "Olá! Quero um site Elevea. Pode me ajudar?";

// Gera link dinâmico para abrir WhatsApp Web/App
export const waMessage = (msg: string = DEFAULT_MSG) =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

export const WHATSAPP_URL = waMessage();
