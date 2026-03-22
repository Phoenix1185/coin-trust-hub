import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string;
  category: string | null;
  published_at: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (data) setPosts(data as BlogPost[]);
    };
    fetchPosts();
  }, []);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/"><Logo size="md" /></Link>
            <Button variant="ghost" onClick={() => setSelectedPost(null)}>← Back to Blog</Button>
          </div>
        </header>
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <Badge className="mb-4">{selectedPost.category || "General"}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedPost.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{selectedPost.author}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(selectedPost.published_at || selectedPost.created_at), "MMMM d, yyyy")}
              </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
              {selectedPost.content}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo size="md" /></Link>
          <Link to="/auth"><Button>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </header>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient-gold">Blog</span>
              </h1>
              <p className="text-muted-foreground text-lg">Latest crypto news, insights, and investment tips</p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="text-left bg-card/50 border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
                  >
                    <Badge variant="outline" className="mb-3">{post.category || "General"}</Badge>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.excerpt || post.content.slice(0, 150)}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>{format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
