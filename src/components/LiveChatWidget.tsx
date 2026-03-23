import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Bot, Headphones, Star, History, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  sender_type: "user" | "ai" | "admin";
  message: string;
  created_at: string;
}

interface ChatConversation {
  id: string;
  status: string;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
}

const LiveChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHuman, setIsHuman] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferName, setTransferName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

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
        setIsClosed(false);
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

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.sender_type === "admin") {
          setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          if (!isOpen) setHasUnread(true);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "chat_conversations",
        filter: `id=eq.${conversationId}`,
      }, (payload) => {
        const updated = payload.new as ChatConversation;
        if (updated.status === "closed") {
          setIsClosed(true);
          setShowRating(true);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, isOpen]);

  const createConversation = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, status: "active", is_ai: true })
      .select()
      .single();
    if (error) return null;
    setConversationId(data.id);
    setIsClosed(false);
    setShowRating(false);
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
      if (!convId) { setIsLoading(false); return; }
    }

    const { data: savedMsg } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: convId, sender_type: "user", sender_id: user.id, message: userMessage })
      .select().single();
    if (savedMsg) setMessages((prev) => [...prev, savedMsg as ChatMessage]);

    if (isHuman) { setIsLoading(false); return; }

    try {
      const aiMessages = messages
        .filter((m) => m.sender_type !== "admin")
        .map((m) => ({ role: m.sender_type === "user" ? "user" : "assistant", content: m.message }));
      aiMessages.push({ role: "user", content: userMessage });

      const { data: aiData, error: aiError } = await supabase.functions.invoke("chat-ai", {
        body: { messages: aiMessages, conversation_id: convId },
      });
      if (aiError) throw aiError;

      const reply = aiData?.reply || "I apologize, please try again.";

      if (reply.includes("[TRANSFER_TO_HUMAN]")) {
        const transferMsg = reply.replace("[TRANSFER_TO_HUMAN]", "").trim() ||
          "I'd like to connect you with a live support agent. Please provide your details so our team can assist you better.";

        const { data: aiSaved } = await supabase.from("chat_messages")
          .insert({ conversation_id: convId, sender_type: "ai", message: transferMsg })
          .select().single();
        if (aiSaved) setMessages((prev) => [...prev, aiSaved as ChatMessage]);

        setShowTransferForm(true);
        setTransferName(user.user_metadata?.full_name || "");
        setTransferEmail(user.email || "");
      } else {
        const { data: aiSaved } = await supabase.from("chat_messages")
          .insert({ conversation_id: convId, sender_type: "ai", message: reply })
          .select().single();
        if (aiSaved) setMessages((prev) => [...prev, aiSaved as ChatMessage]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const { data: errSaved } = await supabase.from("chat_messages")
        .insert({ conversation_id: convId, sender_type: "ai", message: "I'm having trouble right now. Please try again or contact support via the Support page." })
        .select().single();
      if (errSaved) setMessages((prev) => [...prev, errSaved as ChatMessage]);
    }
    setIsLoading(false);
  };

  const handleTransferToHuman = async () => {
    if (!conversationId || !transferName.trim() || !transferEmail.trim()) return;

    await supabase.from("chat_conversations").update({ is_ai: false }).eq("id", conversationId);
    setIsHuman(true);
    setShowTransferForm(false);

    const detailsMsg = `[User Details]\nName: ${transferName}\nEmail: ${transferEmail}\n\nConnecting you with a live support agent. Please hold on, someone will be with you shortly.`;
    const { data: saved } = await supabase.from("chat_messages")
      .insert({ conversation_id: conversationId, sender_type: "ai", message: detailsMsg })
      .select().single();
    if (saved) setMessages((prev) => [...prev, saved as ChatMessage]);
  };

  const handleSubmitRating = async () => {
    if (!conversationId || !user || rating === 0) return;
    await supabase.from("chat_ratings").insert({
      conversation_id: conversationId,
      user_id: user.id,
      rating,
      feedback: ratingFeedback || null,
    });
    setShowRating(false);
    setRating(0);
    setRatingFeedback("");
    setConversationId(null);
    setMessages([]);
    setIsHuman(false);
    setIsClosed(false);
  };

  const handleNewChat = async () => {
    if (conversationId) {
      await supabase.from("chat_conversations").update({ status: "closed" }).eq("id", conversationId);
    }
    setConversationId(null);
    setMessages([]);
    setIsHuman(false);
    setIsClosed(false);
    setShowRating(false);
    setShowTransferForm(false);
    setShowHistory(false);
  };

  const loadChatHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setChatHistory(data as ChatConversation[]);
    setShowHistory(true);
  };

  const openHistoryChat = async (conv: ChatConversation) => {
    setConversationId(conv.id);
    setIsHuman(!conv.is_ai);
    setIsClosed(conv.status === "closed");
    setShowHistory(false);
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    if (msgs) setMessages(msgs as ChatMessage[]);
  };

  // Not logged in — redirect to auth
  if (!user) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
        <Button onClick={() => window.location.href = "/auth"} size="lg"
          className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-0">
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>
    );
  }

  const chatPanelClasses = isExpanded
    ? "fixed inset-0 z-[60] bg-card flex flex-col"
    : "absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden";

  const renderMessages = () => (
    <>
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">How can we help you today?</p>
          <p className="text-xs mt-1">Ask us anything about your account, deposits, or investments.</p>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} className={cn("flex gap-2", msg.sender_type === "user" ? "justify-end" : "justify-start")}>
          {msg.sender_type !== "user" && (
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
              msg.sender_type === "admin" ? "bg-green-500/20" : "bg-primary/20")}>
              {msg.sender_type === "admin" ? <Headphones className="w-3.5 h-3.5 text-green-500" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
            </div>
          )}
          <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            msg.sender_type === "user" ? "bg-primary text-primary-foreground rounded-br-md"
            : msg.sender_type === "admin" ? "bg-green-500/10 border border-green-500/20 text-foreground rounded-bl-md"
            : "bg-muted text-foreground rounded-bl-md"
          )}>{msg.message}</div>
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
      {isClosed && !showRating && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">This conversation has been closed.</p>
          <Button size="sm" variant="outline" onClick={() => setShowRating(true)}>Rate this conversation</Button>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );

  return (
    <>
      {/* Expanded fullscreen overlay */}
      {isOpen && isExpanded && (
        <div className={chatPanelClasses}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showHistory ? (
                <button onClick={() => setShowHistory(false)} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
              ) : isHuman ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              <div>
                <p className="font-semibold text-sm">
                  {showHistory ? "Chat History" : isHuman ? "Live Support" : "BitCryptoTrading Support"}
                </p>
                <p className="text-xs opacity-80">
                  {showHistory ? "Previous conversations" : isClosed ? "Chat ended" : isHuman ? "Connected to agent" : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={loadChatHistory}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0">
                <History className="w-3.5 h-3.5" />
              </Button>
              {messages.length > 0 && !showHistory && (
                <Button variant="ghost" size="sm" onClick={handleNewChat}
                  className="text-primary-foreground hover:bg-primary-foreground/20 text-xs h-7 px-2">New</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-2xl mx-auto w-full">
              {chatHistory.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No chat history</p>
              ) : chatHistory.map((conv) => (
                <button key={conv.id} onClick={() => openHistoryChat(conv)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{conv.is_ai ? "AI Support" : "Live Agent"}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                      conv.status === "active" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                    )}>{conv.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          ) : showRating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 max-w-md mx-auto">
              <p className="text-sm font-medium text-center">How was your support experience?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform">
                    <Star className={cn("w-8 h-8", s <= rating ? "text-primary fill-primary" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <Textarea value={ratingFeedback} onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Any feedback? (optional)" className="text-sm" rows={3} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowRating(false); handleNewChat(); }}>Skip</Button>
                <Button size="sm" onClick={handleSubmitRating} disabled={rating === 0}>Submit</Button>
              </div>
            </div>
          ) : showTransferForm ? (
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {renderMessages()}
              </div>
              <div className="p-4 bg-muted/50 border-t border-border space-y-3">
                <p className="text-sm font-medium">Please confirm your details:</p>
                <Input value={transferName} onChange={(e) => setTransferName(e.target.value)} placeholder="Full name" className="text-sm" />
                <Input value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="Email address" className="text-sm" type="email" />
                <Button size="sm" className="w-full" onClick={handleTransferToHuman}
                  disabled={!transferName.trim() || !transferEmail.trim()}>
                  <Headphones className="w-3.5 h-3.5 mr-1" /> Connect to Live Agent
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {renderMessages()}
              </div>
              {!isClosed && (
                <div className="border-t border-border p-3">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                    <Input value={input} onChange={(e) => setInput(e.target.value)}
                      placeholder={isHuman ? "Type a message..." : "Ask a question..."} className="flex-1 text-sm" disabled={isLoading} />
                    <Button type="submit" size="icon" disabled={!input.trim() || isLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {isHuman && (
                    <p className="text-[10px] text-green-500 mt-1.5 text-center">Connected to live agent — responses may take a moment</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Normal floating widget */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
        {isOpen && !isExpanded && (
          <div className={chatPanelClasses}>
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showHistory ? (
                  <button onClick={() => setShowHistory(false)} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
                ) : isHuman ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                <div>
                  <p className="font-semibold text-sm">
                    {showHistory ? "Chat History" : isHuman ? "Live Support" : "BitCryptoTrading Support"}
                  </p>
                  <p className="text-xs opacity-80">
                    {showHistory ? "Previous conversations" : isClosed ? "Chat ended" : isHuman ? "Connected to agent" : "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={loadChatHistory}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-7 w-7 p-0">
                  <History className="w-3.5 h-3.5" />
                </Button>
                {messages.length > 0 && !showHistory && (
                  <Button variant="ghost" size="sm" onClick={handleNewChat}
                    className="text-primary-foreground hover:bg-primary-foreground/20 text-xs h-7 px-2">New</Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsExpanded(true)}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No chat history</p>
                ) : chatHistory.map((conv) => (
                  <button key={conv.id} onClick={() => openHistoryChat(conv)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{conv.is_ai ? "AI Support" : "Live Agent"}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                        conv.status === "active" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                      )}>{conv.status}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            ) : showRating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <p className="text-sm font-medium text-center">How was your support experience?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform">
                      <Star className={cn("w-8 h-8", s <= rating ? "text-primary fill-primary" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
                <Textarea value={ratingFeedback} onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="Any feedback? (optional)" className="text-sm" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowRating(false); handleNewChat(); }}>Skip</Button>
                  <Button size="sm" onClick={handleSubmitRating} disabled={rating === 0}>Submit</Button>
                </div>
              </div>
            ) : showTransferForm ? (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-2", msg.sender_type === "user" ? "justify-end" : "justify-start")}>
                      {msg.sender_type !== "user" && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        msg.sender_type === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                      )}>{msg.message}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                  <p className="text-sm font-medium">Please confirm your details:</p>
                  <Input value={transferName} onChange={(e) => setTransferName(e.target.value)} placeholder="Full name" className="text-sm" />
                  <Input value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="Email address" className="text-sm" type="email" />
                  <Button size="sm" className="w-full" onClick={handleTransferToHuman}
                    disabled={!transferName.trim() || !transferEmail.trim()}>
                    <Headphones className="w-3.5 h-3.5 mr-1" /> Connect to Live Agent
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {renderMessages()}
                </div>
                {!isClosed && (
                  <div className="border-t border-border p-3">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                      <Input value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder={isHuman ? "Type a message..." : "Ask a question..."} className="flex-1 text-sm" disabled={isLoading} />
                      <Button type="submit" size="icon" disabled={!input.trim() || isLoading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                    {isHuman && (
                      <p className="text-[10px] text-green-500 mt-1.5 text-center">Connected to live agent — responses may take a moment</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Button onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }} size="lg"
          className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-0 relative">
          {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </div>
    </>
  );
};

export default LiveChatWidget;
