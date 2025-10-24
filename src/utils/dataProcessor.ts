/**
 * Dynamic Data Processing Utility
 * Processes actual dat.csv and creates all aggregated views and insights
 * All calculations are based on real data, no dummy or fixed values
 */

import { ClaimData } from '@/types/claims';

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate Mean Absolute Percentage Error
 */
export function calculateMAPE(claims: ClaimData[]): number {
  if (claims.length === 0) return 0;

  const sum = claims.reduce((acc, claim) => {
    const actual = claim.DOLLARAMOUNTHIGH || claim.SETTLEMENTAMOUNT || 0;
    const predicted = claim.CAUSATION_HIGH_RECOMMENDATION || 0;
    if (actual === 0) return acc;
    return acc + Math.abs((actual - predicted) / actual);
  }, 0);

  return (sum / claims.length) * 100;
}

/**
 * Calculate Root Mean Square Error
 */
export function calculateRMSE(claims: ClaimData[]): number {
  if (claims.length === 0) return 0;

  const sumSquares = claims.reduce((acc, claim) => {
    const actual = claim.DOLLARAMOUNTHIGH || claim.SETTLEMENTAMOUNT || 0;
    const predicted = claim.CAUSATION_HIGH_RECOMMENDATION || 0;
    const diff = actual - predicted;
    return acc + (diff * diff);
  }, 0);

  return Math.sqrt(sumSquares / claims.length);
}

/**
 * Calculate variance percentage between actual and predicted
 */
export function calculateVariance(actual: number, predicted: number): number {
  if (predicted === 0) return 0;
  return ((actual - predicted) / predicted) * 100;
}

/**
 * Determine prediction direction
 */
export function getPredictionDirection(variance: number): string {
  if (variance > 5) return 'Underpredicted';
  if (variance < -5) return 'Overpredicted';
  return 'Accurate';
}

/**
 * Extract year from date string
 */
export function extractYear(dateStr: string): number {
  if (!dateStr) return new Date().getFullYear();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

/**
 * Group claims by a specific field
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  array.forEach(item => {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });

  return map;
}

// ==================== AGGREGATION FUNCTIONS ====================

/**
 * Year-Severity Summary
 * Aggregates claims by year and injury severity category
 */
export function createYearSeveritySummary(claims: ClaimData[]) {
  const grouped = new Map<string, ClaimData[]>();

  claims.forEach(claim => {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE);
    const severity = claim.INJURY_SEVERITY_CATEGORY || 'Unknown';
    const key = `${year}-${severity}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(claim);
  });

  const summaries: any[] = [];

  grouped.forEach((groupClaims, key) => {
    const [year, severity] = key.split('-');
    const claimCount = groupClaims.length;

    const totalActual = groupClaims.reduce((sum, c) =>
      sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (c.CAUSATION_HIGH_RECOMMENDATION || 0), 0);

    const avgActual = totalActual / claimCount;
    const avgPredicted = totalPredicted / claimCount;

    const variances = groupClaims.map(c => {
      const actual = c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0;
      const predicted = c.CAUSATION_HIGH_RECOMMENDATION || 0;
      return c.VARIANCE_PERCENTAGE || calculateVariance(actual, predicted);
    });

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;

    const avgDays = groupClaims.reduce((sum, c) =>
      sum + (c.SETTLEMENT_DAYS || 0), 0) / claimCount;

    const overpredictionCount = variances.filter(v => v < -25).length;
    const underpredictionCount = variances.filter(v => v > 25).length;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;

    summaries.push({
      year: parseInt(year),
      severity_category: severity,
      claim_count: claimCount,
      total_actual_settlement: Math.round(totalActual),
      total_predicted_settlement: Math.round(totalPredicted),
      avg_actual_settlement: Math.round(avgActual),
      avg_predicted_settlement: Math.round(avgPredicted),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      avg_settlement_days: Math.round(avgDays),
      overprediction_count: overpredictionCount,
      underprediction_count: underpredictionCount,
      high_variance_count: highVarianceCount,
    });
  });

  return summaries.sort((a, b) => a.year - b.year);
}

/**
 * County-Year Summary
 * Aggregates claims by county, state, and year
 */
export function createCountyYearSummary(claims: ClaimData[]) {
  const grouped = new Map<string, ClaimData[]>();

  claims.forEach(claim => {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE);
    const county = claim.COUNTNAME || 'Unknown';
    const state = claim.VENUESTATE || '';
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || 'Unknown';
    const key = `${county}-${state}-${year}-${venueRating}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(claim);
  });

  const summaries: any[] = [];

  grouped.forEach((groupClaims, key) => {
    const [county, state, year, venueRating] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) =>
      sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);

    const variances = groupClaims.map(c =>
      c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      ));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;
    const overpredictionCount = variances.filter(v => v < -25).length;
    const underpredictionCount = variances.filter(v => v > 25).length;

    summaries.push({
      county,
      state,
      year: parseInt(year),
      venue_rating: venueRating,
      claim_count: claimCount,
      total_settlement: Math.round(totalSettlement),
      avg_settlement: Math.round(totalSettlement / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      high_variance_count: highVarianceCount,
      high_variance_pct: parseFloat(((highVarianceCount / claimCount) * 100).toFixed(2)),
      overprediction_count: overpredictionCount,
      underprediction_count: underpredictionCount,
    });
  });

  return summaries.sort((a, b) => a.year - b.year || a.county.localeCompare(b.county));
}

