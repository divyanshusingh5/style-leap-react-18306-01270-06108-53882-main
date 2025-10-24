import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to select value based on weights
function weightedRandom(weights) {
  const items = Object.keys(weights);
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= weights[item];
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

// Helper function to select random value from array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Value weights for weighted random selection
const VALUE_WEIGHTS = {
  'Advanced_Pain_Treatment': {'No': 26930, 'Yes': 1011},
  'Causation_Compliance': {'Compliant': 1338076, 'Non-Compliant': 41882},
  'Clinical_Findings': {'No': 497354, 'Yes': 461477, 'Mild': 414, 'Moderate': 258},
  'Cognitive_Symptoms': {'Yes - Alleged': 26079, 'Yes - Diagnosed': 13837},
  'Vehicle_Impact': {'Moderate': 509269, 'Heavy': 343651, 'Minimal': 276613},
  'Emergency_Treatment': {'Yes - Treated & Released': 78571, 'Yes - Treated & Admitted': 5027},
  'Head_Trauma': {'No': 80342, 'Yes': 38824},
  'Injury_Extent': {'Mild': 104894, 'Moderate': 80346, 'Severe': 21062},
  'Movement_Restriction': {'Partial Restriction': 535617, 'No Restriction': 330541, 'Full Restriction': 15682},
  'Nerve_Involvement': {'Yes': 111854, 'No': 56658},
  'Pain_Management': {'RX': 439812, 'OTC': 210252, 'Rx': 176987, 'Single Injection': 36986},
  'Physical_Therapy': {'Yes - Outpatient': 16807, 'Yes': 12456, 'No': 11027, 'Yes - Inpatient': 5364},
  'Prior_Treatment': {'No': 720909, 'No/Non-Factor': 164453, 'Yes - Tx More than 1 Yr': 73427},
  'Treatment_Course': {'Active': 503949, 'Passive': 380651, 'Eval Only': 109996},
  'Treatment_Delays': {'None/Explained': 1094677, 'Delay Only': 163681, 'Gaps Only': 93899, 'Delay and Gaps': 68099},
};

// Categorical values
const CATEGORICAL_VALUES = {
  'Complete_Disability_Duration': ['Less than 1 week', 'Less than 2 Weeks', '1 -3 weeks', '2-4 Weeks', 'More than 8 Weeks'],
  'Concussion_Diagnosis': ['Yes', 'No'],
  'Consciousness_Impact': ['Temp Unconsciousness-Subjective', 'Temp Unconsciousness-Objective', 'Altered'],
  'Dental_Procedure': ['No', 'Yes'],
  'Dental_Treatment': ['Repair', 'Replace'],
  'Dental_Visibility': ['Yes', 'No'],
  'Fixation_Method': ['Open', 'ORIF w/o Hdw Removal', 'Brace', 'Cast w/o Reduction', 'Closed/External'],
  'Immobilization_Used': ['No', 'Yes', 'Brace/Sling', 'Cast'],
  'Injury_Count': ['Single', 'Multiple', 'Two levels', 'Three or more levels'],
  'Injury_Laterality': ['Yes', 'No', 'Unilateral', 'Bilateral'],
  'Injury_Location': ['Cervical', 'Lumbar', 'Thoracic', 'Cervical/Lumbar', 'Cervical/Thoracic/Lumbar'],
  'Injury_Type': ['Contusion Only', 'Herniation', 'Non-Displaced', 'Abrasion Only', 'Fracture'],
  'Mobility_Assistance': ['Crutches/Cane/Walker', 'Scooter/Wheelchair'],
  'Partial_Disability_Duration': ['Less than 1 Week', '1 - 3 weeks', '2-4 Weeks', 'More than 4 weeks'],
  'Physical_Symptoms': ['No', 'Yes', 'Yes - Alleged', 'Yes - Treated'],
  'Recovery_Duration': ['Less than 2 weeks', '2 - 4 weeks', '5 - 12 weeks', 'More than 12 weeks'],
  'Repair_Type': ['Implant', 'Bridge', 'Crown'],
  'Respiratory_Issues': ['No', 'Yes'],
  'Soft_Tissue_Damage': ['Partial Tear w/o Cart Damage', 'Full Tear w/o Cart Damage', 'Cartilage only'],
  'Special_Treatment': ['No', 'Series', 'Single', 'Yes'],
  'Surgical_Intervention': ['No', 'Yes - Arthroscopic', 'Recommended Not Performed', 'Fusion', 'Yes - Open'],
  'Symptom_Timeline': ['Immediate/ER', 'First 48 Hours', '3 - 7 Days', 'More Than 7 Days'],
  'Treatment_Level': ['Non-Invasive', 'Clean & Dress', 'Stitches/Staples', 'Invasive'],
  'Treatment_Period_Considered': ['Less than 6 weeks', '7 - 12 weeks', '3 - 6 months', 'More than 6 months'],
};

// Generate a single claim
function generateClaim(index, year) {
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const claimDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const settlementDays = Math.floor(Math.random() * 730) + 30;
  const settlementMonths = Math.round(settlementDays / 30);
  const settlementYears = settlementMonths / 12;

  const dollarAmount = Math.floor(Math.random() * 150000) + 2500;
  const predictedAmount = dollarAmount * (0.7 + Math.random() * 0.6);
  const variancePct = ((dollarAmount - predictedAmount) / predictedAmount) * 100;

  const severityScore = Math.random() * 10;
  const cautionLevel = severityScore > 7 ? 'High' : severityScore > 4 ? 'Medium' : 'Low';

  const counties = ['Los Angeles', 'San Francisco', 'San Diego', 'Orange', 'Sacramento', 'Alameda', 'Riverside', 'San Bernardino'];
  const states = ['CA', 'NY', 'TX', 'FL', 'IL'];
  const venueRatings = ['Plaintiff Friendly', 'Neutral', 'Defense Friendly'];
  const adjusters = ['Smith, John', 'Johnson, Sarah', 'Williams, Mike', 'Brown, Lisa', 'Davis, Tom'];
  const injuryGroups = ['Spinal', 'Orthopedic', 'Soft Tissue', 'Head/Brain', 'Multiple'];
  const bodyParts = ['Back', 'Neck', 'Knee', 'Shoulder', 'Head'];
  const injuries = ['Strain/Sprain', 'Fracture', 'Contusion', 'Laceration', 'Herniated Disc'];

  const claim = {
    claim_id: `CLM-${year}-${String(index).padStart(6, '0')}`,
    VERSIONID: 1,
    claim_date: claimDate,
    DURATIONTOREPORT: Math.floor(Math.random() * 30) + 1,
    DOLLARAMOUNTHIGH: dollarAmount,
    ALL_BODYPARTS: randomChoice(bodyParts),
    ALL_INJURIES: randomChoice(injuries),
    ALL_INJURYGROUP_CODES: randomChoice(injuryGroups),
    ALL_INJURYGROUP_TEXTS: randomChoice(injuryGroups),
    PRIMARY_INJURY: randomChoice(injuries),
    PRIMARY_BODYPART: randomChoice(bodyParts),
    PRIMARY_INJURYGROUP_CODE: randomChoice(injuryGroups),
    INJURY_COUNT: Math.floor(Math.random() * 5) + 1,
    BODYPART_COUNT: Math.floor(Math.random() * 4) + 1,
    INJURYGROUP_COUNT: Math.floor(Math.random() * 3) + 1,
    SETTLEMENT_DAYS: settlementDays,
    SETTLEMENT_MONTHS: settlementMonths,
    SETTLEMENT_YEARS: parseFloat(settlementYears.toFixed(2)),
    IMPACT: Math.floor(Math.random() * 3) + 1,
    COUNTYNAME: randomChoice(counties),
    VENUESTATE: randomChoice(states),
    VENUE_RATING: randomChoice(venueRatings),
    RATINGWEIGHT: Math.random() * 2 - 1,
    INJURY_GROUP_CODE: randomChoice(injuryGroups),
    CAUSATION__HIGH_RECOMMENDATION: Math.random(),
    SEVERITY_SCORE: parseFloat(severityScore.toFixed(2)),
    CAUTION_LEVEL: cautionLevel,
    adjuster: randomChoice(adjusters),
    predicted_pain_suffering: parseFloat(predictedAmount.toFixed(2)),
    variance_pct: parseFloat(variancePct.toFixed(2)),
    causation_probability: parseFloat(Math.random().toFixed(3)),
    causation_tx_delay: parseFloat(Math.random().toFixed(3)),
    causation_tx_gaps: parseFloat(Math.random().toFixed(3)),
    causation_compliance: parseFloat(Math.random().toFixed(3)),
    severity_allowed_tx_period: parseFloat(Math.random().toFixed(3)),
    severity_initial_tx: parseFloat(Math.random().toFixed(3)),
    severity_injections: parseFloat(Math.random().toFixed(3)),
    severity_objective_findings: parseFloat(Math.random().toFixed(3)),
    severity_pain_mgmt: parseFloat(Math.random().toFixed(3)),
    severity_type_tx: parseFloat(Math.random().toFixed(3)),
    severity_injury_site: parseFloat(Math.random().toFixed(3)),
    severity_code: parseFloat(Math.random().toFixed(3)),
    Advanced_Pain_Treatment: weightedRandom(VALUE_WEIGHTS.Advanced_Pain_Treatment),
    Causation_Compliance: weightedRandom(VALUE_WEIGHTS.Causation_Compliance),
    Clinical_Findings: weightedRandom(VALUE_WEIGHTS.Clinical_Findings),
    Cognitive_Symptoms: Math.random() > 0.95 ? weightedRandom(VALUE_WEIGHTS.Cognitive_Symptoms) : '',
    Complete_Disability_Duration: Math.random() > 0.97 ? randomChoice(CATEGORICAL_VALUES.Complete_Disability_Duration) : '',
    Concussion_Diagnosis: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Concussion_Diagnosis) : '',
    Consciousness_Impact: Math.random() > 0.98 ? randomChoice(CATEGORICAL_VALUES.Consciousness_Impact) : '',
    Consistent_Mechanism: Math.random() > 0.15 ? 'Consistent' : Math.random() > 0.2 ? 'Questionable' : 'Highly Unlikely',
    Dental_Procedure: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Dental_Procedure) : '',
    Emergency_Treatment: Math.random() > 0.94 ? weightedRandom(VALUE_WEIGHTS.Emergency_Treatment) : '',
    Fixation_Method: Math.random() > 0.97 ? randomChoice(CATEGORICAL_VALUES.Fixation_Method) : '',
    Head_Trauma: Math.random() > 0.91 ? weightedRandom(VALUE_WEIGHTS.Head_Trauma) : '',
    Immobilization_Used: Math.random() > 0.77 ? randomChoice(CATEGORICAL_VALUES.Immobilization_Used) : '',
    Injury_Count: randomChoice(CATEGORICAL_VALUES.Injury_Count),
    Injury_Extent: weightedRandom(VALUE_WEIGHTS.Injury_Extent),
    Injury_Laterality: randomChoice(CATEGORICAL_VALUES.Injury_Laterality),
    Injury_Location: randomChoice(CATEGORICAL_VALUES.Injury_Location),
    Injury_Type: randomChoice(CATEGORICAL_VALUES.Injury_Type),
    Mobility_Assistance: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Mobility_Assistance) : '',
    Movement_Restriction: weightedRandom(VALUE_WEIGHTS.Movement_Restriction),
    Nerve_Involvement: weightedRandom(VALUE_WEIGHTS.Nerve_Involvement),
    Pain_Management: weightedRandom(VALUE_WEIGHTS.Pain_Management),
    Partial_Disability_Duration: Math.random() > 0.98 ? randomChoice(CATEGORICAL_VALUES.Partial_Disability_Duration) : '',
    Physical_Symptoms: randomChoice(CATEGORICAL_VALUES.Physical_Symptoms),
    Physical_Therapy: weightedRandom(VALUE_WEIGHTS.Physical_Therapy),
    Prior_Treatment: weightedRandom(VALUE_WEIGHTS.Prior_Treatment),
    Recovery_Duration: randomChoice(CATEGORICAL_VALUES.Recovery_Duration),
    Repair_Type: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Repair_Type) : '',
    Respiratory_Issues: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Respiratory_Issues) : '',
    Soft_Tissue_Damage: Math.random() > 0.96 ? randomChoice(CATEGORICAL_VALUES.Soft_Tissue_Damage) : '',
    Special_Treatment: Math.random() > 0.99 ? randomChoice(CATEGORICAL_VALUES.Special_Treatment) : '',
    Surgical_Intervention: Math.random() > 0.96 ? randomChoice(CATEGORICAL_VALUES.Surgical_Intervention) : '',
    Symptom_Timeline: randomChoice(CATEGORICAL_VALUES.Symptom_Timeline),
    Treatment_Compliance: '',
    Treatment_Course: weightedRandom(VALUE_WEIGHTS.Treatment_Course),
    Treatment_Delays: weightedRandom(VALUE_WEIGHTS.Treatment_Delays),
    Treatment_Level: randomChoice(CATEGORICAL_VALUES.Treatment_Level),
    Treatment_Period_Considered: randomChoice(CATEGORICAL_VALUES.Treatment_Period_Considered),
    Vehicle_Impact: weightedRandom(VALUE_WEIGHTS.Vehicle_Impact),
  };

  return claim;
}

