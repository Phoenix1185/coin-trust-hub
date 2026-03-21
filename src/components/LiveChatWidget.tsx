import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Bot, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender_type: "user" | "ai" | "admin";
  message: string;
  created_at: string;
}

const LiveChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHuman, setIsHuman] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadConversation = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setConversationId(data.id);
        setIsHuman(!data.is_ai);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", data.id)
          .order("created_at", { ascending: true });
        if (msgs) setMessages(msgs as ChatMessage[]);
      }
    };

    loadConversation();
  }, [user, isOpen]);

  // Realtime subscription for admin replies
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.sender_type === "admin") {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (!isOpen) setHasUnread(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen]);

  const createConversation = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, status: "active", is_ai: true })
      .select()
      .single();
    if (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
    setConversationId(data.id);
    return data.id;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    const { data: savedMsg } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: convId,
        sender_type: "user",
        sender_id: user.id,
        message: userMessage,
      })
      .select()
      .single();

    if (savedMsg) {
      setMessages((prev) => [...prev, savedMsg as ChatMessage]);
    }

    // If human mode, don't call AI
    if (isHuman) {
      setIsLoading(false);
      return;
    }

    // Call AI
    try {
      const aiMessages = messages
        .filter((m) => m.sender_type !== "admin")
        .map((m) => ({
          role: m.sender_type === "user" ? "user" : "assistant",
          content: m.message,
        }));
      aiMessages.push({ role: "user", content: userMessage });

      const { data: aiData, error: aiError } = await supabase.functions.invoke("chat-ai", {
        body: { messages: aiMessages, conversation_id: convId },
      });

      if (aiError) throw aiError;

      const reply = aiData?.reply || "I apologize, please try again.";

      // Check for human transfer
      if (reply.includes("[TRANSFER_TO_HUMAN]")) {
        // Switch to human mode
        await supabase
          .from("chat_conversations")
          .update({ is_ai: false })
          .eq("id", convId);
        setIsHuman(true);

        const transferMsg = reply.replace("[TRANSFER_TO_HUMAN]", "").trim() ||
          "I'm connecting you with a live support agent. Please hold on, someone will be with you shortly.";

        const { data: aiSaved } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: convId,
            sender_type: "ai",
            message: transferMsg,
          })
          .select()
          .single();

        if (aiSaved) setMessages((prev) => [...prev, aiSaved as ChatMessage]);
      } else {
        // Save AI reply
        const { data: aiSaved } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: convId,
            sender_type: "ai",
            message: reply,
          })
          .select()
          .single();

        if (aiSaved) setMessages((prev) => [...prev, aiSaved as ChatMessage]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const { data: errSaved } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: convId,
          sender_type: "ai",
          message: "I'm having trouble right now. Please try again or contact support via the Support page.",
        })
        .select()
        .single();
      if (errSaved) setMessages((prev) => [...prev, errSaved as ChatMessage]);
    }

    setIsLoading(false);
  };

  const handleNewChat = async () => {
    if (conversationId) {
      await supabase
        .from("chat_conversations")
        .update({ status: "closed" })
        .eq("id", conversationId);
    }
    setConversationId(null);
    setMessages([]);
    setIsHuman(false);
  };

  if (!user) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => window.location.href = "/auth"}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-0"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHuman ? (
                <Headphones className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {isHuman ? "Live Support" : "BitCryptoTradingCo Support"}
                </p>
                <p className="text-xs opacity-80">
                  {isHuman ? "Connected to agent" : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-primary-foreground hover:bg-primary-foreground/20 text-xs h-7 px-2"
                >
                  New Chat
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">How can we help you today?</p>
                <p className="text-xs mt-1">Ask us anything about your account, deposits, or investments.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.sender_type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.sender_type !== "user" && (
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.sender_type === "admin" ? "bg-green-500/20" : "bg-primary/20"
                  )}>
                    {msg.sender_type === "admin" ? (
                      <Headphones className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.sender_type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : msg.sender_type === "admin"
                      ? "bg-green-500/10 border border-green-500/20 text-foreground rounded-bl-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.message}
                </div>
                {msg.sender_type === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isHuman ? "Type a message..." : "Ask a question..."}
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {isHuman && (
              <p className="text-[10px] text-green-500 mt-1.5 text-center">
                Connected to live agent — responses may take a moment
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-0 relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background" />
        )}
      </Button>
    </div>
  );
};

export default LiveChatWidget;
