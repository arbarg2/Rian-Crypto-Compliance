import Seo from '@/components/Seo';
import React, { useEffect, useState } from 'react';
import { Shield, Eye, CheckCircle, ArrowRight, Twitter, Linkedin, Lock, Zap, Globe, Users } from 'lucide-react';
import { useDemoWalletAnalysis } from '@/hooks/useDemoWalletAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import EarlyAccessModal from '@/components/auth/EarlyAccessModal';
import { QuickStartDemo } from '@/components/QuickStartDemo';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TickerItem {
  addr: string;
  verdict: string;
  label: string;
}

const shorten = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const verdictLabel: Record<string, string> = {
  safe: 'No matches found',
  caution: 'Signals worth reviewing',
  danger: 'Flagged address',
};

const Landing = () => {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const navigate = useNavigate();
  const { analyzeDemoWallet } = useDemoWalletAnalysis();
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  // Real recent public checks — no invented verdicts on the ticker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchRecentPublicChecks();
      if (cancelled || !data?.length) return;
      setTickerItems(
        data.map((c: any) => ({
          addr: shorten(String(c.address)),
          verdict: String(c.verdict ?? 'safe'),
          label: `${verdictLabel[String(c.verdict)] ?? 'Checked'} · ${c.risk_score ?? 0}/100`,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTryDemo = async (address: string) => {
    try {
      console.log('🎯 Demo button clicked for address:', address);
      // Perform demo analysis without authentication requirement
      const result = await analyzeDemoWallet(address);
      if (result && result.recordId) {
        console.log('🚀 Navigating to demo results with recordId:', result.recordId);
        // Navigate directly to results with demo flag
        navigate(`/record/${result.recordId}?demo=true`);
      }
    } catch (error) {
      console.error('Demo analysis failed:', error);
      // Don't redirect to auth for demo failures
    }
  };

  const verdictStyles: Record<string, string> = {
    safe: 'bg-risk-low/15 text-risk-low border-risk-low/40',
    caution: 'bg-risk-medium/15 text-risk-medium border-risk-medium/40',
    danger: 'bg-risk-critical/15 text-risk-critical border-risk-critical/40',
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title="Rìan — Blockchain Intelligence & Compliance" description="Screen any crypto wallet in seconds: risk scoring, OFAC sanctions screening and transaction tracing for compliance teams and everyday users." path="/" />
      {/* Header */}
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="relative">
                <Shield className="w-9 h-9 text-accent" />
                <div className="absolute inset-0 blur-xl bg-accent/40 -z-10 animate-pulse-slow" />
              </div>
              <div className="text-3xl font-bold tracking-tight">Rìan</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/safe')}
                className="hidden sm:inline-flex hover:text-accent"
              >
                Safe Check
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-foreground text-background hover:bg-foreground/90 hover-scale"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section — aurora mesh */}
      <section className="relative px-4 pt-20 pb-24 md:pt-28 md:pb-32 bg-mesh overflow-hidden">
        {/* floating glow orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-neon-cyan/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute top-40 right-1/4 w-[28rem] h-[28rem] rounded-full bg-neon-violet/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <Badge className="bg-card/60 backdrop-blur border border-neon-cyan/30 text-neon-cyan mb-6 text-xs px-4 py-1.5 tracking-wider uppercase animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan mr-2 animate-pulse" />
            Live · Multi-chain sanctions & risk intelligence
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in leading-[1.05]">
            Institutional-grade
            <span className="block text-aurora">blockchain compliance intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up">
            Rìan screens addresses across Bitcoin, Ethereum and Solana against the live OFAC SDN
            list and thousands of tagged scam and drainer addresses — then turns the evidence into
            audit-ready SAR narratives, case files and agentic MCP and API workflows for your team.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-scale-in mb-4">
            <Button
              onClick={() => setShowEarlyAccess(true)}
              size="lg"
              className="bg-aurora text-white px-8 py-6 text-base font-semibold border-0 animate-glow-pulse hover:scale-[1.03] transition-transform"
            >
              Book a compliance demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/safe')}
              className="border-border/60 bg-card/40 backdrop-blur hover:border-neon-cyan/60 hover:text-neon-cyan px-8 py-6 text-base"
            >
              Run a free Safe Check
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-10">
            Evidence-bound scoring · no fabricated data · Bitcoin and Ethereum in full, Solana
            screening only.{' '}
            <Link to="/methodology" className="text-neon-cyan hover:underline">
              How we score it
            </Link>
          </p>


          {/* Live verdict ticker — real recent public checks */}
          {tickerItems.length > 0 && (
            <div className="marquee-mask relative max-w-4xl mx-auto">
              <div className="marquee-track gap-3 py-2">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-mono backdrop-blur bg-card/40 ${verdictStyles[item.verdict]}`}
                  >
                    <span className="font-semibold uppercase tracking-wider text-[10px]">{item.verdict}</span>
                    <span className="opacity-80">{item.addr}</span>
                    <span className="opacity-60">· {item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature cards */}
          <h2 className="relative mt-16 text-2xl md:text-3xl font-bold tracking-tight">
            What Rìan checks
          </h2>
          <div className="relative mt-6 grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Zap, color: 'text-neon-cyan', title: 'Sanctions & scam lists', body: 'The real OFAC SDN list plus thousands of Etherscan-tagged phishing and drainer addresses, re-synced daily.' },
              { Icon: Shield, color: 'text-neon-violet', title: 'Live token approvals', body: 'Scans your Ethereum wallet for unlimited and high-risk allowances that a contract could still drain.' },
              { Icon: Eye, color: 'text-neon-magenta', title: 'Counterparty trail', body: 'Walks who a wallet has actually transacted with and flags mixers and sanctioned counterparties.' },
            ].map(({ Icon, color, title, body }) => (
              <div
                key={title}
                className="border-glow rounded-2xl bg-card/60 backdrop-blur p-6 text-left"
              >
                <div className={`w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Quick Start Demo Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <QuickStartDemo onTryDemo={handleTryDemo} />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Uncover Clear Risks, Streamline Compliance, Built for Trust
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Empower your compliance and investigation teams with institutional-grade blockchain intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Uncover Clear Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Rapidly identify critical risk indicators, clearly understand transaction flows, and transform complex blockchain data into actionable insights.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Streamline Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Automate wallet risk assessments, streamline sanctions checking, and generate regulatory-ready reports with comprehensive audit trails.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Built for Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Enterprise-grade security, multi-tenant architecture, and institutional compliance 
                  standards ensure your data remains secure and private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Shield className="w-6 h-6 text-accent animate-pulse-slow" />
              <span className="text-xl font-bold">Rìan</span>
            </div>
            
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-white transition-colors hover-scale">
                    Privacy Policy
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6 text-sm">
                      <p className="text-slate-600 dark:text-slate-400">
                        <em>Last updated: January 11, 2025</em>
                      </p>
                      
                      <p>
                        Welcome to <strong>Rìan</strong>. Your privacy matters to us. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights.
                      </p>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">1. Who We Are</h3>
                        <p className="mb-4">
                          Rìan is an AI-driven crypto compliance platform that helps businesses assess wallet risk, trace transactions, and generate compliance reports.
                        </p>
                        <p>Our contact: support@rian.io</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">2. What Data We Collect</h3>
                        <p className="mb-4">We collect only the minimum data needed to provide the service:</p>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Data Type</th>
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">What We Collect</th>
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Why We Collect It</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Account Information</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Email address, sign-up date, login history</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To create and manage your account</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Investigation Records</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Wallet addresses, risk scores, case notes</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To provide compliance risk assessments</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Usage Data</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Number of investigations, last login</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To monitor service usage and performance</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-4 text-green-600 dark:text-green-400">✅ We <strong>do not</strong> collect sensitive personal data (e.g., name, address, financial account numbers).</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">3. How We Use Your Data</h3>
                        <ul className="list-disc list-inside space-y-2">
                          <li>To provide wallet risk scoring and investigation services.</li>
                          <li>To maintain the security and integrity of the platform.</li>
                          <li>To contact you for support, service updates, or account issues.</li>
                        </ul>
                        <p className="mt-4 font-medium">We <strong>never sell or share your data with third parties</strong> for marketing or unrelated purposes.</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">4. How We Store and Protect Your Data</h3>
                        <ul className="list-disc list-inside space-y-2">
                          <li>All data is stored securely using modern encryption standards.</li>
                          <li>Access is limited to authorized personnel only.</li>
                          <li>We conduct regular reviews to ensure data security.</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">5. Your Rights</h3>
                        <p className="mb-4">Under GDPR (if you are in the EU or UK), you have the right to:</p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Access the data we hold about you.</li>
                          <li>Correct inaccuracies in your data.</li>
                          <li>Request deletion of your data ("Right to be Forgotten").</li>
                          <li>Withdraw consent where applicable.</li>
                        </ul>
                        <p className="mt-4">To exercise any of these rights, contact us at: support@rian.io</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">6. Data Retention</h3>
                        <p>
                          We retain user accounts and investigation records <strong>only as long as necessary</strong> for compliance, legal obligations, or service delivery.
                        </p>
                        <p className="mt-2">You may request deletion of your account and all related data at any time.</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">7. Cookies & Tracking</h3>
                        <p>
                          Rìan <strong>does not currently use cookies or third-party tracking</strong> beyond what is strictly necessary for platform functionality.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">8. Changes to This Policy</h3>
                        <p>
                          We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through the platform.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">9. Contact</h3>
                        <p>
                          If you have any questions or concerns about this Privacy Policy or your data, please contact:
                        </p>
                        <p className="mt-2">📧 <strong>support@rian.io</strong></p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors hover-scale">Terms of Service</Link>
              <Link to="/methodology" className="text-slate-400 hover:text-white transition-colors hover-scale">Methodology</Link>
              <Link to="/security-policy" className="text-slate-400 hover:text-white transition-colors hover-scale">Security</Link>

            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-accent transition-colors hover-scale">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-accent transition-colors hover-scale">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Rìan. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EarlyAccessModal 
        isOpen={showEarlyAccess} 
        onClose={() => setShowEarlyAccess(false)} 
      />
    </div>
  );
};

export default Landing;
