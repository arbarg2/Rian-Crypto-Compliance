import { supabase } from '@/integrations/supabase/client';
import { lookupSanctionsAddress } from '@/services/referenceLookup';
import { WalletRiskResponse } from './api';
import { sanctionsScreeningService, SanctionsResult } from './sanctionsApi';

export interface RiskFactor {
  id: string;
  lookup_record_id: string;
  factor_type: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  description?: string;
  detected_at: string;
  created_at: string;
}

export interface SanctionsMatch {
  id: string;
  lookup_record_id: string;
  entity_name: string;
  entity_type: string;
  match_type: 'direct' | '1-hop';
  confidence_score: number;
  source_list: string;
  screening_date: string;
  created_at: string;
}

class RiskFactorsService {
  async getRiskFactors(lookupRecordId: string): Promise<RiskFactor[]> {
    try {
      const { data, error } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('lookup_record_id', lookupRecordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching risk factors:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        severity: ['low', 'medium', 'high'].includes(item.severity) ? item.severity as 'low' | 'medium' | 'high' : 'low'
      }));
    } catch (error) {
      console.error('Error in getRiskFactors:', error);
      return [];
    }
  }

  async calculateAndStoreRiskFactors(lookupRecordId: string, walletData: WalletRiskResponse): Promise<RiskFactor[]> {
    try {
      console.log('Calculating risk factors for lookup record:', lookupRecordId);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(lookupRecordId)) {
        console.error('Invalid UUID format for lookup record ID:', lookupRecordId);
        return [];
      }

      // Generate dynamic risk factors based on wallet data
      const factors = [];
      
      // High frequency trading factor
      if (walletData.transaction_count > 500) {
        factors.push({
          factor_type: 'high_frequency_transactions',
          severity: walletData.transaction_count > 1000 ? 'high' : 'medium',
          score: Math.min(10, walletData.transaction_count / 100),
          description: `Wallet has ${walletData.transaction_count} transactions, indicating ${walletData.transaction_count > 1000 ? 'very high' : 'high'} activity`
        });
      }

      // Mixer usage factor
      if (walletData.risk_factors?.mixer_usage || walletData.entity_attribution?.type === 'mixer') {
        factors.push({
          factor_type: 'mixer_proximity',
          severity: 'high',
          score: 9.0,
          description: 'Wallet shows connection to cryptocurrency mixing services'
        });
      }

      // Enhanced sanctions exposure factor with real screening
      if (walletData.entity_attribution?.name) {
        try {
          const sanctionsResults = await sanctionsScreeningService.screenEntity(
            walletData.entity_attribution.name,
            walletData.address
          );
          
          if (sanctionsResults.length > 0) {
            const highestConfidence = Math.max(...sanctionsResults.map(r => r.confidence_score));
            const directMatches = sanctionsResults.filter(r => r.match_type === 'direct');
            
            factors.push({
              factor_type: 'sanctions_exposure',
              severity: directMatches.length > 0 ? 'high' : 'medium',
              score: 8.0 + (highestConfidence * 2.0), // 8-10 range
              description: `Sanctions screening detected ${sanctionsResults.length} match(es) with ${Math.round(highestConfidence * 100)}% confidence`
            });
          }
        } catch (error) {
          console.error('Sanctions screening failed during risk factor calculation:', error);
        }
      }

      // Direct sanctions exposure from existing data
      if (walletData.sanctions_exposure?.direct_hits > 0) {
        factors.push({
          factor_type: 'direct_sanctions',
          severity: 'high',
          score: 9.5,
          description: 'Direct exposure to sanctioned entities detected in wallet data'
        });
      }

      // Volume-based risk factor
      if (walletData.volume_metrics?.lifetime_value?.usd_equivalent > 100000) {
        factors.push({
          factor_type: 'suspicious_volume',
          severity: walletData.volume_metrics.lifetime_value.usd_equivalent > 1000000 ? 'high' : 'medium',
          score: Math.min(10, walletData.volume_metrics.lifetime_value.usd_equivalent / 100000),
          description: `High transaction volume of $${walletData.volume_metrics.lifetime_value.usd_equivalent.toFixed(2)} detected`
        });
      }

      // Dark market exposure
      if (walletData.risk_factors?.dark_market_exposure) {
        factors.push({
          factor_type: 'dark_market_exposure',
          severity: 'high',
          score: 8.5,
          description: 'Potential connection to dark market activities detected'
        });
      }

      // Fraud reports
      if (walletData.risk_factors?.fraud_reports) {
        factors.push({
          factor_type: 'fraud_reports',
          severity: 'high',
          score: 8.0,
          description: 'Wallet flagged in fraud reporting systems'
        });
      }

      if (factors.length === 0) {
        console.log('No significant risk factors detected');
        return [];
      }

      // Store factors in database
      const factorsToInsert = factors.map((factor) => ({
        lookup_record_id: lookupRecordId,
        factor_type: factor.factor_type,
        severity: ['low', 'medium', 'high'].includes(factor.severity) ? factor.severity : 'low',
        score: factor.score,
        description: factor.description
      }));

      const { data: insertedFactors, error: insertError } = await supabase
        .from('risk_factors')
        .insert(factorsToInsert)
        .select();

      if (insertError) {
        console.error('Error storing risk factors:', insertError);
        return [];
      }

      console.log('Successfully stored risk factors:', insertedFactors);
      return (insertedFactors || []).map(item => ({
        ...item,
        severity: ['low', 'medium', 'high'].includes(item.severity) ? item.severity as 'low' | 'medium' | 'high' : 'low'
      }));
    } catch (error) {
      console.error('Error calculating risk factors:', error);
      return [];
    }
  }

  async getSanctionsScreening(lookupRecordId: string): Promise<SanctionsMatch[]> {
    try {
      const { data, error } = await supabase
        .from('sanctions_screening')
        .select('*')
        .eq('lookup_record_id', lookupRecordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sanctions screening:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        match_type: ['direct', '1-hop'].includes(item.match_type) ? item.match_type as 'direct' | '1-hop' : 'direct'
      }));
    } catch (error) {
      console.error('Error in getSanctionsScreening:', error);
      return [];
    }
  }

  async screenSanctions(walletAddress: string, network: string): Promise<SanctionsResult[]> {
    try {
      console.log('🛡️ Real OFAC sanctions screening for:', walletAddress, network);

      const results: SanctionsResult[] = [];

      // 1. Direct match against OFAC SDN address list (case-insensitive)
      const { hits: directMatches, error } = await lookupSanctionsAddress(walletAddress, network);

      if (error) {
        console.error('Sanctions DB query failed:', error);
      } else if (directMatches && directMatches.length > 0) {
        for (const m of directMatches) {
          results.push({
            entity_name: m.entity_name || 'OFAC-Listed Address',
            entity_type: 'Sanctioned Address',
            match_type: 'direct',
            confidence_score: 1.0,
            source_list: m.source_list,
            matched_entity: m.address,
            sanction_match: true,
          });
        }
        console.log(`🚨 Direct OFAC match for ${walletAddress}`);
        return results;
      }

      // 2. Fall through to entity-name screening for additional context
      const entityResults = await sanctionsScreeningService
        .screenEntity('Unknown Entity', walletAddress)
        .catch(() => [] as SanctionsResult[]);

      return [...results, ...entityResults];
    } catch (error) {
      console.error('Error in sanctions screening:', error);
      return [];
    }
  }

  async storeSanctionsScreening(lookupRecordId: string, matches: SanctionsResult[]): Promise<SanctionsMatch[]> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(lookupRecordId)) {
        console.error('Invalid UUID format for lookup record ID:', lookupRecordId);
        return [];
      }

      if (matches.length === 0) {
        console.log('No sanctions matches to store');
        return [];
      }

      const matchesToInsert = matches.map((match) => ({
        lookup_record_id: lookupRecordId,
        entity_name: match.entity_name,
        entity_type: match.entity_type,
        match_type: ['direct', '1-hop'].includes(match.match_type) ? match.match_type : 'direct',
        confidence_score: match.confidence_score,
        source_list: match.source_list
      }));

      const { data: insertedMatches, error } = await supabase
        .from('sanctions_screening')
        .insert(matchesToInsert)
        .select();

      if (error) {
        console.error('Error storing sanctions screening:', error);
        return [];
      }

      return (insertedMatches || []).map(item => ({
        ...item,
        match_type: ['direct', '1-hop'].includes(item.match_type) ? item.match_type as 'direct' | '1-hop' : 'direct'
      }));
    } catch (error) {
      console.error('Error in storeSanctionsScreening:', error);
      return [];
    }
  }

  // Method to screen entity by name (new functionality)
  async screenEntityByName(entityName: string, walletAddress?: string): Promise<SanctionsResult[]> {
    try {
      console.log('Screening entity by name:', entityName);
      return await sanctionsScreeningService.screenEntity(entityName, walletAddress);
    } catch (error) {
      console.error('Entity screening failed:', error);
      return [];
    }
  }
}

export const riskFactorsService = new RiskFactorsService();
