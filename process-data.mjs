import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== HELPER FUNCTIONS ====================

// Get value with fallback column names
function getActualAmount(claim) {
  return parseFloat(claim.DOLLARAMOUNTHIGH) ||
         parseFloat(claim.SETTLEMENTAMOUNT) ||
         0;
}

function getPredictedAmount(claim) {
  return parseFloat(claim.CAUSATION_HIGH_RECOMMENDATION) ||
         parseFloat(claim['CAUSATION__HIGH_RECOMMENDATION']) ||
         parseFloat(claim.predicted_pain_suffering) ||
         0;
}

function getVariance(claim) {
  // Use pre-calculated variance if available
  if (claim.VARIANCE_PERCENTAGE && parseFloat(claim.VARIANCE_PERCENTAGE) !== 0) {
    return parseFloat(claim.VARIANCE_PERCENTAGE);
  }
  if (claim.variance_pct && parseFloat(claim.variance_pct) !== 0) {
    return parseFloat(claim.variance_pct);
  }

  // Calculate variance
  const actual = getActualAmount(claim);
  const predicted = getPredictedAmount(claim);
  return calculateVariance(actual, predicted);
}

function calculateVariance(actual, predicted) {
  if (predicted === 0) return 0;
  return ((actual - predicted) / predicted) * 100;
}

function extractYear(dateStr) {
  if (!dateStr) return new Date().getFullYear();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

function groupBy(array, keyFn) {
  const map = new Map();
  array.forEach(item => {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  });
  return map;
}

function convertToCSV(data) {
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

// ==================== AGGREGATION FUNCTIONS ====================

function createYearSeveritySummary(claims) {
  const grouped = new Map();

  claims.forEach(claim => {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE || claim.claim_date);
    const severity = claim.INJURY_SEVERITY_CATEGORY || claim.CAUTION_LEVEL || 'Unknown';
    const key = `${year}-${severity}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(claim);
  });

  const summaries = [];

  grouped.forEach((groupClaims, key) => {
    const [year, severity] = key.split('-');
    const claimCount = groupClaims.length;

    const totalActual = groupClaims.reduce((sum, c) => sum + getActualAmount(c), 0);
    const totalPredicted = groupClaims.reduce((sum, c) => sum + getPredictedAmount(c), 0);

    const variances = groupClaims.map(c => getVariance(c));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const avgDays = groupClaims.reduce((sum, c) => sum + (parseFloat(c.SETTLEMENT_DAYS) || 0), 0) / claimCount;

    summaries.push({
      year: parseInt(year),
      severity_category: severity,
      claim_count: claimCount,
      total_actual_settlement: Math.round(totalActual),
      total_predicted_settlement: Math.round(totalPredicted),
      avg_actual_settlement: Math.round(totalActual / claimCount),
      avg_predicted_settlement: Math.round(totalPredicted / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      avg_settlement_days: Math.round(avgDays),
      overprediction_count: variances.filter(v => v < -25).length,
      underprediction_count: variances.filter(v => v > 25).length,
      high_variance_count: variances.filter(v => Math.abs(v) > 25).length,
    });
  });

  return summaries.sort((a, b) => a.year - b.year);
}

function createCountyYearSummary(claims) {
  const grouped = new Map();

  claims.forEach(claim => {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE || claim.claim_date);
    const county = claim.COUNTNAME || claim.COUNTYNAME || 'Unknown';
    const state = claim.VENUESTATE || '';
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || claim.VENUE_RATING || 'Unknown';
    const key = `${county}-${state}-${year}-${venueRating}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(claim);
  });

  const summaries = [];

  grouped.forEach((groupClaims, key) => {
    const [county, state, year, venueRating] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) => sum + getActualAmount(c), 0);

    const variances = groupClaims.map(c => getVariance(c));

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;

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
      overprediction_count: variances.filter(v => v < -25).length,
      underprediction_count: variances.filter(v => v > 25).length,
    });
  });

  return summaries.sort((a, b) => a.year - b.year || a.county.localeCompare(b.county));
}

