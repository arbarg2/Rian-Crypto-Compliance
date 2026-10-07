import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mono } from "@/components/ui/mono";
import {
  CheckCircle2, AlertTriangle, ShieldAlert, Users, Activity, Clock,
} from "lucide-react";
import ApprovalExposure, { type ApprovalSummary } from "./ApprovalExposure";
import RiskScoreDisclosure from './RiskScoreDisclosure';

export type Verdict = "safe" | "caution" | "danger";

export interface HealthReport {
  address: string;
  short: string;
  network: string;
  verdict: Verdict;
  risk_score: number;
  total_counterparties: number;
  total_transactions: number;
  history_truncated?: boolean;
  first_seen: number | null;
  sanctioned_contacts: {
    address: string; entity_name: string | null; source_list: string | null;
    program: string | null; sent_txs: number; received_txs: number;
  }[];
  malicious_contacts?: {
    address: string; label: string | null; category: string | null;
    source: string | null; sent_txs: number; received_txs: number;
  }[];
  mixer_contacts: { address: string; label: string; sent: number; received: number }[];
  approvals?: ApprovalSummary;
  reasons: { type: string; severity: "low" | "medium" | "high"; text: string }[];
  scanned_at?: string;
  report_id?: string | null;
  record_id?: string | null;
}

export const verdictMeta: Record<Verdict, {
  label: string; sub: string; tone: string; ring: string; glow: string; grad: string; icon: any;
}> = {
  safe: {
    label: "CLEAN BILL OF HEALTH",
    sub: "No sanctioned, scam or mixer counterparties found in your history.",
    tone: "text-risk-low",
    ring: "border-risk-low/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-low)/0.6)]",
    grad: "from-risk-low/20 via-neon-lime/10 to-transparent",
    icon: CheckCircle2,
  },
  caution: {
    label: "SOME EXPOSURE FOUND",
    sub: "Worth reviewing before you use this wallet for anything sensitive.",
    tone: "text-risk-medium",
    ring: "border-risk-medium/40",
    glow: "shadow-[0_0_80px_-10px_hsl(var(--risk-medium)/0.6)]",
    grad: "from-risk-medium/20 via-neon-magenta/10 to-transparent",
    icon: AlertTriangle,
  },
  danger: {
    label: "HIGH-RISK EXPOSURE",
    sub: "This wallet has touched sanctioned, scam or mixer addresses.",
    tone: "text-risk-critical",
    ring: "border-risk-critical/50",
    glow: "shadow-[0_0_100px_-10px_hsl(var(--risk-critical)/0.7)]",
    grad: "from-risk-critical/25 via-neon-magenta/10 to-transparent",
    icon: ShieldAlert,
  },
};

export default function HealthReportView({ report }: { report: HealthReport }) {
  const M = verdictMeta[report.verdict];

  return (
    <div className="space-y-6">
      <Card className={`relative overflow-hidden p-8 border ${M.ring} ${M.glow} bg-card/80 backdrop-blur-xl`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${M.grad} pointer-events-none`} />
        <div className="relative flex flex-col items-center text-center gap-3">
          <M.icon className={`w-14 h-14 ${M.tone}`} />
          <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${M.tone}`}>{M.label}</h2>
          <p className="text-muted-foreground max-w-md">{M.sub}</p>
          <Mono className="text-xs text-muted-foreground">{report.address}</Mono>
          <div className="mt-2 text-5xl font-bold tabular-nums">
            {report.risk_score}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <RiskScoreDisclosure />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Counterparties", value: report.total_counterparties },
          { icon: Activity, label: "Transactions", value: report.total_transactions },
          {
            icon: Clock,
            label: "Wallet age",
            value: report.first_seen
              ? `${Math.round((Date.now() - report.first_seen) / 86400000)}d`
              : "—",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4 bg-card/70 backdrop-blur-xl text-center">
            <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold tabular-nums">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {report.history_truncated && (
        <p className="text-[11px] text-muted-foreground text-center -mt-3">
          Based on the {report.total_transactions} most recent transactions — older history was not
          included in this scan.
        </p>
      )}

      {report.sanctioned_contacts.length > 0 && (
        <Card className="p-5 border-risk-critical/40 bg-risk-critical/5">
          <h3 className="font-semibold text-risk-critical mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Sanctioned counterparties
          </h3>
          <div className="space-y-2">
            {report.sanctioned_contacts.map((s) => (
              <div key={s.address} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <Mono className="text-xs">{s.address}</Mono>
                  <div className="text-xs text-muted-foreground">
                    {s.entity_name ?? "Listed entity"} · {s.source_list ?? "OFAC"}
                  </div>
                </div>
                <Badge variant="destructive" className="shrink-0">
                  {s.sent_txs} out / {s.received_txs} in
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(report.malicious_contacts?.length ?? 0) > 0 && (
        <Card className="p-5 border-risk-critical/40 bg-risk-critical/5">
          <h3 className="font-semibold text-risk-critical mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Scam / drainer counterparties
          </h3>
          <div className="space-y-2">
            {report.malicious_contacts!.map((m) => (
              <div key={m.address} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <Mono className="text-xs">{m.address}</Mono>
                  <div className="text-xs text-muted-foreground">
                    {m.label ?? m.category ?? "Flagged address"} · {m.source ?? "community registry"}
                  </div>
                </div>
                <Badge variant="destructive" className="shrink-0">
                  {m.sent_txs} out / {m.received_txs} in
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {report.mixer_contacts.length > 0 && (
        <Card className="p-5 border-risk-high/40 bg-risk-high/5">
          <h3 className="font-semibold text-risk-high mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Mixer exposure
          </h3>
          <div className="space-y-2">
            {report.mixer_contacts.map((m) => (
              <div key={m.address} className="flex items-center justify-between gap-3 text-sm">
                <Mono className="text-xs">{m.address}</Mono>
                <Badge variant="outline">{m.label}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ApprovalExposure approvals={report.approvals} />

      <Card className="p-5 bg-card/70 backdrop-blur-xl">
        <h3 className="font-semibold mb-3">What we found</h3>
        <ul className="space-y-2">
          {report.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  r.severity === "high"
                    ? "bg-risk-critical"
                    : r.severity === "medium"
                      ? "bg-risk-medium"
                      : "bg-risk-low"
                }`}
              />
              <span className="text-muted-foreground">{r.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
