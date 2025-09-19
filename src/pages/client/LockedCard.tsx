// src/pages/client/LockedCard.tsx
import React from "react";
import UpgradeButton from "./UpgradeButton";

/**
 * Card bloqueado que aparece para quem está no plano Essencial.
 * Mostra blur do conteúdo e um CTA para fazer upgrade.
 */
export default function LockedCard() {
  return (
    <div className="relative rounded-2xl border bg-white shadow overflow-hidden">
      {/* Conteúdo "exemplo" por trás do blur (pode deixar vazio se quiser) */}
      <div className="p-6 opacity-60 select-none pointer-events-none">
        <div className="h-28 rounded-xl bg-gray-100 mb-3" />
        <div className="h-3 w-2/3 bg-gray-100 mb-2 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
      </div>

      {/* Camada com blur e mensagem de bloqueio */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 grid place-items-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-sm uppercase tracking-wide text-gray-500">
            Recurso exclusivo do Plano VIP
          </div>
          <h3 className="text-xl font-semibold mt-1 mb-3">
            Desbloqueie relatórios e personalizações
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Faça upgrade e tenha acesso às métricas completas, troca de fotos,
            editor de tema e muito mais.
          </p>
          <UpgradeButton />
        </div>
      </div>
    </div>
  );
}
