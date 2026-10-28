import { useState } from "react";
import { BarChart3, Shield } from "lucide-react";
import { pingidDemoLogin } from "../services/api";
import { saveSession } from "../services/auth";

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePingId(event) {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Saisissez votre email professionnel pour PingID.");
      return;
    }
    setLoading(true);
    try {
      const data = await pingidDemoLogin(
        email.trim(),
        fullName.trim() || email.trim().split("@")[0]
      );
      saveSession(data.access_token, data.user);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message || "Connexion PingID impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F2C3D] text-[#5EEAD4] shadow-md">
            <BarChart3 size={22} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#102A43]">
            Bienvenue sur CAP AI
          </h1>
          <p className="mt-2 text-sm text-[#627D98]">
            Connexion uniquement via PingID. Chaque compte a son propre
            historique.
          </p>
        </div>

        <form
          onSubmit={handlePingId}
          className="rounded-2xl border border-[#E3E8EF] bg-white p-7 shadow-[0_10px_40px_rgba(16,42,67,0.06)]"
        >
          <label className="mb-4 block text-left text-sm font-medium text-[#486581]">
            Email professionnel
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] px-4 py-3 text-[#102A43] outline-none transition focus:border-[#0D9488] focus:bg-white"
              placeholder="prenom.nom@entreprise.com"
            />
          </label>

          <label className="mb-5 block text-left text-sm font-medium text-[#486581]">
            Nom (optionnel)
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] px-4 py-3 text-[#102A43] outline-none transition focus:border-[#0D9488] focus:bg-white"
              placeholder="Fatim Zahra"
            />
          </label>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2C3D] px-4 py-3 font-medium text-white transition hover:bg-[#16384c] disabled:opacity-50"
          >
            <Shield size={16} />
            {loading ? "Connexion PingID…" : "Se connecter avec PingID"}
          </button>
          <p className="mt-3 text-center text-[11px] text-[#627D98]">
            L’historique est privé : un email = un utilisateur = ses analyses.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
