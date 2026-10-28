import Message from "./Message";
import KPIBubbleGrid from "./KPIBubbleGrid";
import ChartCard from "./ChartCard";
import ChartViewer from "./file/ChartViewer";
import DataTable from "./DataTable";
import InterpretationCard from "./InterpretationCard";
import SuggestionChips from "./SuggestionChips";
import { FileText, Image as ImageIcon, LayoutDashboard } from "lucide-react";

function Conversation({ messages, loading, lang, onAsk }) {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      {messages.map((message, index) => {
        const answerLang =
          message.result?.language === "en" || message.result?.language === "fr"
            ? message.result.language
            : lang;
        return (
          <Message key={`${message.role}-${index}`} role={message.role}>
            {message.role === "user" ? (
              <div className="space-y-2">
                {message.attachment && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left text-xs">
                    {message.attachment.isImage ? (
                      <ImageIcon size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                    <span className="max-w-[220px] truncate">
                      {message.attachment.name}
                    </span>
                  </div>
                )}
                <p>{message.content}</p>
              </div>
            ) : (
              <div className="animate-[fadeIn_0.35s_ease] text-left">
                {message.error ? (
                  <p className="text-red-600">{message.error}</p>
                ) : message.result?.interpretation_only ||
                  message.result?.interpretation_expanded ? (
                  <>
                    <p className="mb-4 text-[#486581]">
                      {answerLang === "en"
                        ? "Here is a more detailed interpretation."
                        : "Voici une interprétation plus détaillée."}
                    </p>
                    <InterpretationCard
                      text={
                        message.result?.interpretation || message.result?.answer
                      }
                      lang={answerLang}
                      expanded
                    />
                    {message.result?.suggestions?.length > 0 && onAsk && (
                      <SuggestionChips
                        suggestions={message.result.suggestions}
                        lang={answerLang}
                        loading={loading}
                        onSelect={(q) =>
                          onAsk(q, null, message.result?.file_id || null)
                        }
                      />
                    )}
                  </>
                ) : (
                  <>
                    {!message.result?.charts_only && (
                      <div className="mb-5 flex flex-wrap items-center gap-2">
                        <p className="text-[#486581]">
                          {message.result?.mode === "dashboard"
                            ? answerLang === "en"
                              ? "Dashboard generated from your file."
                              : "Tableau de bord généré à partir de votre fichier."
                            : message.result?.source === "file"
                              ? answerLang === "en"
                                ? "Here is the analysis of your file."
                                : "Voici l'analyse de votre fichier."
                              : answerLang === "en"
                                ? "Here is the analysis of your data."
                                : "Voici l'analyse de vos données."}
                        </p>
                        {message.result?.mode === "dashboard" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDFA] px-2.5 py-1 text-xs font-medium text-[#0F766E]">
                            <LayoutDashboard size={12} />
                            Dashboard
                          </span>
                        )}
                      </div>
                    )}

                    {message.result?.kpi_bubbles?.length > 0 && (
                      <KPIBubbleGrid
                        bubbles={message.result.kpi_bubbles}
                        lang={answerLang}
                      />
                    )}

                    {message.result?.charts_only &&
                      !message.result?.kpi_bubbles?.length &&
                      message.result?.charts?.length > 0 && (
                        <div className="mb-4">
                          <ChartViewer
                            lang={answerLang}
                            charts={message.result.charts}
                          />
                        </div>
                      )}

                    {!message.result?.charts_only &&
                      message.result?.charts?.length > 0 &&
                      !message.result?.kpi_bubbles?.length && (
                        <div className="mb-4">
                          <ChartViewer
                            lang={answerLang}
                            charts={message.result.charts}
                          />
                        </div>
                      )}

                    {!message.result?.charts_only &&
                      !message.result?.charts?.length &&
                      !message.result?.kpi_bubbles?.length && (
                        <ChartCard
                          data={message.result?.data}
                          language={answerLang}
                        />
                      )}

                    {!message.result?.charts_only && (
                      <>
                        <DataTable
                          data={message.result?.data}
                          lang={answerLang}
                        />
                        <InterpretationCard
                          text={
                            message.result?.interpretation ||
                            message.result?.answer
                          }
                          lang={answerLang}
                        />
                      </>
                    )}

                    {message.result?.suggestions?.length > 0 && onAsk && (
                      <SuggestionChips
                        suggestions={message.result.suggestions}
                        lang={answerLang}
                        loading={loading}
                        onSelect={(q) =>
                          onAsk(q, null, message.result?.file_id || null)
                        }
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </Message>
        );
      })}

      {loading && (
        <Message role="assistant">
          <p className="animate-[softPulse_1.4s_ease_infinite] text-[#627D98]">
            {lang === "en" ? "Analyzing…" : "Analyse en cours…"}
          </p>
        </Message>
      )}
    </div>
  );
}

export default Conversation;
