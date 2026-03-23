import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Users, User, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const EmailTemplatesAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<"all_subscribers" | "specific_users">("all_subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const [{ data: subs }, { data: users }] = await Promise.all([
        supabase.from("newsletter_subscribers").select("*").eq("is_active", true).order("subscribed_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, full_name").order("created_at", { ascending: false }),
      ]);
      if (subs) setSubscribers(subs);
      if (users) setAllUsers(users);
    };
    loadData();
  }, []);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const getRecipientList = (): string[] => {
    if (recipientType === "all_subscribers") {
      return subscribers.map((s) => s.email);
    }
    return selectedEmails;
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Missing fields", description: "Subject and body are required", variant: "destructive" });
      return;
    }

    const recipients = getRecipientList();
    if (recipients.length === 0) {
      toast({ title: "No recipients", description: "Please select at least one recipient", variant: "destructive" });
      return;
    }

    setIsSending(true);
    setSentCount(0);
    setTotalToSend(recipients.length);

    let successCount = 0;
    let failCount = 0;

    for (const email of recipients) {
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "custom",
            data: { email, subject, message: body },
          },
        });
        successCount++;
        setSentCount(successCount);
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        failCount++;
      }
    }

    setIsSending(false);
    toast({
      title: "Emails sent",
      description: `${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
    });

    if (user) {
      await supabase.from("admin_activity_logs").insert({
        admin_id: user.id,
        action: "bulk_email_sent",
        target_type: "email",
        details: { subject, recipient_count: successCount, failed: failCount, type: recipientType },
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Compose */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Compose Email
          </CardTitle>
          <CardDescription>Send custom emails to subscribers or specific users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient Type</Label>
            <Select value={recipientType} onValueChange={(v: "all_subscribers" | "specific_users") => setRecipientType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_subscribers">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> All Newsletter Subscribers ({subscribers.length})</span>
                </SelectItem>
                <SelectItem value="specific_users">
                  <span className="flex items-center gap-2"><User className="w-4 h-4" /> Specific Users</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "specific_users" && (
            <div className="space-y-2">
              <Label>Selected Recipients ({selectedEmails.length})</Label>
              {selectedEmails.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleEmail(email)}>
                      {email} ✕
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                {filteredUsers.slice(0, 50).map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => toggleEmail(u.email)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                      selectedEmails.includes(u.email) && "bg-primary/10"
                    )}
                  >
                    <div>
                      <p className="font-medium">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {selectedEmails.includes(u.email) && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground p-3 text-center">No users found</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here. HTML is supported."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {isSending && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm">Sending... {sentCount}/{totalToSend}</span>
              <div className="flex-1 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(sentCount / totalToSend) * 100}%` }}
                />
              </div>
            </div>
          )}

          <Button onClick={handleSend} disabled={isSending || !subject.trim() || !body.trim()} className="w-full">
            {isSending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Send Email ({getRecipientList().length} recipients)</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscriber Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{subscribers.length}</p>
            <p className="text-xs text-muted-foreground">Active Subscribers</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">{allUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Subscribers</p>
            {subscribers.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{s.email}</span>
                <Badge variant="outline" className="text-[10px]">
                  {new Date(s.subscribed_at).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Emails are sent via the platform's configured SMTP service. Large batches are sent sequentially to avoid rate limits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplatesAdmin;
