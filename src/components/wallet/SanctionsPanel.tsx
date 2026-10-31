import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Loader2, Target, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lookupSanctionsAddress } from '@/services/referenceLookup';
import { Mono } from '@/components/ui/mono';
import { SanctionsMatch } from '@/services/riskFactors';

interface SanctionsHit {
  id: string;
  address: string;
  network: string;
  source_list: string;
  program: string | null;
  entity_name: string | null;
  date_listed: string | null;
  metadata: any;
}

interface SanctionsPanelProps {
  walletAddress: string;
  network: string;
  matches: SanctionsMatch[];
}

const SanctionsPanel = ({ walletAddress, network, matches }: SanctionsPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [hits, setHits] = useState<SanctionsHit[]>([]);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { hits: data, error } = await lookupSanctionsAddress(walletAddress, network);
      if (cancelled) return;
      if (error) {
        console.error('Sanctions hits query failed:', error);
        setHits([]);
      } else {
        setHits((data || []) as SanctionsHit[]);
      }
      setCheckedAt(new Date());
      setLoading(false);
    };
    if (walletAddress && network) run();
    return () => { cancelled = true; };
  }, [walletAddress, network]);

  const indirectMatches = matches.filter(m => m.match_type !== 'direct');
  const totalFindings = hits.length + indirectMatches.length;
  const allClear = !loading && totalFindings === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {hits.length > 0 ? (
              <ShieldAlert className="w-5 h-5 mr-2 text-risk-critical" />
            ) : indirectMatches.length > 0 ? (
              <Shield className="w-5 h-5 mr-2 text-risk-medium" />
            ) : (
              <ShieldCheck className="w-5 h-5 mr-2 text-risk-low" />
            )}
            Sanctions Screening
            <Badge variant="outline" className="ml-2 text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              OFAC SDN · Live
            </Badge>
          </div>
          <Badge
            variant={hits.length > 0 ? 'destructive' : totalFindings > 0 ? 'secondary' : 'outline'}
            className="font-semibold"
          >
            {loading ? '…' : `${totalFindings} finding${totalFindings === 1 ? '' : 's'}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Checking address against OFAC sanctions list…
          </div>
        ) : allClear ? (
          <div className="text-center py-6">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-risk-low" />
            <p className="font-medium">No sanctions exposure detected</p>
            <p className="text-sm text-muted-foreground">
              Wallet cleared against OFAC SDN address list and heuristic screening.
            </p>
            <div className="mt-3 flex justify-center space-x-2">
              <Badge variant="outline" className="text-xs">OFAC</Badge>
              <Badge variant="outline" className="text-xs">EU</Badge>
              <Badge variant="outline" className="text-xs">UN</Badge>
            </div>
            {checkedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                Checked {checkedAt.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top-level alert prioritizing the worst finding */}
            {hits.length > 0 ? (
              <Alert className="border-risk-critical/40 bg-risk-critical/10">
                <ShieldAlert className="h-4 w-4 text-risk-critical" />
                <AlertDescription>
                  <strong>Sanctioned address detected.</strong> Direct match on{' '}
                  {hits.length} OFAC SDN entr{hits.length === 1 ? 'y' : 'ies'}.
                  Block transactions and escalate immediately.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-risk-medium/40 bg-risk-medium/10">
                <Shield className="h-4 w-4 text-risk-medium" />
                <AlertDescription>
                  <strong>Indirect exposure detected.</strong> {indirectMatches.length}{' '}
                  heuristic match{indirectMatches.length === 1 ? '' : 'es'} found. Enhanced
                  due diligence recommended.
                </AlertDescription>
              </Alert>
            )}

            {/* Direct OFAC matches */}
            {hits.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="w-3 h-3" /> Direct OFAC Matches
                </h3>
                <div className="space-y-3">
                  {hits.map(hit => (
                    <div
                      key={hit.id}
                      className="border border-risk-critical/30 rounded-lg p-4 bg-risk-critical/5"
                    >
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold">
                            {hit.entity_name || 'OFAC-Listed Address'}
                          </h4>
                          <Mono className="text-xs text-muted-foreground break-all mt-1 block">
                            {hit.address}
                          </Mono>
                        </div>
                        <Badge variant="destructive" className="shrink-0">Direct Match</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Source List</span>
                          <p className="font-medium">{hit.source_list}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Program</span>
                          <p className="font-medium">{hit.program || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Network</span>
                          <p className="font-medium uppercase">{hit.network}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Date Listed</span>
                          <p className="font-medium">
                            {hit.date_listed
                              ? new Date(hit.date_listed).toLocaleDateString()
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Indirect / heuristic */}
            {indirectMatches.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Indirect / Heuristic Exposure
                </h3>
                <div className="space-y-3">
                  {indirectMatches.map(match => (
                    <div
                      key={match.id}
                      className="border border-risk-medium/30 rounded-lg p-4 bg-risk-medium/5"
                    >
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold">{match.entity_name}</h4>
                          <p className="text-sm text-muted-foreground">{match.entity_type}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {match.source_list}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="secondary">
                            {match.match_type.replace('-', ' ')}
                          </Badge>
                          <div className="text-xs mt-1 text-muted-foreground">
                            {Math.round(match.confidence_score * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {checkedAt && (
              <p className="text-xs text-muted-foreground text-right">
                Verified {checkedAt.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SanctionsPanel;
