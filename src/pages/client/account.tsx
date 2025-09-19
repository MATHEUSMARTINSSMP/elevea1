// src/pages/client/account.tsx
import { PrivateRoute, useSession } from "@/hooks/useSession";

export default function AccountPageGuarded() {
  return (
    <PrivateRoute allow="client">
      <AccountPage />
    </PrivateRoute>
  );
}

function AccountPage() {
  const { user } = useSession();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Minha conta</h1>
      <p className="text-sm text-gray-500 mt-2">{user?.email} • {user?.siteSlug || "—"}</p>
      <p className="text-sm text-gray-500 mt-4">Conteúdo em breve…</p>
    </div>
  );
}
