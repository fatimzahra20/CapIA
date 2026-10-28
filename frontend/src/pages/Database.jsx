import { useEffect, useState } from "react";
import { Database as DatabaseIcon } from "lucide-react";
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
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#102A43]">
        {lang === "en" ? "Database" : "Base de données"}
      </h1>
      <p className="mb-6 text-sm text-[#627D98]">
        {lang === "en"
          ? "Manage your data connection."
          : "Gérez votre connexion aux données."}
      </p>

      <div className="rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-[0_8px_30px_rgba(16,42,67,0.05)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2C3D] text-[#5EEAD4]">
            <DatabaseIcon size={18} />
          </span>
          <div>
            <div className="text-lg font-medium text-[#102A43]">PostgreSQL</div>
            <div className="flex items-center gap-2 text-sm text-[#627D98]">
              <span
                className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-400"}`}
              />
              {ok
                ? lang === "en"
                  ? "Connected"
                  : "Connecté"
                : lang === "en"
                  ? "Disconnected"
                  : "Déconnecté"}
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#627D98]">
          {lang === "en"
            ? "Connecting additional databases will be available in a later version."
            : "La connexion à d'autres bases de données sera disponible dans une version ultérieure."}
        </p>
      </div>
    </div>
  );
}

export default Database;