// Generate dataset
function generateClaimsDataset(count) {
  const claims = [];
  const years = [2023, 2024, 2025];

  for (let i = 0; i < count; i++) {
    const year = randomChoice(years);
    claims.push(generateClaim(i + 1, year));
  }

  return claims;
}

// Convert to CSV
function convertToCSV(claims) {
  if (claims.length === 0) return '';

  const headers = Object.keys(claims[0]);
  const csvLines = [headers.join(',')];

  for (const claim of claims) {
    const values = headers.map(header => {
      const value = claim[header];
      if (value === null || value === undefined || value === '') return '';

      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

// Create aggregated summaries
function createAggregatedSummaries(claims) {
  // Year-Severity Summary
  const yearSeverityMap = new Map();
  claims.forEach(claim => {
    const year = new Date(claim.claim_date).getFullYear();
    const key = `${year}-${claim.CAUTION_LEVEL}`;

    if (!yearSeverityMap.has(key)) {
      yearSeverityMap.set(key, {
        year, caution_level: claim.CAUTION_LEVEL, count: 0,
        total_settlement: 0, total_predicted: 0, total_days: 0,
      });
    }

    const summary = yearSeverityMap.get(key);
    summary.count++;
    summary.total_settlement += claim.DOLLARAMOUNTHIGH;
    summary.total_predicted += claim.predicted_pain_suffering;
    summary.total_days += claim.SETTLEMENT_DAYS;
  });

  const yearSeveritySummary = Array.from(yearSeverityMap.values()).map(s => ({
    year: s.year,
    caution_level: s.caution_level,
    claim_count: s.count,
    avg_settlement: Math.round(s.total_settlement / s.count),
    avg_predicted: Math.round(s.total_predicted / s.count),
    avg_days: Math.round(s.total_days / s.count),
    total_settlement: s.total_settlement,
  }));

  // County-Year Summary
  const countyYearMap = new Map();
  claims.forEach(claim => {
    const year = new Date(claim.claim_date).getFullYear();
    const key = `${claim.COUNTYNAME}-${year}`;

    if (!countyYearMap.has(key)) {
      countyYearMap.set(key, {
        county: claim.COUNTYNAME, year, count: 0,
        total_settlement: 0, high_variance_count: 0,
      });
    }

    const summary = countyYearMap.get(key);
    summary.count++;
    summary.total_settlement += claim.DOLLARAMOUNTHIGH;
    if (Math.abs(claim.variance_pct) > 25) summary.high_variance_count++;
  });

  const countyYearSummary = Array.from(countyYearMap.values()).map(s => ({
    county: s.county,
    year: s.year,
    claim_count: s.count,
    total_settlement: s.total_settlement,
    avg_settlement: Math.round(s.total_settlement / s.count),
    high_variance_pct: Math.round((s.high_variance_count / s.count) * 100),
  }));

  // Injury Type Summary
  const injuryTypeMap = new Map();
  claims.forEach(claim => {
    const key = claim.INJURY_GROUP_CODE;
    if (!injuryTypeMap.has(key)) {
      injuryTypeMap.set(key, {
        injury_group: key, count: 0, total_settlement: 0, total_days: 0,
      });
    }

    const summary = injuryTypeMap.get(key);
    summary.count++;
    summary.total_settlement += claim.DOLLARAMOUNTHIGH;
    summary.total_days += claim.SETTLEMENT_DAYS;
  });

  const injuryTypeSummary = Array.from(injuryTypeMap.values()).map(s => ({
    injury_group: s.injury_group,
    claim_count: s.count,
    avg_settlement: Math.round(s.total_settlement / s.count),
    avg_days_to_settlement: Math.round(s.total_days / s.count),
    total_settlement: s.total_settlement,
  }));

  // Treatment Summary
  const treatmentMap = new Map();
  claims.forEach(claim => {
    if (!claim.Treatment_Course) return;
    const key = claim.Treatment_Course;

    if (!treatmentMap.has(key)) {
      treatmentMap.set(key, {
        treatment_course: key, count: 0, total_settlement: 0, total_severity: 0,
      });
    }

    const summary = treatmentMap.get(key);
    summary.count++;
    summary.total_settlement += claim.DOLLARAMOUNTHIGH;
    summary.total_severity += claim.SEVERITY_SCORE;
  });

  const treatmentSummary = Array.from(treatmentMap.values()).map(s => ({
    treatment_course: s.treatment_course,
    claim_count: s.count,
    avg_settlement: Math.round(s.total_settlement / s.count),
    avg_severity_score: (s.total_severity / s.count).toFixed(2),
    total_settlement: s.total_settlement,
  }));

  return { yearSeveritySummary, countyYearSummary, injuryTypeSummary, treatmentSummary };
}

// Main execution
console.log('Generating claims dataset...');
const claims = generateClaimsDataset(1000);

console.log('Converting to CSV format...');
const mainCsv = convertToCSV(claims);

console.log('Creating aggregated summaries...');
const summaries = createAggregatedSummaries(claims);

// Write files
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Writing CSV files...');
fs.writeFileSync(path.join(publicDir, 'dat.csv'), mainCsv);
console.log('✓ Created public/dat.csv');

fs.writeFileSync(path.join(publicDir, 'year_severity_summary.csv'), convertToCSV(summaries.yearSeveritySummary));
console.log('✓ Created public/year_severity_summary.csv');

fs.writeFileSync(path.join(publicDir, 'county_year_summary.csv'), convertToCSV(summaries.countyYearSummary));
console.log('✓ Created public/county_year_summary.csv');

fs.writeFileSync(path.join(publicDir, 'injury_type_summary.csv'), convertToCSV(summaries.injuryTypeSummary));
console.log('✓ Created public/injury_type_summary.csv');

fs.writeFileSync(path.join(publicDir, 'treatment_summary.csv'), convertToCSV(summaries.treatmentSummary));
console.log('✓ Created public/treatment_summary.csv');

console.log('\n✓ All CSV files generated successfully!');
console.log(`\nTotal claims: ${claims.length}`);
console.log(`Year-Severity records: ${summaries.yearSeveritySummary.length}`);
console.log(`County-Year records: ${summaries.countyYearSummary.length}`);
console.log(`Injury Type records: ${summaries.injuryTypeSummary.length}`);
console.log(`Treatment records: ${summaries.treatmentSummary.length}`);
