import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, User, Bot, Clock, XCircle, Star, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; full_name: string | null; phone: string | null };
  last_message?: string;
  rating?: number;
}

interface ChatMsg {
  id: string;
  conversation_id: string;
  sender_type: "user" | "ai" | "admin";
  sender_id: string | null;
  message: string;
  created_at: string;
}

const LiveChatAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const load = async () => {
      const { data: convs } = await supabase
        .from("chat_conversations").select("*").order("updated_at", { ascending: false });
      if (!convs) return;

      const enriched = await Promise.all(
        convs.map(async (c) => {
          const { data: profile } = await supabase
            .from("profiles").select("email, full_name, phone").eq("user_id", c.user_id).single();
          const { data: lastMsg } = await supabase
            .from("chat_messages").select("message").eq("conversation_id", c.id)
            .order("created_at", { ascending: false }).limit(1).single();
          const { data: ratingData } = await supabase
            .from("chat_ratings").select("rating").eq("conversation_id", c.id).single();
          return { ...c, profiles: profile || undefined, last_message: lastMsg?.message, rating: ratingData?.rating };
        })
      );
      setConversations(enriched);
    };

    load();
    const channel = supabase.channel("admin-chat-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("chat_messages").select("*")
        .eq("conversation_id", selectedConv).order("created_at", { ascending: true });
      if (data) setMessages(data as ChatMsg[]);
    };
    loadMessages();

    const channel = supabase.channel(`admin-chat-${selectedConv}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMsg;
        setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedConv || !user) return;
    setIsSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: selectedConv, sender_type: "admin", sender_id: user.id, message: reply.trim(),
    });
    if (error) toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    else setReply("");
    setIsSending(false);
  };

  const handleCloseConv = async (convId: string) => {
    // Send closing message before closing
    await supabase.from("chat_messages").insert({
      conversation_id: convId, sender_type: "admin", sender_id: user?.id,
      message: "This conversation has been closed by our support team. Thank you for reaching out! Please rate your experience.",
    });
    await supabase.from("chat_conversations").update({ status: "closed" }).eq("id", convId);
    toast({ title: "Conversation closed" });
    if (selectedConv === convId) { setSelectedConv(null); setMessages([]); }
  };

  const handleReopenConv = async (convId: string) => {
    await supabase.from("chat_conversations").update({ status: "active" }).eq("id", convId);
    toast({ title: "Conversation reopened" });
  };

  const activeConvs = conversations.filter((c) => c.status === "active");
  const humanConvs = activeConvs.filter((c) => !c.is_ai);
  const closedConvs = conversations.filter((c) => c.status === "closed");
  const selectedConvData = conversations.find((c) => c.id === selectedConv);

  // Extract user details from messages (the transfer form data)
  const userDetailsFromChat = messages.find(m => m.sender_type === "ai" && m.message.includes("[User Details]"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" /> Conversations
          </CardTitle>
          <CardDescription>{humanConvs.length} awaiting reply · {activeConvs.length} active</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
          {humanConvs.length > 0 && <p className="text-xs font-semibold text-destructive px-2 py-1">Needs Human Reply</p>}
          {humanConvs.map((c) => (
            <button key={c.id} onClick={() => setSelectedConv(c.id)}
              className={cn("w-full text-left p-3 rounded-lg transition-colors border",
                selectedConv === c.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted border-transparent")}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{c.profiles?.full_name || c.profiles?.email || "Unknown"}</span>
                <Badge variant="destructive" className="text-[10px]">Waiting</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</p>
            </button>
          ))}

          {activeConvs.filter((c) => c.is_ai).length > 0 && <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mt-2">AI Handling</p>}
          {activeConvs.filter((c) => c.is_ai).map((c) => (
            <button key={c.id} onClick={() => setSelectedConv(c.id)}
              className={cn("w-full text-left p-3 rounded-lg transition-colors border",
                selectedConv === c.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted border-transparent")}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{c.profiles?.full_name || c.profiles?.email || "Unknown"}</span>
                <Badge variant="secondary" className="text-[10px]">AI</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message}</p>
            </button>
          ))}

          {closedConvs.length > 0 && <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mt-2">Closed</p>}
          {closedConvs.slice(0, 15).map((c) => (
            <button key={c.id} onClick={() => setSelectedConv(c.id)}
              className={cn("w-full text-left p-3 rounded-lg transition-colors border opacity-60",
                selectedConv === c.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted border-transparent")}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{c.profiles?.full_name || c.profiles?.email || "Unknown"}</span>
                <div className="flex items-center gap-1">
                  {c.rating && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary">
                      <Star className="w-3 h-3 fill-primary" />{c.rating}
                    </span>
                  )}
                  <Badge variant="outline" className="text-[10px]">Closed</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message}</p>
            </button>
          ))}

          {conversations.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">No conversations yet</div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedConv ? (
          <>
            <CardHeader className="pb-2 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedConvData?.profiles?.full_name || "User Chat"}</CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedConvData?.profiles?.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />{selectedConvData.profiles.email}
                      </span>
                    )}
                    {selectedConvData?.profiles?.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{selectedConvData.profiles.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedConvData?.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => handleCloseConv(selectedConv)}>
                      <XCircle className="w-3.5 h-3.5 mr-1" />Close
                    </Button>
                  )}
                  {selectedConvData?.status === "closed" && (
                    <Button size="sm" variant="outline" onClick={() => handleReopenConv(selectedConv)}>Reopen</Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.sender_type === "admin" ? "justify-end" : "justify-start")}>
                  {msg.sender_type !== "admin" && (
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.sender_type === "user" ? "bg-secondary" : "bg-primary/20")}>
                      {msg.sender_type === "user" ? <User className="w-3.5 h-3.5 text-muted-foreground" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  )}
                  <div className="max-w-[75%]">
                    <div className={cn("rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                      msg.sender_type === "admin" ? "bg-primary text-primary-foreground rounded-br-md"
                      : msg.sender_type === "user" ? "bg-muted text-foreground rounded-bl-md"
                      : "bg-primary/10 text-foreground rounded-bl-md"
                    )}>{msg.message}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {msg.sender_type === "ai" ? "AI" : msg.sender_type === "admin" ? "You" : "User"} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            {selectedConvData?.status === "active" && (
              <div className="border-t border-border p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex gap-2">
                  <Input value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..." disabled={isSending} className="flex-1" />
                  <Button type="submit" size="icon" disabled={!reply.trim() || isSending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LiveChatAdmin;