/**
 * Injury Group Summary
 * Aggregates by injury group, body region, and severity
 */
export function createInjuryGroupSummary(claims: ClaimData[]) {
  const grouped = new Map<string, ClaimData[]>();

  claims.forEach(claim => {
    const injuryGroup = claim.PRIMARY_INJURYGROUP_CODE || 'Unknown';
    const bodyRegion = claim.BODY_REGION || 'Unknown';
    const severity = claim.INJURY_SEVERITY_CATEGORY || 'Unknown';
    const key = `${injuryGroup}-${bodyRegion}-${severity}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(claim);
  });

  const summaries: any[] = [];

  grouped.forEach((groupClaims, key) => {
    const [injuryGroup, bodyRegion, severity] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) =>
      sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (c.CAUSATION_HIGH_RECOMMENDATION || 0), 0);

    const variances = groupClaims.map(c =>
      c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      ));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const avgDays = groupClaims.reduce((sum, c) =>
      sum + (c.SETTLEMENT_DAYS || 0), 0) / claimCount;

    summaries.push({
      injury_group: injuryGroup,
      body_region: bodyRegion,
      severity_category: severity,
      claim_count: claimCount,
      avg_settlement: Math.round(totalSettlement / claimCount),
      avg_predicted: Math.round(totalPredicted / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      avg_settlement_days: Math.round(avgDays),
      total_settlement: Math.round(totalSettlement),
    });
  });

  return summaries.sort((a, b) => b.total_settlement - a.total_settlement);
}

/**
 * Adjuster Performance Summary
 * Aggregates by adjuster to analyze individual performance
 */
export function createAdjusterPerformanceSummary(claims: ClaimData[]) {
  const grouped = groupBy(claims, c => c.ADJUSTERNAME || 'Unknown');

  const summaries: any[] = [];

  grouped.forEach((groupClaims, adjuster) => {
    const claimCount = groupClaims.length;

    const totalActual = groupClaims.reduce((sum, c) =>
      sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (c.CAUSATION_HIGH_RECOMMENDATION || 0), 0);

    const variances = groupClaims.map(c =>
      c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      ));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;
    const overpredictionCount = variances.filter(v => v < -25).length;
    const underpredictionCount = variances.filter(v => v > 25).length;

    const avgDays = groupClaims.reduce((sum, c) =>
      sum + (c.SETTLEMENT_DAYS || 0), 0) / claimCount;

    summaries.push({
      adjuster_name: adjuster,
      claim_count: claimCount,
      avg_actual_settlement: Math.round(totalActual / claimCount),
      avg_predicted_settlement: Math.round(totalPredicted / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      high_variance_count: highVarianceCount,
      high_variance_pct: parseFloat(((highVarianceCount / claimCount) * 100).toFixed(2)),
      overprediction_count: overpredictionCount,
      underprediction_count: underpredictionCount,
      avg_settlement_days: Math.round(avgDays),
    });
  });

  return summaries.sort((a, b) => b.claim_count - a.claim_count);
}

/**
 * Venue Analysis Summary
 * Aggregates by venue rating, state, and county
 */
export function createVenueAnalysisSummary(claims: ClaimData[]) {
  const grouped = new Map<string, ClaimData[]>();

  claims.forEach(claim => {
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || 'Unknown';
    const state = claim.VENUESTATE || '';
    const county = claim.COUNTNAME || 'Unknown';
    const key = `${venueRating}-${state}-${county}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(claim);
  });

  const summaries: any[] = [];

  grouped.forEach((groupClaims, key) => {
    const [venueRating, state, county] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) =>
      sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (c.CAUSATION_HIGH_RECOMMENDATION || 0), 0);

    const avgVenuePoint = groupClaims.reduce((sum, c) =>
      sum + (c.VENUERATINGPOINT || 0), 0) / claimCount;

    const variances = groupClaims.map(c =>
      c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      ));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;

    summaries.push({
      venue_rating: venueRating,
      state,
      county,
      claim_count: claimCount,
      avg_settlement: Math.round(totalSettlement / claimCount),
      avg_predicted: Math.round(totalPredicted / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      avg_venue_rating_point: parseFloat(avgVenuePoint.toFixed(2)),
      high_variance_pct: parseFloat(((highVarianceCount / claimCount) * 100).toFixed(2)),
    });
  });

  return summaries.sort((a, b) => b.claim_count - a.claim_count);
}

/**
 * Variance Driver Analysis
 * Identifies which factors contribute most to prediction variance
 */
