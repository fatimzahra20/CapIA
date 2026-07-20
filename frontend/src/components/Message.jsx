function Message({ role, children }) {
  const label = role === "user" ? "Vous" : "CAP AI";

  return (
    <section className="mb-7">
      <div className="mb-2 text-sm font-semibold text-[#ECECEC]">{label}</div>
      <div className="text-[15px] leading-relaxed text-[#ECECEC]">{children}</div>
    </section>
  );
}

export default Message;
