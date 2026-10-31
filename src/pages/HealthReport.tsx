import Seo from "@/components/Seo";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Shield, Loader2, ArrowRight, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fetchHealthReport } from "@/services/referenceLookup";
import HealthReportView, { type HealthReport as Report } from "@/components/wallet/HealthReportView";

export default function HealthReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [scannedAt, setScannedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return setState("missing");
      const data = await fetchHealthReport(id);
      if (cancelled) return;
      if (!data?.report) {
        setState("missing");
        return;
      }
      setReport(data.report as unknown as Report);
      setScannedAt(data.created_at as string);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden">
      <Seo
        title={
          report
            ? `Wallet health report — ${report.short} (${report.verdict})`
            : "Wallet health report"
        }
        description="A shared Rìan wallet health report: sanctions, scam and drainer exposure, mixers and token approvals."
        path={`/health/report/${id ?? ""}`}
      />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-neon-cyan/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-neon-violet/10 blur-[120px]" />
      </div>

      <header className="relative border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
            <span className="font-bold tracking-tight">Rìan</span>
          </Link>
          <Link to="/health">
            <Button size="sm" className="gap-1">
              Check your own wallet <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-12">
        {state === "loading" && (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading report…</p>
          </div>
        )}

        {state === "missing" && (
          <Card className="p-10 text-center bg-card/70 backdrop-blur-xl">
            <FileQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2">This report isn't available</h1>
            <p className="text-sm text-muted-foreground mb-6">
              The link may be wrong or the report may have been removed.
            </p>
            <Link to="/health">
              <Button className="gap-2">
                Run a fresh health check <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        )}

        {state === "ready" && report && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-2">
              Wallet health report
            </h1>
            {scannedAt && (
              <p className="text-xs text-muted-foreground text-center mb-8">
                Scanned {new Date(scannedAt).toLocaleString()} — a snapshot, not live data.
              </p>
            )}
            <HealthReportView report={report} />
            <Card className="mt-6 p-6 text-center bg-card/70 backdrop-blur-xl">
              <p className="text-sm text-muted-foreground mb-4">
                Want the same check on your own wallet?
              </p>
              <Link to="/health">
                <Button className="gap-2">
                  Scan my wallet <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
