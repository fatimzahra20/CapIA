function Settings({ lang, onLangChange, user, onLogout }) {
  const isEn = lang === "en";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#102A43]">
        {isEn ? "Settings" : "Paramètres"}
      </h1>
      <p className="mb-6 text-sm text-[#627D98]">
        {isEn
          ? "Your personal account information."
          : "Vos informations de compte personnel."}
      </p>

      <section className="mb-4 rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
        <h2 className="mb-3 text-sm font-semibold text-[#102A43]">
          {isEn ? "User information" : "Informations utilisateur"}
        </h2>
        <p className="text-sm font-medium text-[#102A43]">{user?.full_name}</p>
        <p className="mt-2 text-xs text-[#0D9488]">
          {isEn ? "Signed in with PingID" : "Connecté avec PingID"}
        </p>
      </section>

      <section className="mb-4 rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
        <h2 className="mb-3 text-sm font-semibold text-[#102A43]">
          {isEn ? "Language" : "Langue"}
        </h2>
        <p className="mb-3 text-xs text-[#627D98]">
          {isEn
            ? "This language is used for the interface and AI answers."
            : "Cette langue s’applique à l’interface et aux réponses IA."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onLangChange("fr")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              !isEn
                ? "bg-[#0D9488] text-white"
                : "border border-[#E3E8EF] text-[#486581] hover:bg-[#F8FAFC]"
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => onLangChange("en")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              isEn
                ? "bg-[#0D9488] text-white"
                : "border border-[#E3E8EF] text-[#486581] hover:bg-[#F8FAFC]"
            }`}
          >
            Anglais
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="rounded-xl border border-[#E3E8EF] bg-white px-4 py-2.5 text-sm text-[#486581] shadow-sm transition hover:border-red-200 hover:text-red-600"
      >
        {isEn ? "Log out" : "Déconnexion"}
      </button>
    </div>
  );
}

export default Settings;
