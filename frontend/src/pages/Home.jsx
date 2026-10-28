import { useEffect, useMemo, useState } from "react";
import ChatInput from "../components/ChatInput";
import Conversation from "../components/Conversation";
import SuggestionChips from "../components/SuggestionChips";
import { fetchSuggestions, uploadAnalysisFile } from "../services/api";

const FALLBACK_POOL = [
  "Chiffre d'affaires du mois",
  "Ventes par région",
  "Donne-moi le KPI en pie chart",
  "Plus d'interprétation",
  "Montre tous les KPI en graphiques",
  "Profit par région",
  "Meilleure région",
  "Montre le KPI en histogramme",
  "Quel est le chiffre d'affaires total ?",
  "Coût total versus ventes",
];

function shuffleLocal(pool, count = 5) {
  const unique = [...new Set(pool.filter(Boolean))];
  const copy = [...unique];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function getLastAssistantContext(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant" && messages[i].result) {
      return messages[i].result;
    }
  }
  return null;
}

function Home({ lang, messages, loading, onAsk }) {
  const [fileSuggestions, setFileSuggestions] = useState([]);
  const [pendingFileId, setPendingFileId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [defaultSuggestions, setDefaultSuggestions] = useState(
    shuffleLocal(FALLBACK_POOL)
  );
  const [shuffledFollowups, setShuffledFollowups] = useState(null);
  const isEmpty = messages.length === 0 && !loading;

  useEffect(() => {
    fetchSuggestions(lang)
      .then((data) => {
        if (data.suggestions?.length) {
          setDefaultSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        setDefaultSuggestions(shuffleLocal(FALLBACK_POOL));
      });
  }, [lang]);

  const lastContext = useMemo(
    () => getLastAssistantContext(messages),
    [messages]
  );

  const activeSuggestions = useMemo(() => {
    if (fileSuggestions.length) return fileSuggestions;
    if (shuffledFollowups?.length) return shuffledFollowups;
    if (lastContext?.suggestions?.length) return lastContext.suggestions;
    return defaultSuggestions;
  }, [fileSuggestions, lastContext, defaultSuggestions, shuffledFollowups]);

  async function handleShuffle() {
    if (fileSuggestions.length) {
      setFileSuggestions(shuffleLocal([...fileSuggestions, ...FALLBACK_POOL]));
      return;
    }
    if (lastContext?.suggestions?.length) {
      setShuffledFollowups(
        shuffleLocal([...lastContext.suggestions, ...FALLBACK_POOL])
      );
      return;
    }
    try {
      const data = await fetchSuggestions(lang);
      if (data.suggestions?.length) {
        setDefaultSuggestions(data.suggestions);
        return;
      }
    } catch {
      /* fallback local */
    }
    setDefaultSuggestions(shuffleLocal(FALLBACK_POOL));
  }

  async function handleFileAttach(file) {
    if (!file) {
      setFileSuggestions([]);
      setPendingFileId(null);
      return null;
    }
    setUploadingFile(true);
    try {
      const uploaded = await uploadAnalysisFile(file);
      setFileSuggestions(uploaded.suggestions || []);
      setPendingFileId(uploaded.file_id);
      return uploaded;
    } catch {
      setFileSuggestions([]);
      setPendingFileId(null);
      return null;
    } finally {
      setUploadingFile(false);
    }
  }

  function handleSubmit(question, file) {
    if (pendingFileId) {
      onAsk(question, null, pendingFileId);
    } else {
      onAsk(question, file);
    }
    setFileSuggestions([]);
    setPendingFileId(null);
    setShuffledFollowups(null);
  }

  function handleSuggestionClick(item) {
    setShuffledFollowups(null);
    if (pendingFileId) {
      onAsk(item, null, pendingFileId);
      setFileSuggestions([]);
      setPendingFileId(null);
    } else if (lastContext?.file_id) {
      onAsk(item, null, lastContext.file_id);
    } else {
      onAsk(item, null);
    }
  }

  const chatInput = (
    <ChatInput
      lang={lang}
      onSubmit={handleSubmit}
      onFileAttach={handleFileAttach}
      fileSuggestions={fileSuggestions}
      uploadingFile={uploadingFile}
      loading={loading}
      placeholder={
        lang === "en" ? "Ask a question..." : "Posez votre question..."
      }
    />
  );

  const suggestionBar = (
    <SuggestionChips
      suggestions={activeSuggestions}
      lang={lang}
      loading={loading || uploadingFile}
      onSelect={handleSuggestionClick}
      onShuffle={handleShuffle}
      centered={isEmpty}
    />
  );

  if (!isEmpty) {
    return (
      <div className="px-6 pb-10 pt-8">
        <Conversation
          messages={messages}
          loading={loading}
          lang={lang}
          onAsk={onAsk}
        />
        <div className="mx-auto mt-8 w-full max-w-[760px]">
          {chatInput}
          {suggestionBar}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-[680px] text-center">
        <p className="mb-3 text-sm font-medium text-[#0D9488]">CAP AI</p>
        <h1 className="mb-3 text-[34px] font-semibold tracking-tight text-[#102A43]">
          {lang === "en"
            ? "Hello, what would you like to analyze?"
            : "Bonjour, que souhaitez-vous analyser ?"}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-[#627D98]">
          {lang === "en"
            ? "Ask a question, attach a file, or shuffle random prompts below."
            : "Posez une question, joignez un fichier, ou tirez d'autres suggestions au hasard."}
        </p>

        {chatInput}
        {suggestionBar}
      </div>
    </div>
  );
}

export default Home;
