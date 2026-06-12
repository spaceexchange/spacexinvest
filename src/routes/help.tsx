import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, BookOpen, MessageCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { listHelpArticles, getHelpArticle, helpCategories, type HelpArticle } from "@/lib/m9-help";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Orbit Investments" },
      { name: "description", content: "Find answers about investing, KYC, funding, security, rewards, and more on Orbit Investments." },
      { property: "og:title", content: "Help Center — Orbit Investments" },
      { property: "og:description", content: "Knowledge base, FAQ, and support for Orbit Investments." },
    ],
  }),
  component: HelpCenter,
});

function HelpCenter() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [cat, setCat] = useState<string>("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<HelpArticle | null>(null);

  useEffect(() => { helpCategories().then(setCats); }, []);
  useEffect(() => {
    const t = setTimeout(() => { listHelpArticles({ category: cat || undefined, search: search || undefined }).then(setArticles); }, 200);
    return () => clearTimeout(t);
  }, [cat, search]);

  const grouped = useMemo(() => {
    const m = new Map<string, HelpArticle[]>();
    articles.forEach((a) => { if (!m.has(a.category)) m.set(a.category, []); m.get(a.category)!.push(a); });
    return Array.from(m.entries());
  }, [articles]);

  async function open(slug: string) {
    const a = await getHelpArticle(slug);
    if (a) setActive(a);
  }

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 lg:py-16">
        {active ? (
          <ArticleView article={active} onBack={() => setActive(null)} />
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] text-muted-foreground mb-3">
                <BookOpen className="h-3.5 w-3.5" /> HELP CENTER
              </div>
              <h1 className="text-3xl lg:text-5xl font-display silver-text mb-3">How can we help?</h1>
              <p className="text-muted-foreground text-sm lg:text-base">Search the knowledge base or browse by topic.</p>
            </div>

            <div className="relative mb-6 max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-border bg-surface/50 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              <button onClick={() => setCat("")} className={pillCls(cat === "")}>All</button>
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={pillCls(cat === c)}>{c}</button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {grouped.flatMap(([category, items]) => items.map((a) => (
                <button key={a.id} onClick={() => open(a.slug)} className="text-left glass-card rounded-xl p-5 hover:border-accent-blue/40 transition-colors group">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-accent-blue uppercase mb-2">{category}</div>
                  <div className="font-semibold mb-1 group-hover:text-accent-blue transition-colors">{a.title}</div>
                  {a.summary && <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{a.summary}</div>}
                  <div className="flex items-center gap-1 text-[11px] text-accent-blue mt-3"><span>Read article</span><ChevronRight className="h-3 w-3" /></div>
                </button>
              )))}
              {articles.length === 0 && <div className="md:col-span-2 py-16 text-center text-sm text-muted-foreground">No articles match your search.</div>}
            </div>

            <div className="mt-10 glass-card rounded-xl p-6 text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-accent-blue" />
              <div className="font-semibold mb-1">Still need help?</div>
              <div className="text-sm text-muted-foreground mb-4">Open a support ticket and we'll get back to you within 4 business hours.</div>
              <Link to="/account/support" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90">Open a ticket</Link>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}

function ArticleView({ article, onBack }: { article: HelpArticle; onBack: () => void }) {
  return (
    <article>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back to Help Center</button>
      <div className="text-[10px] font-mono tracking-[0.25em] text-accent-blue uppercase mb-2">{article.category}</div>
      <h1 className="text-3xl lg:text-4xl font-display silver-text mb-3">{article.title}</h1>
      {article.summary && <p className="text-muted-foreground text-base mb-6">{article.summary}</p>}
      <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">{article.body}</div>
      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {article.tags.map((t) => <span key={t} className="text-[10px] font-mono tracking-wider px-2 py-1 rounded-md bg-secondary text-muted-foreground">#{t}</span>)}
        </div>
      )}
      <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-3">
        <Link to="/account/support" className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border text-sm font-medium hover:border-accent-blue/40">Open a ticket</Link>
        <Link to="/help" onClick={onBack} className="text-sm text-accent-blue hover:underline">More articles</Link>
      </div>
    </article>
  );
}

const pillCls = (active: boolean) =>
  `h-9 px-4 rounded-full text-xs font-medium capitalize transition-colors ${active ? "bg-accent-blue text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`;
