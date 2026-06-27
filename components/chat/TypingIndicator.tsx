export default function TypingIndicator() {
  return (
    <div className="flex gap-3 chat-bubble-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
        AI
      </div>
      <div className="bg-white border border-[#EDE8F5] rounded-2xl rounded-tl-sm px-4 py-3.5 flex gap-1.5 items-center">
        <span className="typing-dot w-2 h-2 rounded-full bg-[#C9A8E2]" />
        <span className="typing-dot w-2 h-2 rounded-full bg-[#C9A8E2]" />
        <span className="typing-dot w-2 h-2 rounded-full bg-[#C9A8E2]" />
      </div>
    </div>
  )
}
