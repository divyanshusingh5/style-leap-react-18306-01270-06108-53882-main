/**
 * Streaming CSV Processor for Large Datasets (1M+ records)
 *
 * Uses streaming and memory-efficient aggregation to process
 * large CSV files without loading everything into memory.
 *
 * Usage: node process-data-streaming.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { Transform } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== PROGRESS TRACKING ====================

let totalProcessed = 0;
let startTime = Date.now();

function logProgress(current, message = '') {
  totalProcessed = current;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = Math.round(current / elapsed);

  // Windows-compatible progress output
  if (process.stdout.clearLine) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      `Processed: ${current.toLocaleString()} claims | ` +
      `Rate: ${rate.toLocaleString()}/sec | ` +
      `Time: ${elapsed}s ${message}`
    );
  } else {
    // Fallback for Windows terminals
    if (current % 10000 === 0 || message) {
      console.log(
        `Processed: ${current.toLocaleString()} claims | ` +
        `Rate: ${rate.toLocaleString()}/sec | ` +
        `Time: ${elapsed}s ${message}`
      );
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

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

function calculateVariance(actual, predicted) {
  if (predicted === 0) return 0;
  return ((actual - predicted) / predicted) * 100;
}

function extractYear(dateStr) {
  if (!dateStr) return new Date().getFullYear();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
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

// ==================== MEMORY-EFFICIENT AGGREGATORS ====================

class YearSeverityAggregator {
  constructor() {
    this.groups = new Map();
  }

  add(claim) {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE || claim.claim_date);
    const severity = claim.INJURY_SEVERITY_CATEGORY || claim.CAUTION_LEVEL || 'Unknown';
    const key = `${year}-${severity}`;

    if (!this.groups.has(key)) {
      this.groups.set(key, {
        year,
        severity_category: severity,
        count: 0,
        totalActual: 0,
        totalPredicted: 0,
        totalDays: 0,
        variances: [],
      });
    }

    const group = this.groups.get(key);
    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = parseFloat(claim.VARIANCE_PERCENTAGE) ||
                    parseFloat(claim.variance_pct) ||
                    calculateVariance(actual, predicted);

    group.count++;
    group.totalActual += actual;
    group.totalPredicted += predicted;
    group.totalDays += parseFloat(claim.SETTLEMENT_DAYS) || 0;
    group.variances.push(variance);
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group, key) => {
      const avgVariance = group.variances.reduce((sum, v) => sum + v, 0) / group.count;
      const overpredictionCount = group.variances.filter(v => v < -25).length;
      const underpredictionCount = group.variances.filter(v => v > 25).length;
      const highVarianceCount = group.variances.filter(v => Math.abs(v) > 25).length;

      summaries.push({
        year: parseInt(group.year),
        severity_category: group.severity_category,
        claim_count: group.count,
        total_actual_settlement: Math.round(group.totalActual),
        total_predicted_settlement: Math.round(group.totalPredicted),
        avg_actual_settlement: Math.round(group.totalActual / group.count),
        avg_predicted_settlement: Math.round(group.totalPredicted / group.count),
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        avg_settlement_days: Math.round(group.totalDays / group.count),
        overprediction_count: overpredictionCount,
        underprediction_count: underpredictionCount,
        high_variance_count: highVarianceCount,
      });
    });

    return summaries.sort((a, b) => a.year - b.year);
  }
}

class CountyYearAggregator {
  constructor() {
    this.groups = new Map();
  }

  add(claim) {
    const year = extractYear(claim.INCIDENTDATE || claim.CLAIMCLOSEDATE || claim.claim_date);
    const county = claim.COUNTNAME || claim.COUNTYNAME || 'Unknown';
    const state = claim.VENUESTATE || '';
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || claim.VENUE_RATING || 'Unknown';
    const key = `${county}-${state}-${year}-${venueRating}`;

    if (!this.groups.has(key)) {
      this.groups.set(key, {
        county, state, year, venue_rating: venueRating,
        count: 0, totalSettlement: 0, variances: [],
      });
    }

    const group = this.groups.get(key);
    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = parseFloat(claim.VARIANCE_PERCENTAGE) ||
                    parseFloat(claim.variance_pct) ||
                    calculateVariance(actual, predicted);

    group.count++;
    group.totalSettlement += actual;
    group.variances.push(variance);
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group) => {
      const avgVariance = group.variances.reduce((sum, v) => sum + v, 0) / group.count;
      const highVarianceCount = group.variances.filter(v => Math.abs(v) > 25).length;
      const overpredictionCount = group.variances.filter(v => v < -25).length;
      const underpredictionCount = group.variances.filter(v => v > 25).length;

      summaries.push({
        county: group.county,
        state: group.state,
        year: parseInt(group.year),
        venue_rating: group.venue_rating,
        claim_count: group.count,
        total_settlement: Math.round(group.totalSettlement),
        avg_settlement: Math.round(group.totalSettlement / group.count),
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        high_variance_count: highVarianceCount,
        high_variance_pct: parseFloat(((highVarianceCount / group.count) * 100).toFixed(2)),
        overprediction_count: overpredictionCount,
        underprediction_count: underpredictionCount,
      });
    });

    return summaries.sort((a, b) => a.year - b.year || a.county.localeCompare(b.county));
  }
}

class InjuryGroupAggregator {
  constructor() {
    this.groups = new Map();
  }

  add(claim) {
    const injuryGroup = claim.PRIMARY_INJURYGROUP_CODE || 'Unknown';
    const bodyRegion = claim.BODY_REGION || 'Unknown';
    const severity = claim.INJURY_SEVERITY_CATEGORY || claim.CAUTION_LEVEL || 'Unknown';
    const key = `${injuryGroup}-${bodyRegion}-${severity}`;

    if (!this.groups.has(key)) {
      this.groups.set(key, {
        injury_group: injuryGroup, body_region: bodyRegion, severity_category: severity,
        count: 0, totalSettlement: 0, totalPredicted: 0, totalDays: 0, variances: [],
      });
    }

    const group = this.groups.get(key);
    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = parseFloat(claim.VARIANCE_PERCENTAGE) ||
                    parseFloat(claim.variance_pct) ||
                    calculateVariance(actual, predicted);

    group.count++;
    group.totalSettlement += actual;
    group.totalPredicted += predicted;
    group.totalDays += parseFloat(claim.SETTLEMENT_DAYS) || 0;
    group.variances.push(variance);
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group) => {
      const avgVariance = group.variances.reduce((sum, v) => sum + v, 0) / group.count;

      summaries.push({
        injury_group: group.injury_group,
        body_region: group.body_region,
        severity_category: group.severity_category,
        claim_count: group.count,
        avg_settlement: Math.round(group.totalSettlement / group.count),
        avg_predicted: Math.round(group.totalPredicted / group.count),
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        avg_settlement_days: Math.round(group.totalDays / group.count),
        total_settlement: Math.round(group.totalSettlement),
      });
    });

    return summaries.sort((a, b) => b.total_settlement - a.total_settlement);
  }
}

class AdjusterPerformanceAggregator {
  constructor() {
    this.groups = new Map();
  }

  add(claim) {
    const adjuster = claim.ADJUSTERNAME || 'Unknown';

    if (!this.groups.has(adjuster)) {
      this.groups.set(adjuster, {
        adjuster_name: adjuster,
        count: 0, totalActual: 0, totalPredicted: 0, totalDays: 0, variances: [],
      });
    }

    const group = this.groups.get(adjuster);
    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = parseFloat(claim.VARIANCE_PERCENTAGE) ||
                    parseFloat(claim.variance_pct) ||
                    calculateVariance(actual, predicted);

    group.count++;
    group.totalActual += actual;
    group.totalPredicted += predicted;
    group.totalDays += parseFloat(claim.SETTLEMENT_DAYS) || 0;
    group.variances.push(variance);
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group) => {
      const avgVariance = group.variances.reduce((sum, v) => sum + v, 0) / group.count;
      const highVarianceCount = group.variances.filter(v => Math.abs(v) > 25).length;
      const overpredictionCount = group.variances.filter(v => v < -25).length;
      const underpredictionCount = group.variances.filter(v => v > 25).length;

      summaries.push({
        adjuster_name: group.adjuster_name,
        claim_count: group.count,
        avg_actual_settlement: Math.round(group.totalActual / group.count),
        avg_predicted_settlement: Math.round(group.totalPredicted / group.count),
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        high_variance_count: highVarianceCount,
        high_variance_pct: parseFloat(((highVarianceCount / group.count) * 100).toFixed(2)),
        overprediction_count: overpredictionCount,
        underprediction_count: underpredictionCount,
        avg_settlement_days: Math.round(group.totalDays / group.count),
      });
    });

    return summaries.sort((a, b) => b.claim_count - a.claim_count);
  }
}

class VenueAnalysisAggregator {
  constructor() {
    this.groups = new Map();
  }

  add(claim) {
    const venueRating = claim.VENUERATING || claim.VENUERATINGTEXT || claim.VENUE_RATING || 'Unknown';
    const state = claim.VENUESTATE || '';
    const county = claim.COUNTNAME || claim.COUNTYNAME || 'Unknown';
    const key = `${venueRating}-${state}-${county}`;

    if (!this.groups.has(key)) {
      this.groups.set(key, {
        venue_rating: venueRating, state, county,
        count: 0, totalSettlement: 0, totalPredicted: 0, totalVenuePoint: 0, variances: [],
      });
    }

    const group = this.groups.get(key);
    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = parseFloat(claim.VARIANCE_PERCENTAGE) ||
                    parseFloat(claim.variance_pct) ||
                    calculateVariance(actual, predicted);

    group.count++;
    group.totalSettlement += actual;
    group.totalPredicted += predicted;
    group.totalVenuePoint += parseFloat(claim.VENUERATINGPOINT) || 0;
    group.variances.push(variance);
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group) => {
      const avgVariance = group.variances.reduce((sum, v) => sum + v, 0) / group.count;
      const highVarianceCount = group.variances.filter(v => Math.abs(v) > 25).length;

      summaries.push({
        venue_rating: group.venue_rating,
        state: group.state,
        county: group.county,
        claim_count: group.count,
        avg_settlement: Math.round(group.totalSettlement / group.count),
        avg_predicted: Math.round(group.totalPredicted / group.count),
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        avg_venue_rating_point: parseFloat((group.totalVenuePoint / group.count).toFixed(2)),
        high_variance_pct: parseFloat(((highVarianceCount / group.count) * 100).toFixed(2)),
      });
    });

    return summaries.sort((a, b) => b.claim_count - a.claim_count);
  }
}

class VarianceDriversAggregator {
  constructor() {
    this.groups = new Map();
    this.totalClaims = 0;
  }

  add(claim) {
    this.totalClaims++;

    const actual = getActualAmount(claim);
    const predicted = getPredictedAmount(claim);
    const variance = Math.abs(parseFloat(claim.VARIANCE_PERCENTAGE) ||
                             parseFloat(claim.variance_pct) ||
                             calculateVariance(actual, predicted));

    const factors = [
      ['Injury Extent', claim.Injury_Extent],
      ['Treatment Course', claim.Treatment_Course],
      ['Pain Management', claim.Pain_Management],
      ['Physical Therapy', claim.Physical_Therapy],
      ['Vehicle Impact', claim.Vehicle_Impact],
      ['Emergency Treatment', claim.Emergency_Treatment],
      ['Prior Treatment', claim.Prior_Treatment],
      ['Injury Severity', claim.INJURY_SEVERITY_CATEGORY],
      ['Body Region', claim.BODY_REGION],
      ['Consistent Mechanism', claim.Consistent_Mechanism],
      ['Treatment Delays', claim.Treatment_Delays],
    ];

    factors.forEach(([factorName, factorValue]) => {
      if (!factorValue || factorValue === 'Unknown') return;

      const key = `${factorName}::${factorValue}`;

      if (!this.groups.has(key)) {
        this.groups.set(key, {
          factor_name: factorName,
          factor_value: String(factorValue),
          count: 0,
          totalVariance: 0,
        });
      }

      const group = this.groups.get(key);
      group.count++;
      group.totalVariance += variance;
    });
  }

  getSummary() {
    const summaries = [];

    this.groups.forEach((group) => {
      if (group.count < 5) return; // Skip small groups

      const avgVariance = group.totalVariance / group.count;
      const frequency = group.count / this.totalClaims;
      const contributionScore = avgVariance * frequency;

      let correlationStrength = 'Low';
      if (avgVariance > 40) correlationStrength = 'High';
      else if (avgVariance > 25) correlationStrength = 'Medium';

      summaries.push({
        factor_name: group.factor_name,
        factor_value: group.factor_value,
        claim_count: group.count,
        avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
        contribution_score: parseFloat(contributionScore.toFixed(2)),
        correlation_strength: correlationStrength,
      });
    });

    return summaries.sort((a, b) => b.contribution_score - a.contribution_score).slice(0, 30);
  }
}

// ==================== STREAMING PROCESSOR ====================

async function processStreamingCSV() {
  console.log('🚀 Starting streaming CSV processor for large datasets...\n');

  const datPath = path.join(__dirname, 'public', 'dat.csv');

  if (!fs.existsSync(datPath)) {
    console.error('❌ ERROR: dat.csv not found in public folder!');
    process.exit(1);
  }

  // Get file size
  const stats = fs.statSync(datPath);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📁 File: dat.csv (${fileSizeMB} MB)`);
  console.log(`⏱️  Processing with streaming (memory-efficient)...\n`);

  // Initialize aggregators
  const aggregators = {
    yearSeverity: new YearSeverityAggregator(),
    countyYear: new CountyYearAggregator(),
    injuryGroup: new InjuryGroupAggregator(),
    adjusterPerformance: new AdjusterPerformanceAggregator(),
    venueAnalysis: new VenueAnalysisAggregator(),
    varianceDrivers: new VarianceDriversAggregator(),
  };

  let count = 0;

  return new Promise((resolve, reject) => {
    const parser = fs.createReadStream(datPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

    parser.on('data', (claim) => {
      count++;

      // Update all aggregators
      aggregators.yearSeverity.add(claim);
      aggregators.countyYear.add(claim);
      aggregators.injuryGroup.add(claim);
      aggregators.adjusterPerformance.add(claim);
      aggregators.venueAnalysis.add(claim);
      aggregators.varianceDrivers.add(claim);

      // Progress update every 1000 records
      if (count % 1000 === 0) {
        logProgress(count);
      }
    });

    parser.on('end', () => {
      logProgress(count, '✅ Complete!\n');
      console.log('\n');
      resolve({ count, aggregators });
    });

    parser.on('error', reject);
  });
}

// ==================== MAIN EXECUTION ====================

async function main() {
  try {
    startTime = Date.now();

    const { count, aggregators } = await processStreamingCSV();

    console.log(`\n📊 Generating summaries from ${count.toLocaleString()} claims...\n`);

    const yearSeverity = aggregators.yearSeverity.getSummary();
    console.log(`  ✓ Year-Severity Summary: ${yearSeverity.length} records`);

    const countyYear = aggregators.countyYear.getSummary();
    console.log(`  ✓ County-Year Summary: ${countyYear.length} records`);

    const injuryGroup = aggregators.injuryGroup.getSummary();
    console.log(`  ✓ Injury Group Summary: ${injuryGroup.length} records`);

    const adjusterPerformance = aggregators.adjusterPerformance.getSummary();
    console.log(`  ✓ Adjuster Performance: ${adjusterPerformance.length} records`);

    const venueAnalysis = aggregators.venueAnalysis.getSummary();
    console.log(`  ✓ Venue Analysis: ${venueAnalysis.length} records`);

    const varianceDrivers = aggregators.varianceDrivers.getSummary();
    console.log(`  ✓ Variance Drivers: ${varianceDrivers.length} records`);

    console.log('\n💾 Writing aggregated CSV files...\n');
    const publicDir = path.join(__dirname, 'public');

    fs.writeFileSync(path.join(publicDir, 'year_severity_summary.csv'), convertToCSV(yearSeverity));
    console.log('  ✓ year_severity_summary.csv');

    fs.writeFileSync(path.join(publicDir, 'county_year_summary.csv'), convertToCSV(countyYear));
    console.log('  ✓ county_year_summary.csv');

    fs.writeFileSync(path.join(publicDir, 'injury_group_summary.csv'), convertToCSV(injuryGroup));
    console.log('  ✓ injury_group_summary.csv');

    fs.writeFileSync(path.join(publicDir, 'adjuster_performance_summary.csv'), convertToCSV(adjusterPerformance));
    console.log('  ✓ adjuster_performance_summary.csv');

    fs.writeFileSync(path.join(publicDir, 'venue_analysis_summary.csv'), convertToCSV(venueAnalysis));
    console.log('  ✓ venue_analysis_summary.csv');

    fs.writeFileSync(path.join(publicDir, 'variance_drivers_analysis.csv'), convertToCSV(varianceDrivers));
    console.log('  ✓ variance_drivers_analysis.csv');

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = Math.round(count / totalTime);

    console.log('\n✅ All aggregated CSV files generated successfully!');
    console.log(`\n📈 Performance:`);
    console.log(`  • Total claims: ${count.toLocaleString()}`);
    console.log(`  • Processing time: ${totalTime}s`);
    console.log(`  • Rate: ${rate.toLocaleString()} claims/sec`);
    console.log(`  • Memory efficient: ✅ Streaming mode`);
    console.log('\n🎉 Ready to use in dashboard!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
