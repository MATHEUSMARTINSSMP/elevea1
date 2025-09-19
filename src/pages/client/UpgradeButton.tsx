// src/pages/client/UpgradeButton.tsx
import React from "react";

const MP_VIP_URL =
  import.meta.env.VITE_MERCADOPAGO_VIP_URL ||
  "https://www.mercadopago.com.br/checkout/vip-exemplo";

type Props = { className?: string; children?: React.ReactNode };

export default function UpgradeButton({ className = "", children }: Props) {
  function go() {
    const url = new URL(MP_VIP_URL);
    const p = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
      const v = p.get(k);
      if (v) url.searchParams.set(k, v);
    });
    window.location.assign(url.toString());
  }

  return (
    <button
      onClick={go}
      className={
        "inline-flex items-center justify-center rounded-xl px-4 py-2 bg-black text-white hover:bg-gray-800 " +
        className
      }
    >
      {children || "Fazer upgrade para o VIP"}
    </button>
  );
}
