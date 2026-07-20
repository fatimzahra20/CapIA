import { useEffect, useState } from "react";
import { fetchDbHealth } from "../services/api";

function Database({ lang }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetchDbHealth()
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {lang === "en" ? "Database" : "Base de données"}
      </h1>
      <div className="rounded-xl border border-[#333] bg-[#2A2A2A] p-5">
        <div className="mb-2 text-lg font-medium text-white">PostgreSQL</div>
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span
            className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-400"}`}
          />
          {ok
            ? lang === "en"
              ? "Connected"
              : "Connecté"
            : lang === "en"
              ? "Disconnected"
              : "Déconnecté"}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
          {lang === "en"
            ? "This page will later allow connecting additional databases."
            : "Cette page permettra plus tard de connecter d'autres bases de données."}
        </p>
      </div>
    </div>
  );
}

export default Database;
