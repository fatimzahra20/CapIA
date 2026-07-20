import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { login as loginRequest } from "../services/api";
import { saveSession } from "../services/auth";

function Login({ onSuccess, lang = "fr" }) {
  const [email, setEmail] = useState("demo@capai.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginRequest(email.trim(), password);
      saveSession(data.access_token, data.user);
      onSuccess(data.user);
    } catch (err) {
      setError(
        err.message ||
          (lang === "fr"
            ? "Email ou mot de passe incorrect"
            : "Incorrect email or password"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#212121] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[#333] bg-[#2A2A2A] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB]/15 text-[#2563EB]">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Bienvenue sur CAP AI
          </h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Connectez-vous pour analyser vos données
          </p>
        </div>

        <label className="mb-4 block text-left text-sm text-[#A1A1AA]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#333] bg-[#212121] px-4 py-3 text-[#ECECEC] outline-none focus:border-[#2563EB]"
          />
        </label>

        <label className="mb-5 block text-left text-sm text-[#A1A1AA]">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#333] bg-[#212121] px-4 py-3 text-[#ECECEC] outline-none focus:border-[#2563EB]"
          />
        </label>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 font-medium text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
          {!loading && <ArrowUp size={16} className="rotate-90" />}
        </button>
      </form>
    </div>
  );
}

export default Login;
