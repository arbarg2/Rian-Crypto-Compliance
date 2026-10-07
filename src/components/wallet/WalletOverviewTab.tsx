
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WalletRiskResponse } from '@/services/api';
import RiskScoreDisclosure from './RiskScoreDisclosure';

interface WalletOverviewTabProps {
  wallet: WalletRiskResponse;
}

export function WalletOverviewTab({ wallet }: WalletOverviewTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rìan Heuristic Score Breakdown</CardTitle>
          <RiskScoreDisclosure />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(wallet.risk_score_breakdown || {}).map(([key, value]) => {
              const scoreValue = typeof value === 'object' && value && typeof (value as any).score === 'number' ? (value as any).score : 0;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <Progress value={scoreValue * 10} className="w-48" />
                  <span className="text-sm text-slate-600">{scoreValue.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Asset Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(wallet.asset_breakdown || {}).map(([asset, data]) => {
              const assetData = data as any;
              const balance = typeof assetData?.balance === 'number' ? assetData.balance : 0;
              const usdValue = typeof assetData?.usd_value === 'number' ? assetData.usd_value : null;
              return (
                <div key={asset} className="flex items-center justify-between">
                  <span>{asset}</span>
                  <span className="text-sm text-slate-600">{balance.toFixed(2)}</span>
                  <span className="text-sm text-slate-600">
                    {usdValue === null ? 'No price feed' : `$${usdValue.toFixed(2)}`}
                  </span>
                </div>
              );
            })}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
