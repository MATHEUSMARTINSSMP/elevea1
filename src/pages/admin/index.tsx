import { useEffect } from "react";
import { useSession, PrivateRoute } from "@/hooks/useSession";

export default function AdminIndex() {
  return (
    <PrivateRoute allow="admin">
      <AdminRedirect />
    </PrivateRoute>
  );
}

function AdminRedirect() {
  const { user } = useSession();
  useEffect(() => {
    if (user?.role === "admin") {
      window.location.replace("/admin/dashboard");
    }
  }, [user]);
  return null;
}