function createInjuryGroupSummary(claims) {
  const grouped = new Map();

  claims.forEach(claim => {
    const injuryGroup = claim.PRIMARY_INJURYGROUP_CODE || 'Unknown';
    const bodyRegion = claim.BODY_REGION || 'Unknown';
    const severity = claim.INJURY_SEVERITY_CATEGORY || 'Unknown';
    const key = `${injuryGroup}-${bodyRegion}-${severity}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(claim);
  });

  const summaries = [];

  grouped.forEach((groupClaims, key) => {
    const [injuryGroup, bodyRegion, severity] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0), 0);

    const variances = groupClaims.map(c => {
      const actual = parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0;
      const predicted = parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0;
      return parseFloat(c.VARIANCE_PERCENTAGE) || calculateVariance(actual, predicted);
    });

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const avgDays = groupClaims.reduce((sum, c) => sum + (parseFloat(c.SETTLEMENT_DAYS) || 0), 0) / claimCount;

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

function createAdjusterPerformanceSummary(claims) {
  const grouped = groupBy(claims, c => c.ADJUSTERNAME || 'Unknown');
  const summaries = [];

  grouped.forEach((groupClaims, adjuster) => {
    const claimCount = groupClaims.length;

    const totalActual = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0), 0);

    const variances = groupClaims.map(c => {
      const actual = parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0;
      const predicted = parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0;
      return parseFloat(c.VARIANCE_PERCENTAGE) || calculateVariance(actual, predicted);
    });

    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / claimCount;
    const highVarianceCount = variances.filter(v => Math.abs(v) > 25).length;
    const avgDays = groupClaims.reduce((sum, c) => sum + (parseFloat(c.SETTLEMENT_DAYS) || 0), 0) / claimCount;

    summaries.push({
      adjuster_name: adjuster,
      claim_count: claimCount,
      avg_actual_settlement: Math.round(totalActual / claimCount),
      avg_predicted_settlement: Math.round(totalPredicted / claimCount),
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      high_variance_count: highVarianceCount,
      high_variance_pct: parseFloat(((highVarianceCount / claimCount) * 100).toFixed(2)),
      overprediction_count: variances.filter(v => v < -25).length,
      underprediction_count: variances.filter(v => v > 25).length,
      avg_settlement_days: Math.round(avgDays),
    });
  });

  return summaries.sort((a, b) => b.claim_count - a.claim_count);
}

function createVenueAnalysisSummary(claims) {
  const grouped = new Map();

  claims.forEach(claim => {
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || 'Unknown';
    const state = claim.VENUESTATE || '';
    const county = claim.COUNTNAME || 'Unknown';
    const key = `${venueRating}-${state}-${county}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(claim);
  });

  const summaries = [];

  grouped.forEach((groupClaims, key) => {
    const [venueRating, state, county] = key.split('-');
    const claimCount = groupClaims.length;

    const totalSettlement = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0), 0);
    const totalPredicted = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0), 0);

    const avgVenuePoint = groupClaims.reduce((sum, c) =>
      sum + (parseFloat(c.VENUERATINGPOINT) || 0), 0) / claimCount;

    const variances = groupClaims.map(c => {
      const actual = parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0;
      const predicted = parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0;
      return parseFloat(c.VARIANCE_PERCENTAGE) || calculateVariance(actual, predicted);
    });

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

function analyzeVarianceDrivers(claims) {
  const drivers = [];

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
    const grouped = groupBy(claims, c => c[factor] || 'Unknown');

    grouped.forEach((groupClaims, value) => {
      if (groupClaims.length < 5) return;

      const variances = groupClaims.map(c => {
        const actual = parseFloat(c.DOLLARAMOUNTHIGH) || parseFloat(c.SETTLEMENTAMOUNT) || 0;
        const predicted = parseFloat(c.CAUSATION_HIGH_RECOMMENDATION) || 0;
        return Math.abs(parseFloat(c.VARIANCE_PERCENTAGE) || calculateVariance(actual, predicted));
      });

      const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
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

  return drivers.sort((a, b) => b.contribution_score - a.contribution_score).slice(0, 30);
}

// ==================== MAIN EXECUTION ====================

console.log('Reading dat.csv...');
const datPath = path.join(__dirname, 'public', 'dat.csv');

if (!fs.existsSync(datPath)) {
  console.error('ERROR: dat.csv not found in public folder!');
  console.error('Please place your actual dat.csv file in the public folder.');
  process.exit(1);
}

const csvContent = fs.readFileSync(datPath, 'utf-8');
const claims = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`Loaded ${claims.length} claims from dat.csv`);

console.log('\nGenerating aggregated summaries...');

const yearSeverity = createYearSeveritySummary(claims);
console.log(`✓ Year-Severity Summary: ${yearSeverity.length} records`);

const countyYear = createCountyYearSummary(claims);
console.log(`✓ County-Year Summary: ${countyYear.length} records`);

const injuryGroup = createInjuryGroupSummary(claims);
console.log(`✓ Injury Group Summary: ${injuryGroup.length} records`);

const adjusterPerformance = createAdjusterPerformanceSummary(claims);
console.log(`✓ Adjuster Performance Summary: ${adjusterPerformance.length} records`);

const venueAnalysis = createVenueAnalysisSummary(claims);
console.log(`✓ Venue Analysis Summary: ${venueAnalysis.length} records`);

const varianceDrivers = analyzeVarianceDrivers(claims);
console.log(`✓ Variance Drivers Analysis: ${varianceDrivers.length} records`);

console.log('\nWriting aggregated CSV files...');
const publicDir = path.join(__dirname, 'public');

fs.writeFileSync(path.join(publicDir, 'year_severity_summary.csv'), convertToCSV(yearSeverity));
console.log('✓ Created public/year_severity_summary.csv');

fs.writeFileSync(path.join(publicDir, 'county_year_summary.csv'), convertToCSV(countyYear));
console.log('✓ Created public/county_year_summary.csv');

fs.writeFileSync(path.join(publicDir, 'injury_group_summary.csv'), convertToCSV(injuryGroup));
console.log('✓ Created public/injury_group_summary.csv');

fs.writeFileSync(path.join(publicDir, 'adjuster_performance_summary.csv'), convertToCSV(adjusterPerformance));
console.log('✓ Created public/adjuster_performance_summary.csv');

fs.writeFileSync(path.join(publicDir, 'venue_analysis_summary.csv'), convertToCSV(venueAnalysis));
console.log('✓ Created public/venue_analysis_summary.csv');

fs.writeFileSync(path.join(publicDir, 'variance_drivers_analysis.csv'), convertToCSV(varianceDrivers));
console.log('✓ Created public/variance_drivers_analysis.csv');

console.log('\n✅ All aggregated CSV files generated successfully!');
console.log('\nYou can now use these files in your dashboard for optimized performance.');