export function analyzeVarianceDrivers(claims: ClaimData[]): any[] {
  const drivers: any[] = [];

  // Analyze categorical factors
  const categoricalFactors = [
    'Injury_Extent',
    'Treatment_Course',
    'Pain_Management',
    'Physical_Therapy',
    'Vehicle_Impact',
    'Emergency_Treatment',
    'Prior_Treatment',
    'INJURY_SEVERITY_CATEGORY',
    'BODY_REGION',
    'Consistent_Mechanism',
    'Treatment_Delays',
  ];

  categoricalFactors.forEach(factor => {
    const grouped = groupBy(claims, (c: any) => c[factor] || 'Unknown');

    grouped.forEach((groupClaims, value) => {
      if (groupClaims.length < 5) return; // Skip small groups

      const variances = groupClaims.map(c =>
        Math.abs(c.VARIANCE_PERCENTAGE || calculateVariance(
          c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
          c.CAUSATION_HIGH_RECOMMENDATION || 0
        ))
      );

      const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;

      // Calculate contribution score (weighted by frequency and variance magnitude)
      const frequency = groupClaims.length / claims.length;
      const contributionScore = avgVariance * frequency;

      let correlationStrength = 'Low';
      if (avgVariance > 40) correlationStrength = 'High';
      else if (avgVariance > 25) correlationStrength = 'Medium';

      drivers.push({
        factor_name: factor.replace(/_/g, ' '),
        factor_value: String(value),
        claim_count: groupClaims.length,
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        contribution_score: parseFloat(contributionScore.toFixed(2)),
        correlation_strength: correlationStrength,
      });
    });
  });

  return drivers.sort((a, b) => b.contribution_score - a.contribution_score).slice(0, 20);
}

/**
 * Calculate overall model performance metrics
 */
export function calculateModelPerformance(claims: ClaimData[]): any {
  const totalClaims = claims.length;

  const totalActual = claims.reduce((sum, c) =>
    sum + (c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0), 0);
  const totalPredicted = claims.reduce((sum, c) =>
    sum + (c.CAUSATION_HIGH_RECOMMENDATION || 0), 0);

  const avgActual = totalActual / totalClaims;
  const avgPredicted = totalPredicted / totalClaims;

  const variances = claims.map(c =>
    c.VARIANCE_PERCENTAGE || calculateVariance(
      c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
      c.CAUSATION_HIGH_RECOMMENDATION || 0
    ));

  const avgVariance = variances.reduce((sum, v) => sum + v, 0) / totalClaims;
  const mape = calculateMAPE(claims);
  const rmse = calculateRMSE(claims);

  const overpredictionCount = variances.filter(v => v < -25).length;
  const underpredictionCount = variances.filter(v => v > 25).length;
  const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;

  // Accuracy by severity
  const bySeverity = groupBy(claims, c => c.INJURY_SEVERITY_CATEGORY || 'Unknown');
  const accuracyBySeverity: Record<string, number> = {};

  bySeverity.forEach((groupClaims, severity) => {
    const accurateCount = groupClaims.filter(c => {
      const variance = c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      );
      return Math.abs(variance) <= 25;
    }).length;

    accuracyBySeverity[severity] = parseFloat(((accurateCount / groupClaims.length) * 100).toFixed(2));
  });

  // Accuracy by amount category
  const byAmount = groupBy(claims, c => c.ACTUAL_SETTLEMENT_CATEGORY || 'Unknown');
  const accuracyByAmount: Record<string, number> = {};

  byAmount.forEach((groupClaims, category) => {
    const accurateCount = groupClaims.filter(c => {
      const variance = c.VARIANCE_PERCENTAGE || calculateVariance(
        c.DOLLARAMOUNTHIGH || c.SETTLEMENTAMOUNT || 0,
        c.CAUSATION_HIGH_RECOMMENDATION || 0
      );
      return Math.abs(variance) <= 25;
    }).length;

    accuracyByAmount[category] = parseFloat(((accurateCount / groupClaims.length) * 100).toFixed(2));
  });

  return {
    total_claims: totalClaims,
    avg_actual_settlement: Math.round(avgActual),
    avg_predicted_settlement: Math.round(avgPredicted),
    overall_variance_pct: parseFloat(avgVariance.toFixed(2)),
    mape: parseFloat(mape.toFixed(2)),
    rmse: Math.round(rmse),
    overprediction_rate: parseFloat(((overpredictionCount / totalClaims) * 100).toFixed(2)),
    underprediction_rate: parseFloat(((underpredictionCount / totalClaims) * 100).toFixed(2)),
    high_variance_rate: parseFloat(((highVarianceCount / totalClaims) * 100).toFixed(2)),
    accuracy_by_severity: accuracyBySeverity,
    accuracy_by_amount: accuracyByAmount,
  };
}

/**
 * Convert array to CSV string
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Process all aggregations from a claims dataset
 */
export function processAllAggregations(claims: ClaimData[]) {
  return {
    yearSeverity: createYearSeveritySummary(claims),
    countyYear: createCountyYearSummary(claims),
    injuryGroup: createInjuryGroupSummary(claims),
    adjusterPerformance: createAdjusterPerformanceSummary(claims),
    venueAnalysis: createVenueAnalysisSummary(claims),
    varianceDrivers: analyzeVarianceDrivers(claims),
    modelPerformance: calculateModelPerformance(claims),
  };
}
