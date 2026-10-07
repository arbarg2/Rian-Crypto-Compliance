import Seo from '@/components/Seo';
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Shield, Search, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Sparkles, Lock, ArrowLeft, Copy, Check, Zap, Twitter, History, X, KeyRound, Briefcase, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import QuickWatchButton from "@/components/wallet/QuickWatchButton";
import RiskScoreDisclosure from "@/components/wallet/RiskScoreDisclosure";


type Verdict = "safe" | "caution" | "danger";

interface EvidenceBasis {
  sanctions_count?: number;
  malicious_count?: number;
}

interface CheckResult {
  address: string;
  network: string;
  verdict: Verdict;
  risk_score: number;
  reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[];
  data: { balance?: number; tx_count?: number; first_seen?: number | null; sanctioned?: boolean; malicious?: boolean; short?: string };
  evidence_basis?: EvidenceBasis;
  view_count?: number;
  cached?: boolean;
}

const verdictMeta: Record<Verdict, { label: string; sub: string; tone: string; ring: string; glow: string; gradient: string; icon: any }> = {
  safe: {
    label: "LIKELY SAFE",
    sub: "No major red flags found.",
    tone: "text-risk-low",
    ring: "ring-risk-low/40 border-risk-low/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-low)/0.7)]",
    gradient: "from-risk-low/20 via-neon-lime/10 to-transparent",
    icon: CheckCircle2,
  },
  caution: {
    label: "PROCEED WITH CAUTION",
    sub: "Some signals worth reviewing before you send.",
    tone: "text-risk-medium",
    ring: "ring-risk-medium/40 border-risk-medium/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-medium)/0.7)]",
    gradient: "from-risk-medium/20 via-neon-magenta/10 to-transparent",
    icon: AlertTriangle,
  },
  danger: {
    label: "DO NOT SEND",
    sub: "High-risk wallet. Funds could be lost or frozen.",
    tone: "text-risk-critical",
    ring: "ring-risk-critical/50 border-risk-critical/50",
    glow: "shadow-[0_0_100px_-10px_hsl(var(--risk-critical)/0.8)]",
    gradient: "from-risk-critical/25 via-neon-magenta/10 to-transparent",
    icon: ShieldAlert,
  },
};

