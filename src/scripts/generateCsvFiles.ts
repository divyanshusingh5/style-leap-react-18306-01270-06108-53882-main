import {
  generateClaimsDataset,
  convertToCSV,
  createAggregatedSummaries
} from '../utils/generateAggregatedData';

// Generate main claims dataset
console.log('Generating claims dataset...');
const claims = generateClaimsDataset(1000); // Generate 1000 sample claims

// Convert to CSV
console.log('Converting to CSV format...');
const mainCsv = convertToCSV(claims);

// Create aggregated summaries
console.log('Creating aggregated summaries...');
const summaries = createAggregatedSummaries(claims);

// Convert summaries to CSV
const yearSeverityCsv = convertToCSV(summaries.yearSeveritySummary);
const countyYearCsv = convertToCSV(summaries.countyYearSummary);
const injuryTypeCsv = convertToCSV(summaries.injuryTypeSummary);
const treatmentCsv = convertToCSV(summaries.treatmentSummary);

// Output the CSVs
console.log('=== MAIN CLAIMS DATA (dat.csv) ===');
console.log(`Total records: ${claims.length}`);
console.log(`First 5 lines preview:`);
console.log(mainCsv.split('\n').slice(0, 6).join('\n'));

console.log('\n=== YEAR-SEVERITY SUMMARY (year_severity_summary.csv) ===');
console.log(`Total records: ${summaries.yearSeveritySummary.length}`);
console.log(yearSeverityCsv);

console.log('\n=== COUNTY-YEAR SUMMARY (county_year_summary.csv) ===');
console.log(`Total records: ${summaries.countyYearSummary.length}`);
console.log(countyYearCsv);

console.log('\n=== INJURY TYPE SUMMARY (injury_type_summary.csv) ===');
console.log(`Total records: ${summaries.injuryTypeSummary.length}`);
console.log(injuryTypeCsv);

console.log('\n=== TREATMENT SUMMARY (treatment_summary.csv) ===');
console.log(`Total records: ${summaries.treatmentSummary.length}`);
console.log(treatmentCsv);

// Export for use in Node.js
export { mainCsv, yearSeverityCsv, countyYearCsv, injuryTypeCsv, treatmentCsv };
