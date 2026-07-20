import { useState } from "react";
import { ArrowUp } from "lucide-react";

function ChatInput({ onSubmit, loading, placeholder }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-[28px] border border-[#333] bg-[#2A2A2A] px-4 py-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 bg-transparent text-[15px] text-[#ECECEC] outline-none placeholder:text-[#8E8E8E]"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white transition disabled:opacity-35"
        aria-label="Envoyer"
      >
        <ArrowUp size={16} />
      </button>
    </form>
  );
}

export default ChatInput;
