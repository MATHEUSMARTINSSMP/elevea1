// src/pages/upgrade.tsx
import { useEffect } from "react";

const MP_VIP_URL =
  import.meta.env.VITE_MERCADOPAGO_VIP_URL ||
  "https://www.mercadopago.com.br/checkout/vip-exemplo";

export default function UpgradeRedirect() {
  useEffect(() => {
    const u = new URL(MP_VIP_URL);
    const qs = new URLSearchParams(window.location.search);
    for (const [k, v] of qs.entries()) u.searchParams.set(k, v);
    window.location.replace(u.toString());
  }, []);

  return (
    <div className="min-h-screen grid place-items-center">
      <p>Redirecionando para o checkout…</p>
    </div>
  );
}
