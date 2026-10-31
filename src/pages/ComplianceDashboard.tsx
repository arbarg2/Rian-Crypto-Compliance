import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import AgentTracePanel from '@/components/agent/AgentTracePanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, ShieldAlert, FileText, Loader2, ExternalLink, FolderPlus, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { createCase, updateCaseStatus, addCaseNote } from '@/services/caseManagement';
import { logAuditAction } from '@/utils/auditLogger';
import RiskScoreDisclosure from '@/components/wallet/RiskScoreDisclosure';

type Rec = any;

const WORKFLOW: { value: string; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'sar_filed', label: 'SAR filed' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'closed', label: 'Closed' },
];
const statusLabel = (s?: string | null) => WORKFLOW.find((w) => w.value === s)?.label ?? 'Not a case';

const riskTone = (level?: string) => {
  const l = (level || '').toLowerCase();
  if (l === 'high' || l === 'critical') return 'border-[hsl(var(--risk-high))]/40 text-[hsl(var(--risk-high))]';
  if (l === 'medium') return 'border-[hsl(var(--risk-medium))]/40 text-[hsl(var(--risk-medium))]';
  return 'border-[hsl(var(--risk-low))]/40 text-[hsl(var(--risk-low))]';
};

export default function ComplianceDashboard() {
  const { user, loading } = useAuth() as any;
  const navigate = useNavigate();
  const [records, setRecords] = useState<Rec[]>([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<'flagged' | 'cases' | 'all'>('flagged');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from('investigation_records')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(300);
    if (error) toast.error('Could not load cases');
    setRecords(data || []);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (user) load();
  }, [user, loading, load, navigate]);

  const list = useMemo(() => {
    let r = records;
    if (filter === 'flagged') r = r.filter((x) => x.is_flagged);
    if (filter === 'cases') r = r.filter((x) => x.is_case);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((x) =>
        [x.wallet_address, x.record_id, x.case_id].some((v) => (v || '').toLowerCase().includes(s)),
      );
    }
    return r;
  }, [records, filter, q]);

  const selected = records.find((r) => r.id === selectedId) || list[0] || null;

  const stats = useMemo(() => ({
    flagged: records.filter((r) => r.is_flagged).length,
    open: records.filter((r) => r.is_case && ['open', 'in_review'].includes(r.case_status)).length,
    escalated: records.filter((r) => r.case_status === 'escalated').length,
    filed: records.filter((r) => r.case_status === 'sar_filed').length,
  }), [records]);

  const patch = (id: string, p: Partial<Rec>) =>
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Compliance dashboard" />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Compliance dashboard</h1>
          <p className="text-sm text-muted-foreground">Flag wallets, review the agent trace and OFAC evidence, and move cases through review.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Flagged', stats.flagged],
            ['Open / in review', stats.open],
            ['Escalated', stats.escalated],
            ['SAR filed', stats.filed],
          ].map(([l, v]) => (
            <Card key={l as string} className="p-4">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="text-2xl font-semibold text-foreground">{v as number}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <Card className="p-3 space-y-3 h-fit">
            <div className="flex gap-1">
              {(['flagged', 'cases', 'all'] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? 'default' : 'ghost'} onClick={() => setFilter(f)} className="capitalize flex-1">
                  {f}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Address, record or case ID" className="pl-8" />
            </div>
            {busy ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {filter === 'flagged' ? 'No flagged wallets yet. Switch to "all" and flag one.' : 'Nothing here yet.'}
              </p>
            ) : (
              <div className="space-y-1 max-h-[70vh] overflow-auto">
                {list.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-md border p-2.5 transition-colors ${selected?.id === r.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center gap-2">
                      {r.is_flagged && <Flag className="w-3.5 h-3.5 text-[hsl(var(--risk-high))] fill-current" />}
                      <span className="font-mono text-xs truncate flex-1">{r.wallet_address}</span>
                      <Badge variant="outline" className={`text-[10px] ${riskTone(r.risk_level)}`}>{r.risk_level}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{r.case_id || r.record_id}</span>
                      <span>·</span>
                      <span>{statusLabel(r.is_case ? r.case_status : null)}</span>
                      {r.case_priority === 'high' && <Badge variant="destructive" className="text-[10px] h-4">Priority</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {selected ? <CaseDetail key={selected.id} rec={selected} onChange={(p) => patch(selected.id, p)} reload={load} /> : (
            <Card className="p-10 text-center text-muted-foreground">Select a wallet to review.</Card>
          )}
        </div>
      </main>
    </div>
  );
}

function CaseDetail({ rec, onChange, reload }: { rec: Rec; onChange: (p: Partial<Rec>) => void; reload: () => void }) {
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [ofac, setOfac] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [sar, setSar] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const [a, s, d] = await Promise.all([
        lookupSanctionsAddress(rec.wallet_address),
        supabase.from('sanctions_screening').select('*').eq('lookup_record_id', rec.id).order('screening_date', { ascending: false }),
        supabase.from('sar_drafts').select('*').eq('record_id', rec.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setOfac(a.hits || []);
      setScreens(s.data || []);
      setSar(d.data || null);
    })();
  }, [rec.id, rec.wallet_address]);

  const toggleFlag = async () => {
    const next = !rec.is_flagged;
    const p = { is_flagged: next, flagged_at: next ? new Date().toISOString() : null, flag_reason: next ? rec.flag_reason || 'Flagged for review' : null };
    const { error } = await supabase.from('investigation_records').update(p).eq('id', rec.id);
    if (error) return toast.error('Could not update flag');
    onChange(p);
    logAuditAction(next ? 'flag_record' : 'unflag_record', rec.record_id, { wallet_address: rec.wallet_address }).catch(() => {});
    toast.success(next ? 'Flagged' : 'Flag removed');
  };

  const setPriority = async (v: string) => {
    const { error } = await supabase.from('investigation_records').update({ case_priority: v }).eq('id', rec.id);
    if (error) return toast.error('Could not update priority');
    onChange({ case_priority: v });
  };

  const openCase = async () => {
    setSaving(true);
    const r = await createCase(rec.id, undefined, note || undefined);
    setSaving(false);
    if (!r.success) return toast.error(r.error || 'Could not open case');
    toast.success(`Case ${r.caseId} opened`);
    setNote('');
    reload();
  };

  const moveTo = async (status: string) => {
    setSaving(true);
    const r = await updateCaseStatus(rec.case_id, status, note ? `Status → ${statusLabel(status)}: ${note}` : `Status → ${statusLabel(status)}`);
    setSaving(false);
    if (!r.success) return toast.error(r.error || 'Could not update status');
    setNote('');
    toast.success(`Moved to ${statusLabel(status)}`);
    reload();
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const r = await addCaseNote(rec.case_id, note.trim());
    setSaving(false);
    if (!r.success) return toast.error(r.error || 'Could not save note');
    setNote('');
    reload();
  };

  const narrative = sar?.narrative || rec.ai_summary;

  return (
    <div className="space-y-4 min-w-0">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="min-w-0">
            <div className="font-mono text-sm break-all text-foreground">{rec.wallet_address}</div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
              <span className="uppercase">{rec.network}</span>
              <span>Rìan heuristic {Number(rec.risk_score).toFixed(0)}/100</span>
              <RiskScoreDisclosure />
              <span>{rec.case_id || rec.record_id}</span>
              <span>Status: {statusLabel(rec.is_case ? rec.case_status : null)}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={rec.is_flagged ? 'destructive' : 'outline'} onClick={toggleFlag}>
              <Flag className="w-4 h-4 mr-1" />{rec.is_flagged ? 'Flagged' : 'Flag'}
            </Button>
            <Select value={rec.case_priority || 'normal'} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low priority</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High priority</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/record/${rec.id}`)}>
              <ExternalLink className="w-4 h-4 mr-1" />Full record
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="trace">
        <TabsList>
          <TabsTrigger value="trace">Agent trace</TabsTrigger>
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
          <TabsTrigger value="ofac">OFAC citations ({ofac.length + screens.length})</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="trace">
          <AgentTracePanel address={rec.wallet_address} network={rec.network} recordId={rec.id} workspaceId={rec.workspace_id} />
        </TabsContent>

        <TabsContent value="narrative">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4" />
              {sar ? `SAR draft (${sar.status})` : 'Investigation summary'}
            </div>
            {narrative ? (
              <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{narrative}</ReactMarkdown></div>
            ) : (
              <p className="text-sm text-muted-foreground">No narrative yet. The agent trace tab shows the forensic narrative once the trace completes; a SAR draft can be generated from the full record.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="ofac">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldAlert className="w-4 h-4" /> OFAC SDN matches
            </div>
            {ofac.length === 0 && screens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No match against the OFAC SDN address list for this wallet.</p>
            ) : (
              <ol className="space-y-2">
                {ofac.map((o, i) => (
                  <li key={o.id} className="rounded-md border border-[hsl(var(--risk-high))]/40 p-3 text-sm">
                    <div className="font-medium text-foreground">[O{i + 1}] {o.entity_name || 'Listed address'}</div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-3">
                      <span>List: {o.source_list}</span>
                      {o.program && <span>Program: {o.program}</span>}
                      {o.date_listed && <span>Listed: {o.date_listed}</span>}
                      <span className="font-mono">{o.address}</span>
                    </div>
                  </li>
                ))}
                {screens.map((s, i) => (
                  <li key={s.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="font-medium text-foreground">[S{i + 1}] {s.entity_name}</div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-3">
                      <span>{s.match_type} match</span>
                      <span>Confidence {Number(s.confidence_score).toFixed(0)}%</span>
                      {s.source_list && <span>{s.source_list}</span>}
                      <span>{new Date(s.screening_date).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {WORKFLOW.map((w, i) => {
                const idx = WORKFLOW.findIndex((x) => x.value === rec.case_status);
                const active = rec.is_case && w.value === rec.case_status;
                return (
                  <Badge key={w.value} variant={active ? 'default' : 'outline'} className={rec.is_case && i < idx ? 'opacity-60' : ''}>
                    {i + 1}. {w.label}
                  </Badge>
                );
              })}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or reason for the next step…" rows={3} />
            {!rec.is_case ? (
              <Button onClick={openCase} disabled={saving}><FolderPlus className="w-4 h-4 mr-1" />Open case</Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {WORKFLOW.filter((w) => w.value !== rec.case_status).map((w) => (
                  <Button key={w.value} size="sm" variant={w.value === 'escalated' || w.value === 'sar_filed' ? 'destructive' : 'outline'} disabled={saving} onClick={() => moveTo(w.value)}>
                    Move to {w.label}
                  </Button>
                ))}
                <Button size="sm" variant="secondary" disabled={saving || !note.trim()} onClick={saveNote}>Save note</Button>
              </div>
            )}
            {rec.analyst_notes && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">History</div>
                <pre className="whitespace-pre-wrap text-xs text-foreground bg-muted/30 rounded-md p-3 max-h-64 overflow-auto font-sans">{rec.analyst_notes}</pre>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
