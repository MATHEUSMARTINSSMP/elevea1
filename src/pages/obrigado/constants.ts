// /src/pages/Obrigado/constants.ts
export const PALETAS = [
  { id: "dourado", nome: "Dourado elegante", cores: ["#b98a2f", "#111111", "#f6f3ee"] },
  { id: "azul", nome: "Azul confiança", cores: ["#1e3a8a", "#0f172a", "#f1f5f9"] },
  { id: "verde", nome: "Verde natural", cores: ["#166534", "#0b1f16", "#edf7ef"] },
  { id: "vermelho", nome: "Vermelho vibrante", cores: ["#b91c1c", "#111111", "#faf2f2"] },
  { id: "preto-branco", nome: "Preto & Branco", cores: ["#111111", "#ffffff", "#e5e7eb"] },
] as const;

export const TEMPLATES = [
  { id: "classico", nome: "Clássico", descricao: "Hero simples, sobre, serviços em cards, depoimentos e contato." },
  { id: "vitrine", nome: "Vitrine",  descricao: "Grade de fotos/produtos, destaque para WhatsApp e mapa." },
  { id: "minimal", nome: "Minimal",  descricao: "Seções amplas, tipografia forte e foco em CTA." },
] as const;
