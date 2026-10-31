import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, Activity, Network, Clock, Hash, Copy, Check } from 'lucide-react';
import { Mono, truncateMiddle } from '@/components/ui/mono';
import { riskTier, riskLabel, riskClasses, riskTierFromLevel, type RiskTier } from '@/lib/risk';
import { supabase } from '@/integrations/supabase/client';
import { lookupSanctionsAddress } from '@/services/referenceLookup';
import { WalletRiskResponse } from '@/services/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RiskScoreDisclosure from './RiskScoreDisclosure';

interface VerdictBannerProps {
  wallet: WalletRiskResponse;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface RiskGaugeProps {
  score: number;
  tier: RiskTier;
}

const RiskGauge = ({ score, tier }: RiskGaugeProps) => {
  const animated = useCountUp(score, 900);
  const classes = riskClasses(tier);
  const radius = 70;
  const circumference = Math.PI * radius; // semicircle
  const pct = Math.max(0, Math.min(100, animated)) / 100;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="180" height="110" viewBox="0 0 180 110" className="overflow-visible">
        <defs>
          <linearGradient id={`gauge-grad-${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={classes.stroke} stopOpacity="0.6" />
            <stop offset="100%" stopColor={classes.stroke} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Value */}
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke={`url(#gauge-grad-${tier})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${classes.stroke})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <div className={cn('text-4xl font-bold tabular-nums leading-none', classes.text)}>
          {Math.round(animated)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          Rìan heuristic
        </div>
      </div>
    </div>
  );
};

interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}
const Kpi = ({ icon, label, value }: KpiProps) => (
  <div className="flex flex-col items-start gap-1 px-4 py-3 rounded-lg bg-muted/30 border border-border/50 min-w-[120px]">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
  </div>
);

const VerdictBanner = ({ wallet }: VerdictBannerProps) => {
  const score = wallet.risk_score ?? 0;
  // Trust the explicit risk_level when available; otherwise derive from score
  const tier: RiskTier = wallet.risk_level
    ? riskTierFromLevel(wallet.risk_level)
    : riskTier(score);
  const classes = riskClasses(tier);

  const [ofacHits, setOfacHits] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { hits, error } = await lookupSanctionsAddress(wallet.address, wallet.network);
      if (cancelled) return;
      setOfacHits(error ? null : hits.length);
    };
    if (wallet.address && wallet.network) run();
    return () => { cancelled = true; };
  }, [wallet.address, wallet.network]);

  const txKnown = typeof wallet.transaction_count === 'number';
  const animatedTx = useCountUp(wallet.transaction_count ?? 0);
  const animatedTime = useCountUp(wallet.processing_time_ms ?? 0, 600);


  const sanctioned = (ofacHits ?? 0) > 0;
  const effectiveTier: RiskTier = sanctioned ? 'critical' : tier;
  const effectiveClasses = riskClasses(effectiveTier);

  const verdictHeadline = sanctioned
    ? 'OFAC SANCTIONED'
    : riskLabel(effectiveTier);

  const rationaleParts: string[] = [];
  if (sanctioned) {
    rationaleParts.push(`${ofacHits} direct OFAC SDN match${ofacHits === 1 ? '' : 'es'}`);
  } else {
    rationaleParts.push(`Rìan heuristic score ${Math.round(score)}/100`);
  }
  if (wallet.transaction_count) {
    rationaleParts.push(`${wallet.transaction_count.toLocaleString()} transactions analyzed`);
  }
  rationaleParts.push(`on ${wallet.network.toUpperCase()}`);
  const rationale = rationaleParts.join(' · ');

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-2 animate-fade-in',
        effectiveClasses.border
      )}
      style={{
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 60%, ${effectiveClasses.fill}10 100%)`,
      }}
    >
      {sanctioned && (
        <div className="bg-risk-critical text-risk-critical-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider animate-pulse-slow">
          <ShieldAlert className="w-4 h-4" />
          OFAC Sanctioned Address — Block Transactions Immediately
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
        {/* Gauge */}
        <RiskGauge score={score} tier={effectiveTier} />

        {/* Verdict */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                effectiveClasses.bgSoft,
                effectiveClasses.text,
                'border',
                effectiveClasses.border
              )}
            >
              {sanctioned ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Verdict
            </span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
              {wallet.network}
            </Badge>
          </div>

          <h2 className={cn('text-3xl md:text-4xl font-bold tracking-tight leading-tight', effectiveClasses.text)}>
            {verdictHeadline}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{rationale}</p>
          <div className="mt-2"><RiskScoreDisclosure /></div>

          <button
            onClick={copyAddress}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors group"
            title={wallet.address}
          >
            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
            <Mono className="text-xs text-foreground">{truncateMiddle(wallet.address, 10, 8)}</Mono>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            )}
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi
            icon={<Activity className="w-3 h-3" />}
            label="Transactions"
            value={
              txKnown ? (
                Math.round(animatedTx).toLocaleString()
              ) : (
                <span className="text-muted-foreground text-sm">Not available</span>
              )
            }
          />
          <Kpi
            icon={<Network className="w-3 h-3" />}
            label="Network"
            value={wallet.network.toUpperCase()}
          />
          <Kpi
            icon={<ShieldAlert className="w-3 h-3" />}
            label="OFAC Hits"
            value={
              ofacHits === null ? (
                <span className="text-muted-foreground">…</span>
              ) : ofacHits > 0 ? (
                <span className="text-risk-critical">{ofacHits}</span>
              ) : (
                <span className="text-risk-low">0</span>
              )
            }
          />
          <Kpi
            icon={<Clock className="w-3 h-3" />}
            label="Analysis"
            value={
              wallet.processing_time_ms
                ? `${Math.round(animatedTime)}ms`
                : <span className="text-muted-foreground text-sm">—</span>
            }
          />
        </div>

      </div>
    </Card>
  );
};

export default VerdictBanner;
