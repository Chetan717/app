import { useEffect } from "react";

export function Logout() {
  useEffect(() => {
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("mlmProfile");
    localStorage.removeItem("theme");
    localStorage.removeItem("usermlm");
    localStorage.removeItem("mlmform");
    localStorage.removeItem("selType");

    // Hard redirect — forces full re-render, clears all stale state
    window.location.replace("/login");
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Logging out...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}