function Settings({ lang, onLangChange, user, onLogout }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {lang === "en" ? "Settings" : "Paramètres"}
      </h1>

      <section className="mb-4 rounded-xl border border-[#333] bg-[#2A2A2A] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#ECECEC]">
          {lang === "en" ? "User information" : "Informations utilisateur"}
        </h2>
        <p className="text-sm text-white">{user?.full_name}</p>
        <p className="mt-1 text-sm text-[#A1A1AA]">{user?.email}</p>
      </section>

      <section className="mb-4 rounded-xl border border-[#333] bg-[#2A2A2A] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#ECECEC]">
          {lang === "en" ? "Language" : "Langue"}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onLangChange("fr")}
            className={`rounded-full px-4 py-2 text-sm ${
              lang === "fr"
                ? "bg-[#2563EB] text-white"
                : "border border-[#333] text-[#ECECEC]"
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => onLangChange("en")}
            className={`rounded-full px-4 py-2 text-sm ${
              lang === "en"
                ? "bg-[#2563EB] text-white"
                : "border border-[#333] text-[#ECECEC]"
            }`}
          >
            English
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="rounded-xl border border-[#333] px-4 py-2.5 text-sm text-[#ECECEC] transition hover:bg-[#2A2A2A]"
      >
        {lang === "en" ? "Log out" : "Déconnexion"}
      </button>
    </div>
  );
}

export default Settings;
