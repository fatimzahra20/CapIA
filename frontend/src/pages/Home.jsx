import ChatInput from "../components/ChatInput";
import Conversation from "../components/Conversation";

const SUGGESTIONS = [
  "Chiffre d'affaires du mois",
  "Ventes par région",
  "Produit le plus vendu",
  "Show sales by region",
];

function Home({
  lang,
  messages,
  loading,
  onAsk,
}) {
  const isEmpty = messages.length === 0 && !loading;

  if (!isEmpty) {
    return (
      <div className="px-5 pb-10 pt-10">
        <Conversation messages={messages} loading={loading} lang={lang} />
        <div className="mx-auto mt-8 w-full max-w-[760px]">
          <ChatInput
            onSubmit={onAsk}
            loading={loading}
            placeholder={
              lang === "en"
                ? "Ask a question about your data..."
                : "Posez une question sur vos données..."
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[680px] text-center">
        <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-white">
          Bonjour 👋
        </h1>
        <p className="mb-9 text-[15px] text-[#A1A1AA]">
          Comment puis-je vous aider aujourd&apos;hui ?
        </p>

        <ChatInput
          onSubmit={onAsk}
          loading={loading}
          placeholder="Posez une question sur vos données..."
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onAsk(item)}
              className="rounded-full border border-[#333] px-3.5 py-2 text-[13px] text-[#ECECEC] transition hover:bg-[#2A2A2A] disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
