import Message from "./Message";
import KPIGrid from "./KPIGrid";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import InterpretationCard from "./InterpretationCard";

function Conversation({ messages, loading, lang }) {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      {messages.map((message, index) => (
        <Message key={`${message.role}-${index}`} role={message.role}>
          {message.role === "user" ? (
            <p>{message.content}</p>
          ) : (
            <div className="animate-[fadeIn_0.35s_ease]">
              {message.error ? (
                <p className="text-red-300">{message.error}</p>
              ) : (
                <>
                  <p className="mb-5">
                    {lang === "en"
                      ? "Here is the analysis of your data."
                      : "Voici l'analyse de vos données."}
                  </p>
                  <KPIGrid kpis={message.result?.kpis} lang={lang} />
                  <ChartCard
                    data={message.result?.data}
                    language={message.result?.language || lang}
                  />
                  <DataTable data={message.result?.data} lang={lang} />
                  <InterpretationCard
                    text={message.result?.interpretation}
                    lang={lang}
                  />
                </>
              )}
            </div>
          )}
        </Message>
      ))}

      {loading && (
        <Message role="assistant">
          <p className="italic text-[#A1A1AA]">
            {lang === "en" ? "Thinking…" : "Réflexion…"}
          </p>
        </Message>
      )}
    </div>
  );
}

export default Conversation;
