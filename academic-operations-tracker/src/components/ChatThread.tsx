"use client";

import { useState, useEffect, useRef } from "react";
import { SendIcon, ClipIcon } from "@/components/Icons";
import type { ChatMessageWithAuthor } from "@/types";

export default function ChatThread({
  taskId,
  currentUserRole,
  currentUserId,
}: {
  taskId: string;
  currentUserRole: string;
  currentUserId: string;
}) {
  // currentUserId reserved for future features (e.g. edit/delete own messages)
  void currentUserId;

  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/tasks/${taskId}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        // silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [taskId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
      }
    } catch {
      // silently handle send errors
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(dateStr: string | Date) {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const isReadOnly = currentUserRole === "PRO_RECTOR";

  return (
    <div className="flex flex-col h-full max-h-[500px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-400">
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author.role === "TEAM_RESOURCE";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 px-1">
                  {msg.author.name} &middot; {msg.author.role.replace(/_/g, " ")}
                </p>
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    isOwn
                      ? "bg-[#0088B9] text-white ml-auto"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input bar or read-only notice */}
      {isReadOnly ? (
        <div className="border-t border-gray-200 bg-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500 text-center">Read-only view</p>
        </div>
      ) : (
        <div className="border-t border-gray-200 bg-white px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600"
            title="Attach file (coming soon)"
          >
            <ClipIcon />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 text-sm border border-gray-200 rounded-full px-3 py-2 focus:outline-none focus:border-nust-ceramic"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-full bg-[#0088B9] text-white disabled:opacity-40 hover:bg-[#007aa6] transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      )}
    </div>
  );
}
