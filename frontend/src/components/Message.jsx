function Message({ role, children }) {
  const isUser = role === "user";

  return (
    <section className={`mb-6 ${isUser ? "flex justify-end" : ""}`}>
      <div className={`max-w-[92%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
            isUser ? "text-[#0D9488]" : "text-[#627D98]"
          }`}
        >
          {isUser ? "Vous" : "CAP AI"}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
            isUser
              ? "bg-[#0F2C3D] text-white shadow-sm"
              : "border border-[#E3E8EF] bg-white text-[#102A43] shadow-[0_6px_24px_rgba(16,42,67,0.04)]"
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export default Message;