function SafeHeader() {
  return (
    <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/safe" className="flex items-center gap-2 group">
          <div className="relative">
            <Shield className="w-7 h-7 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-neon-cyan/40 blur-xl -z-10 animate-glow-pulse" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">Rìan <span className="text-aurora">Safe</span></div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Pre-send safety check</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs">Pro Console</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="text-xs">Sign in</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function VerdictCard({ result }: { result: CheckResult }) {
  const meta = verdictMeta[result.verdict];
  const Icon = meta.icon;
  return (
    <Card className={`relative overflow-hidden p-8 md:p-12 border-2 ${meta.ring} ${meta.glow} bg-card/80 backdrop-blur-xl animate-scale-in`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} pointer-events-none`} />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-current opacity-10 blur-3xl animate-glow-pulse" />
      <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Rìan · Verdict Card</div>

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className={`flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center bg-background/60 border-2 ${meta.ring} ${meta.glow}`}>
          <Icon className={`w-14 h-14 ${meta.tone}`} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold tracking-[0.25em] ${meta.tone}`}>VERDICT</span>
            {result.cached && <Badge variant="outline" className="text-[10px] h-5">cached</Badge>}
          </div>
          <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${meta.tone} leading-[1.05]`}>
            {meta.label}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{meta.sub}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm">
            <span className="font-mono text-xs bg-background/60 border border-border/50 px-2.5 py-1 rounded">
              {result.data.short ?? result.address}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/40 px-2 py-1 rounded">
              {result.network}
            </span>
            <span className="text-xs text-muted-foreground">
              Rìan heuristic <span className={`font-bold text-lg ${meta.tone} tabular-nums`}>{result.risk_score}</span>
              <span className="text-muted-foreground/60">/100</span>
            </span>
          </div>
          <div className="mt-2"><RiskScoreDisclosure /></div>
          {result.evidence_basis && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground/80">
              <Shield className="w-3.5 h-3.5 text-neon-cyan/70" />
              <span>
                Screened against OFAC SDN
                {result.evidence_basis.malicious_count ? (
                  <> + {result.evidence_basis.malicious_count.toLocaleString()} known scam / drainer addresses</>
                ) : null}
                {" · "}on-chain behaviour
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReasonsList({ reasons }: { reasons: CheckResult["reasons"] }) {
  if (!reasons.length) return null;
  const sevTone = (s: string) =>
    s === "high" ? "text-risk-critical bg-risk-critical/10 border-risk-critical/30"
    : s === "medium" ? "text-risk-medium bg-risk-medium/10 border-risk-medium/30"
    : "text-risk-low bg-risk-low/10 border-risk-low/30";
  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/60 animate-fade-in">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-neon-cyan" /> Why
      </h3>
      <ul className="space-y-3">
        {reasons.map((r, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${sevTone(r.severity)} flex-shrink-0`}>
              {r.severity}
            </span>
            <p className="text-sm leading-relaxed pt-0.5">{r.text}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StatsGrid({ result }: { result: CheckResult }) {
  const stats = [
    { label: "Balance", value: result.data.balance != null ? `${result.data.balance.toFixed(4)} ${result.network.slice(0, 3).toUpperCase()}` : "—" },
    { label: "Transactions", value: result.data.tx_count?.toLocaleString() ?? "—" },
    { label: "First seen", value: result.data.first_seen ? new Date(result.data.first_seen).toLocaleDateString() : "—" },
    { label: "Sanctions", value: result.data.sanctioned ? "MATCH" : "Clear", danger: result.data.sanctioned },
    { label: "Scam / drainer", value: result.data.malicious ? "MATCH" : "Clear", danger: result.data.malicious },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
      {stats.map((s) => (
        <Card key={s.label} className="p-4 bg-card/40 border-border/50 hover:border-neon-cyan/40 transition-colors">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</div>
          <div className={`text-base font-semibold tabular-nums ${s.danger ? "text-risk-critical" : ""}`}>{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

function ShareBar({ address, verdict }: { address: string; verdict: Verdict }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/safe/check/${address}`;
  const tweetText = encodeURIComponent(
    verdict === "danger"
      ? `⚠️ DO NOT SEND to ${address.slice(0, 8)}… — checked with @tryrian Safe`
      : verdict === "caution"
      ? `⚠️ Caution on ${address.slice(0, 8)}… — checked with @tryrian Safe`
      : `✅ ${address.slice(0, 8)}… looks safe — checked with @tryrian Safe`
  );
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <>
      {/* Desktop / inline */}
      <Card className="hidden sm:flex p-4 bg-card/40 border-border/50 flex-row gap-3 items-center animate-fade-in">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Share this verdict</div>
          <div className="font-mono text-xs truncate">{url}</div>
        </div>
        <Button onClick={copy} variant="outline" size="sm" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Twitter className="w-4 h-4" /> Tweet
          </Button>
        </a>
      </Card>

      {/* Mobile sticky */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/90 backdrop-blur-xl border-t border-border/60 flex gap-2">
        <Button onClick={copy} variant="outline" size="lg" className="flex-1 gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button size="lg" className="w-full gap-2">
            <Twitter className="w-4 h-4" /> Tweet
          </Button>
        </a>
      </div>
    </>
  );
}

// ---- lightweight local return-loop: recently checked addresses ----
const RECENT_KEY = "rian:safe:recent";

const MAX_RECENT = 6;

interface RecentCheck {
  address: string;
  network: string;
  verdict: Verdict;
  risk_score: number;
  at: number;
}

function readRecent(): RecentCheck[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function writeRecent(list: RecentCheck[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}
export function recordCheck(r: CheckResult) {
  const list = readRecent().filter((c) => c.address.toLowerCase() !== r.address.toLowerCase());
  list.unshift({ address: r.address, network: r.network, verdict: r.verdict, risk_score: r.risk_score, at: Date.now() });
  writeRecent(list);
}

export function useRecentChecks() {
  const [items, setItems] = useState<RecentCheck[]>([]);
  useEffect(() => { setItems(readRecent()); }, []);
  const remove = (address: string) => {
    const next = readRecent().filter((c) => c.address !== address);
    writeRecent(next);
    setItems(next);
  };
  return { items, remove, refresh: () => setItems(readRecent()) };
}




export function RecentChecksStrip() {
  const { items, remove } = useRecentChecks();
  if (!items.length) return null;
  const tone: Record<Verdict, string> = {
    safe: "text-risk-low border-risk-low/40",
    caution: "text-risk-medium border-risk-medium/40",
    danger: "text-risk-critical border-risk-critical/50",
  };
  return (
    <div className="mt-10 animate-fade-in">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <History className="w-4 h-4" />
        <span className="text-xs uppercase tracking-widest">Recently checked</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <div key={c.address} className="group relative">
            <Link to={`/safe/check/${c.address}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-card/50 backdrop-blur-md hover:border-neon-cyan/50 transition-colors ${tone[c.verdict]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.verdict === "safe" ? "bg-risk-low" : c.verdict === "caution" ? "bg-risk-medium" : "bg-risk-critical"}`} />
              <span className="font-mono text-xs">{c.address.slice(0, 6)}…{c.address.slice(-4)}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{c.network}</span>
            </Link>
            <button
              onClick={() => remove(c.address)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-risk-critical"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SafeCheckRunner({ address, onResult }: { address: string; onResult?: (r: CheckResult) => void }) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("safe-check", {
          method: "GET" as any,
        } as any).catch(() => ({ data: null, error: { message: "fallback" } } as any));

        let payload: any = data;
        if (!data || fnErr) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safe-check?address=${encodeURIComponent(address)}`;
          const r = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          payload = await r.json();
          if (!r.ok) throw new Error(payload?.error || "Check failed");
        }
        if (cancelled) return;
        setResult(payload);
        recordCheck(payload);
        onResult?.(payload);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Check failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (loading) {
    return (
      <Card className="p-12 border-border/50 bg-card/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
            <div className="absolute inset-0 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-xl animate-glow-pulse" />
            <Shield className="absolute inset-0 m-auto w-8 h-8 text-neon-cyan" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-base">Checking the chain…</div>
            <div className="text-xs text-muted-foreground mt-1">Sanctions · history · on-chain patterns</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !result) {
    return (
      <Card className="p-6 border-risk-critical/40 bg-risk-critical/5">
        <div className="text-risk-critical font-semibold">Couldn't run the check</div>
        <p className="text-sm text-muted-foreground mt-1">{error ?? "Try again."}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-4">
      <div className="flex items-center justify-end -mb-1">
        <QuickWatchButton
          address={result.address}
          network={result.network}
          riskScore={result.risk_score}
        />
      </div>
      <VerdictCard result={result} />
      <EvidenceBlocks result={result} />
      <ReasonsList reasons={result.reasons} />
      <StatsGrid result={result} />
      <EscalateCard address={result.address} />
      <ShareBar address={result.address} verdict={result.verdict} />
    </div>
  );
}

function EvidenceBlocks({ result }: { result: CheckResult }) {
  const behaviouralFlags = result.reasons.filter(
    (r) => !["sanctions", "scam", "malicious"].includes(r.type) && r.severity !== "low",
  );
  const blocks = [
    {
      icon: ShieldAlert,
      title: "OFAC sanctions",
      hit: !!result.data.sanctioned,
      hitText: "Direct match on the OFAC SDN list.",
      clearText: `No match against the OFAC SDN list${
        result.evidence_basis?.sanctions_count
          ? ` (${result.evidence_basis.sanctions_count.toLocaleString()} addresses)`
          : ""
      }.`,
    },
    {
      icon: KeyRound,
      title: "Scam & drainer registry",
      hit: !!result.data.malicious,
      hitText: "This address is tagged as a known scam or wallet-drainer.",
      clearText: `Not listed among ${
        result.evidence_basis?.malicious_count?.toLocaleString() ?? "known"
      } tagged scam / drainer addresses.`,
    },
    {
      icon: PenLine,
      title: "On-chain behaviour",
      hit: behaviouralFlags.length > 0,
      hitText: behaviouralFlags.map((r) => r.text).join(" "),
      clearText: "Nothing unusual in the address's activity pattern.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
      {blocks.map((b) => (
        <Card
          key={b.title}
          className={`p-4 backdrop-blur-xl ${
            b.hit
              ? "border-risk-critical/40 bg-risk-critical/5"
              : "border-risk-low/25 bg-card/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <b.icon className={`w-4 h-4 ${b.hit ? "text-risk-critical" : "text-risk-low"}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">{b.title}</span>
          </div>
          <div className={`text-sm font-semibold ${b.hit ? "text-risk-critical" : "text-risk-low"}`}>
            {b.hit ? "Match" : "Clear"}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {b.hit ? b.hitText : b.clearText}
          </p>
        </Card>
      ))}
    </div>
  );
}

function EscalateCard({ address }: { address: string }) {
  return (
    <Card className="p-4 bg-card/40 border-border/50 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
      <div className="flex-1">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-neon-violet" /> Need the full picture?
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Open this address in the analyst console for counterparty tracing, evidence logging and a
          case file.
        </p>
      </div>
      <Link to={`/dashboard?address=${encodeURIComponent(address)}`} className="shrink-0">
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
          Escalate to analyst console <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </Card>
  );
}


export default function Safe() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("address") ?? "");
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    navigate(`/safe/check/${v}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Seo title="Safe Check — Is This Wallet Safe to Send To?" description="Paste any BTC, ETH or Solana address and get a plain-English safety verdict before you transact. Free instant scam and sanctions check." path="/safe" />
      {/* Aurora background */}
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-neon-cyan/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-neon-violet/10 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <div className="relative">
        <SafeHeader />
        <main className="max-w-3xl mx-auto px-4 pt-12 md:pt-20 pb-16">
          <div className="text-center mb-10 animate-fade-in">
            <Badge variant="outline" className="mb-4 border-neon-cyan/40 text-neon-cyan bg-neon-cyan/5">
              <Sparkles className="w-3 h-3 mr-1" /> Free • No login needed
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              Is it safe to <span className="text-aurora">sign this?</span>
            </h1>
            <p className="text-muted-foreground mt-5 text-lg max-w-xl mx-auto">
              Paste the wallet or contract address you're about to send to, approve or interact with.
              Get an instant <span className="text-risk-low font-semibold">SAFE</span> /
              <span className="text-risk-medium font-semibold"> CAUTION</span> /
              <span className="text-risk-critical font-semibold"> DANGER</span> verdict, in plain English.
            </p>
          </div>


          <form onSubmit={submit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta rounded-2xl opacity-40 blur-xl group-focus-within:opacity-70 transition-opacity -z-10 animate-glow-pulse" />
            <Card className="p-2 flex gap-2 border-2 border-primary/30 bg-card/90 backdrop-blur-xl shadow-2xl group-focus-within:border-neon-cyan/60 transition-colors">
              <Search className="w-5 h-5 text-muted-foreground self-center ml-3" />
              <Input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="0x… / bc1… / Solana address"
                className="border-0 bg-transparent text-base focus-visible:ring-0 font-mono"
              />
              <Button type="submit" size="lg" className="gap-2 font-semibold bg-aurora text-background hover:opacity-90">
                Check <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { icon: Zap, t: "Instant verdict", d: "Plain-English answer in under 2 seconds.", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
              { icon: ShieldAlert, t: "OFAC sanctions", d: "Real OFAC SDN list, synced daily.", color: "text-neon-violet", bg: "bg-neon-violet/10" },
              { icon: Lock, t: "Read-only", d: "We never touch your wallet or funds.", color: "text-neon-lime", bg: "bg-neon-lime/10" },
            ].map((f, i) => (
              <Card key={i} className="p-5 bg-card/40 border-border/50 border-glow">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.bg} mb-3`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.d}</div>
              </Card>
            ))}
          </div>

          <RecentChecksStrip />

          <div className="text-center mt-12 text-xs text-muted-foreground">
            Need full investigation tools? <Link to="/dashboard" className="text-neon-cyan hover:underline">Open the Pro Console →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export function SafeCheckPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  if (!address) {
    return <Safe />;
  }
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative">
        <SafeHeader />
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/safe")} className="gap-1 -ml-2">
            <ArrowLeft className="w-4 h-4" /> New check
          </Button>
          <SafeCheckRunner address={address} />
        </main>
      </div>
    </div>
  );
}
