import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  created_at: string;
  responded_at: string | null;
}

const Support = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setTickets(data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTicket.subject.trim() || !newTicket.message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: newTicket.subject,
        message: newTicket.message,
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Ticket Submitted",
        description: "We'll get back to you as soon as possible.",
      });

      setNewTicket({ subject: "", message: "" });
      fetchTickets();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-warning text-warning">Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-primary text-primary">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="border-success text-success">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground">Get help and submit support tickets</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* New Ticket Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Submit a Ticket
                </CardTitle>
                <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      placeholder="Provide details about your issue..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Ticket History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Your Tickets
                </CardTitle>
                <CardDescription>View and track your support requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No support tickets yet</p>
                    <p className="text-sm">Submit a ticket if you need assistance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                          }
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div>
                              <div className="font-medium">{ticket.subject}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(ticket.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(ticket.status)}
                            {expandedTicket === ticket.id ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                        {expandedTicket === ticket.id && (
                          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                Your Message
                              </div>
                              <p className="text-sm bg-muted/30 p-3 rounded-lg">{ticket.message}</p>
                            </div>
                            {ticket.response && (
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-success" />
                                  Support Response
                                </div>
                                <p className="text-sm bg-success/10 border border-success/20 p-3 rounded-lg">
                                  {ticket.response}
                                </p>
                                {ticket.responded_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Responded on {formatDate(ticket.responded_at)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">support@bitcryptotradingco.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <div className="text-sm text-muted-foreground">+1 (888) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Live Chat</div>
                    <div className="text-sm text-muted-foreground">Available 24/7</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">How long do withdrawals take?</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Withdrawals are processed within 24-48 hours after admin approval.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">What's the minimum investment?</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum investment starts at $100 for basic plans.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-sm">Is my investment secure?</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yes, we use bank-grade security to protect your funds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
