import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { setToken, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    setToken(token);

    api
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data.data); // sesuaikan struktur backend
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [setToken, setUser, logout]);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return <>{children}</>;
}
