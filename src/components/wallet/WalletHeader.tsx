
import React from 'react';
import { ArrowLeft, Download, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserDropdown } from '@/components/UserDropdown';
import { WalletRiskResponse } from '@/services/api';
import RiskScoreDisclosure from './RiskScoreDisclosure';

interface WalletHeaderProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

export function WalletHeader({ wallet, onBack, onViewFlow, onGenerateReport }: WalletHeaderProps) {
  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'Medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'High':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Enhanced Wallet Analysis</h1>
                <p className="text-sm text-slate-500">Comprehensive risk assessment and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button onClick={onViewFlow} variant="outline">
                  <Network className="w-4 h-4 mr-2" />
                  View Transaction Flow
                </Button>
                <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Header with Address and Timestamp */}
      <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="space-y-2 mb-4 lg:mb-0">
              <h2 className="text-2xl font-bold text-slate-900">Wallet Analysis Results</h2>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-600">Address:</span>
                  <code className="bg-slate-100 px-3 py-1 rounded text-sm font-mono text-slate-800 break-all">
                    {wallet.address}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-600">Analyzed:</span>
                  <span className="text-sm text-slate-700">
                    {new Date().toLocaleString()} ({wallet.processing_time_ms}ms)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getRiskConfig(wallet.risk_level)} text-lg px-4 py-2 font-bold`}>
                {wallet.risk_level.toUpperCase()} RISK
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {wallet.risk_score.toFixed(1)}/10
                </div>
                <RiskScoreDisclosure />
              </div>
            </div>
          </div>
          <p className="text-slate-700">{wallet.explanation}</p>
        </CardContent>
      </Card>
    </>
  );
}
