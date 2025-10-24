/**
 * Hook to load ONLY aggregated CSV files (not the large dat.csv)
 * This prevents "string too long" errors and works with 1M+ record datasets
 */

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

// Type definitions
export interface YearSeveritySummary {
  year: number;
  severity_category: string;
  claim_count: number;
  total_actual_settlement: number;
  total_predicted_settlement: number;
  avg_actual_settlement: number;
  avg_predicted_settlement: number;
  avg_variance_pct: number;
  avg_settlement_days: number;
  overprediction_count: number;
  underprediction_count: number;
  high_variance_count: number;
}

export interface CountyYearSummary {
  county: string;
  state: string;
  year: number;
  venue_rating: string;
  claim_count: number;
  total_settlement: number;
  avg_settlement: number;
  avg_variance_pct: number;
  high_variance_count: number;
  high_variance_pct: number;
  overprediction_count: number;
  underprediction_count: number;
}

export interface InjuryGroupSummary {
  injury_group: string;
  body_region: string;
  severity_category: string;
  claim_count: number;
  avg_settlement: number;
  avg_predicted: number;
  avg_variance_pct: number;
  avg_settlement_days: number;
  total_settlement: number;
}

export interface AdjusterPerformanceSummary {
  adjuster_name: string;
  claim_count: number;
  avg_actual_settlement: number;
  avg_predicted_settlement: number;
  avg_variance_pct: number;
  high_variance_count: number;
  high_variance_pct: number;
  overprediction_count: number;
  underprediction_count: number;
  avg_settlement_days: number;
}

export interface VenueAnalysisSummary {
  venue_rating: string;
  state: string;
  county: string;
  claim_count: number;
  avg_settlement: number;
  avg_predicted: number;
  avg_variance_pct: number;
  avg_venue_rating_point: number;
  high_variance_pct: number;
}

export interface VarianceDriverAnalysis {
  factor_name: string;
  factor_value: string;
  claim_count: number;
  avg_variance_pct: number;
  contribution_score: number;
  correlation_strength: string;
}

export interface AggregatedData {
  yearSeverity: YearSeveritySummary[];
  countyYear: CountyYearSummary[];
  injuryGroup: InjuryGroupSummary[];
  adjusterPerformance: AdjusterPerformanceSummary[];
  venueAnalysis: VenueAnalysisSummary[];
  varianceDrivers: VarianceDriverAnalysis[];
}

// Generic CSV loader
async function loadCsvFile<T>(filename: string): Promise<T[]> {
  try {
    const response = await fetch(`/${filename}`);
    if (!response.ok) {
      console.warn(`Could not load ${filename}`);
      return [];
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as T[]);
        },
        error: (error) => {
          console.error(`Error parsing ${filename}:`, error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

export function useAggregatedClaimsData() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Loading aggregated CSVs (NOT loading dat.csv)...');

        const [
          yearSeverity,
          countyYear,
          injuryGroup,
          adjusterPerformance,
          venueAnalysis,
          varianceDrivers
        ] = await Promise.all([
          loadCsvFile<YearSeveritySummary>('year_severity_summary.csv'),
          loadCsvFile<CountyYearSummary>('county_year_summary.csv'),
          loadCsvFile<InjuryGroupSummary>('injury_group_summary.csv'),
          loadCsvFile<AdjusterPerformanceSummary>('adjuster_performance_summary.csv'),
          loadCsvFile<VenueAnalysisSummary>('venue_analysis_summary.csv'),
          loadCsvFile<VarianceDriverAnalysis>('variance_drivers_analysis.csv'),
        ]);

        console.log('✅ Aggregated data loaded:', {
          yearSeverity: yearSeverity.length,
          countyYear: countyYear.length,
          injuryGroup: injuryGroup.length,
          adjusterPerformance: adjusterPerformance.length,
          venueAnalysis: venueAnalysis.length,
          varianceDrivers: varianceDrivers.length,
        });

        setData({
          yearSeverity,
          countyYear,
          injuryGroup,
          adjusterPerformance,
          venueAnalysis,
          varianceDrivers,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load aggregated data:', err);
        setError('Failed to load aggregated data. Please run: node process-data-streaming.mjs');
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate KPIs from aggregated data
  const kpis = useMemo(() => {
    if (!data || !data.yearSeverity.length) {
      return {
        totalClaims: 0,
        avgSettlement: 0,
        avgDays: 0,
        highVariancePct: 0,
        overpredictionRate: 0,
        underpredictionRate: 0,
      };
    }

    const totalClaims = data.yearSeverity.reduce((sum, s) => sum + s.claim_count, 0);
    const totalActual = data.yearSeverity.reduce((sum, s) => sum + s.total_actual_settlement, 0);
    const totalDays = data.yearSeverity.reduce((sum, s) => sum + (s.avg_settlement_days * s.claim_count), 0);

    const avgSettlement = totalClaims > 0 ? totalActual / totalClaims : 0;
    const avgDays = totalClaims > 0 ? totalDays / totalClaims : 0;

    const totalOverprediction = data.yearSeverity.reduce((sum, s) => sum + s.overprediction_count, 0);
    const totalUnderprediction = data.yearSeverity.reduce((sum, s) => sum + s.underprediction_count, 0);
    const totalHighVariance = data.yearSeverity.reduce((sum, s) => sum + s.high_variance_count, 0);

    return {
      totalClaims,
      avgSettlement: Math.round(avgSettlement),
      avgDays: Math.round(avgDays),
      highVariancePct: totalClaims > 0 ? (totalHighVariance / totalClaims) * 100 : 0,
      overpredictionRate: totalClaims > 0 ? (totalOverprediction / totalClaims) * 100 : 0,
      underpredictionRate: totalClaims > 0 ? (totalUnderprediction / totalClaims) * 100 : 0,
    };
  }, [data]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    if (!data) {
      return {
        counties: [],
        years: [],
        injuryGroups: [],
        venueRatings: [],
        severityCategories: [],
        adjusters: [],
      };
    }

    return {
      counties: [...new Set(data.countyYear.map(d => d.county))].sort(),
      years: [...new Set(data.yearSeverity.map(d => d.year))].sort(),
      injuryGroups: [...new Set(data.injuryGroup.map(d => d.injury_group))].sort(),
      venueRatings: [...new Set(data.venueAnalysis.map(d => d.venue_rating))].sort(),
      severityCategories: [...new Set(data.yearSeverity.map(d => d.severity_category))].sort(),
      adjusters: [...new Set(data.adjusterPerformance.map(d => d.adjuster_name))].sort(),
    };
  }, [data]);

  return {
    data,
    kpis,
    filterOptions,
    isLoading,
    error,
  };
}
