# Data Structure Documentation

## Overview

This dashboard now uses a **categorical data structure** instead of granular numeric codes. The data has been restructured to use meaningful categorical values that are easier to understand and analyze.

## Main Data Files

### 1. `dat.csv` - Main Claims Dataset
The primary dataset containing detailed claim information with **1000 sample records** (expandable).

#### Key Changes from Previous Structure:
- **Categorical Clinical Fields**: All clinical factors now use descriptive categories instead of numeric codes
- **Weighted Distribution**: Values are distributed based on real-world frequencies
- **Complete Coverage**: All 40+ clinical categorical fields are included

#### Column Categories:

**Core Identifiers:**
- `claim_id`: Unique claim identifier (CLM-YYYY-NNNNNN)
- `VERSIONID`: Version number
- `claim_date`: Date of claim (YYYY-MM-DD)
- `DURATIONTOREPORT`: Days to report claim

**Financial Data:**
- `DOLLARAMOUNTHIGH`: Actual settlement amount
- `predicted_pain_suffering`: Model predicted amount
- `variance_pct`: Percentage variance between actual and predicted

**Injury Classification:**
- `ALL_BODYPARTS`: All affected body parts
- `ALL_INJURIES`: All injuries
- `PRIMARY_INJURY`: Primary injury type
- `PRIMARY_BODYPART`: Primary affected body part
- `INJURY_GROUP_CODE`: Primary injury group (Spinal, Orthopedic, Soft Tissue, Head/Brain, Multiple)
- `INJURY_COUNT`: Number of injuries (numeric)
- `BODYPART_COUNT`: Number of body parts affected (numeric)

**Settlement Timing:**
- `SETTLEMENT_DAYS`: Days to settlement
- `SETTLEMENT_MONTHS`: Months to settlement
- `SETTLEMENT_YEARS`: Years to settlement

**Geographic & Venue:**
- `COUNTYNAME`: County name
- `VENUESTATE`: State code
- `VENUE_RATING`: Venue rating (Plaintiff Friendly, Neutral, Defense Friendly)
- `RATINGWEIGHT`: Venue weight score (-1 to 1)

**Classification Scores:**
- `SEVERITY_SCORE`: Severity score (0-10)
- `CAUTION_LEVEL`: Risk level (Low, Medium, High)
- `CAUSATION__HIGH_RECOMMENDATION`: Causation recommendation score

**Business Data:**
- `adjuster`: Assigned adjuster name

**Causation Factors (Numeric 0-1):**
- `causation_probability`
- `causation_tx_delay`
- `causation_tx_gaps`
- `causation_compliance`

**Severity Factors (Numeric 0-1):**
- `severity_allowed_tx_period`
- `severity_initial_tx`
- `severity_injections`
- `severity_objective_findings`
- `severity_pain_mgmt`
- `severity_type_tx`
- `severity_injury_site`
- `severity_code`

**Categorical Clinical Fields (40+ fields):**

See the full list in [Column Mapping](#column-mapping) section below.

---

### 2. `year_severity_summary.csv` - Year-Severity Aggregations
Pre-aggregated summary by **Year × Severity Level** for optimized dashboard performance.

**Columns:**
- `year`: Year (2023, 2024, 2025)
- `caution_level`: Severity level (Low, Medium, High)
- `claim_count`: Number of claims in this category
- `avg_settlement`: Average settlement amount
- `avg_predicted`: Average predicted amount
- `avg_days`: Average days to settlement
- `total_settlement`: Total settlement amount for this category

**Use Case:**
- Display yearly trends by severity
- Quick KPI calculations
- Year-over-year comparisons

**Sample Records:** ~9 records (3 years × 3 severity levels)

---

### 3. `county_year_summary.csv` - County-Year Aggregations
Pre-aggregated summary by **County × Year** for geographic analysis.

**Columns:**
- `county`: County name
- `year`: Year
- `claim_count`: Number of claims
- `total_settlement`: Total settlement amount
- `avg_settlement`: Average settlement amount
- `high_variance_pct`: Percentage of claims with >25% variance

**Use Case:**
- Regional trend analysis
- County performance comparison
- Identify high-risk counties

**Sample Records:** ~24 records (8 counties × 3 years)

---

### 4. `injury_type_summary.csv` - Injury Type Aggregations
Pre-aggregated summary by **Injury Group**.

**Columns:**
- `injury_group`: Injury group name (Spinal, Orthopedic, Soft Tissue, Head/Brain, Multiple)
- `claim_count`: Number of claims
- `avg_settlement`: Average settlement amount
- `avg_days_to_settlement`: Average days to resolution
- `total_settlement`: Total settlement amount

**Use Case:**
- Injury type analysis
- Compare settlement patterns by injury
- Treatment duration by injury type

**Sample Records:** ~5 records (one per injury group)

---

### 5. `treatment_summary.csv` - Treatment Course Aggregations
Pre-aggregated summary by **Treatment Course**.

**Columns:**
- `treatment_course`: Treatment type (Active, Passive, Eval Only, None/Ice/Rest, etc.)
- `claim_count`: Number of claims
- `avg_settlement`: Average settlement amount
- `avg_severity_score`: Average severity score
- `total_settlement`: Total settlement amount

**Use Case:**
- Treatment effectiveness analysis
- Cost by treatment type
- Severity correlation with treatment

**Sample Records:** ~3-8 records (one per treatment course)

---

## Column Mapping

### Categorical Clinical Fields

All categorical fields now use descriptive values instead of numeric codes:

#### Treatment & Care
- **Advanced_Pain_Treatment**: `No`, `Yes`
- **Pain_Management**: `RX`, `OTC`, `Rx`, `Single Injection`, `Multiple Injections`, `Single Epidural`, etc.
- **Physical_Therapy**: `Yes - Outpatient`, `Yes - Inpatient`, `Yes`, `No`
- **Surgical_Intervention**: `No`, `Yes - Arthroscopic`, `Yes - Open`, `Fusion`, `Discectomy`, etc.
- **Treatment_Course**: `Active`, `Passive`, `Eval Only`, `None/Ice/Rest`
- **Treatment_Level**: `Non-Invasive`, `Invasive`, `Clean & Dress`, `Stitches/Staples`, etc.
- **Treatment_Period_Considered**: `Less than 6 weeks`, `7 - 12 weeks`, `3 - 6 months`, etc.

#### Injury Details
- **Injury_Extent**: `Mild`, `Moderate`, `Severe`, `Minor`, `Major`
- **Injury_Location**: `Cervical`, `Lumbar`, `Thoracic`, `Cervical/Lumbar`, etc.
- **Injury_Type**: `Contusion Only`, `Herniation`, `Non-Displaced`, `Fracture`, etc.
- **Injury_Laterality**: `Yes`, `No`, `Unilateral`, `Bilateral`
- **Injury_Count**: `Single`, `Multiple`, `Two levels`, `Three or more levels`

#### Clinical Findings
- **Clinical_Findings**: `No`, `Yes`, `Mild`, `Moderate`
- **Nerve_Involvement**: `Yes`, `No`
- **Soft_Tissue_Damage**: `Partial Tear w/o Cart Damage`, `Full Tear w/ Cart Damage`, etc.

#### Trauma & Emergency
- **Head_Trauma**: `Yes`, `No`
- **Emergency_Treatment**: `Yes - Treated & Released`, `Yes - Treated & Admitted`
- **Consciousness_Impact**: `Temp Unconsciousness-Subjective`, `Temp Unconsciousness-Objective`, `Altered`
- **Concussion_Diagnosis**: `Yes`, `No`

#### Symptoms & Timeline
- **Physical_Symptoms**: `No`, `Yes`, `Yes - Alleged`, `Yes - Treated`, `Mild`, `Moderate`, `Severe`
- **Cognitive_Symptoms**: `Yes - Alleged`, `Yes - Diagnosed`
- **Symptom_Timeline**: `Immediate/ER`, `First 48 Hours`, `3 - 7 Days`, `More Than 7 Days`, etc.
- **Recovery_Duration**: `Less than 2 weeks`, `2 - 4 weeks`, `5 - 12 weeks`, etc.

#### Disability & Mobility
- **Complete_Disability_Duration**: `Less than 1 week`, `1-3 weeks`, `2-4 Weeks`, etc.
- **Partial_Disability_Duration**: `Less than 1 Week`, `1 - 3 weeks`, `More than 4 weeks`, etc.
- **Movement_Restriction**: `Partial Restriction`, `No Restriction`, `Full Restriction`, etc.
- **Mobility_Assistance**: `Crutches/Cane/Walker`, `Scooter/Wheelchair`, etc.
- **Immobilization_Used**: `No`, `Yes`, `Brace/Sling`, `Cast`, `Brace/Boot`

#### Causation & Compliance
- **Causation_Compliance**: `Compliant`, `Non-Compliant`
- **Consistent_Mechanism**: `Consistent`, `Questionable`, `Highly Unlikely`
- **Treatment_Delays**: `None/Explained`, `Delay Only`, `Gaps Only`, `Delay and Gaps`
- **Prior_Treatment**: `No`, `No/Non-Factor`, `Yes - Tx More than 1 Yr`, etc.

#### Specialized Treatment
- **Fixation_Method**: `Open`, `ORIF w/o Hdw Removal`, `Brace`, `Cast w/o Reduction`, etc.
- **Dental_Procedure**: `No`, `Yes`
- **Dental_Treatment**: `Repair`, `Replace`
- **Dental_Visibility**: `Yes`, `No`
- **Repair_Type**: `Implant`, `Bridge`, `Crown`, `Filling/Bonding`
- **Respiratory_Issues**: `No`, `Yes`
- **Special_Treatment**: `No`, `Series`, `Single`, `Yes`, `Partial`

#### Impact
- **Vehicle_Impact**: `Minimal`, `Moderate`, `Heavy`

---

## How to Use the Data

### Loading Main Dataset
```typescript
import { loadCsvData } from '@/utils/loadCsvData';

const claims = await loadCsvData();
```

### Loading Aggregated Summaries
```typescript
import {
  loadAllAggregatedData,
  loadYearSeveritySummary,
  loadCountyYearSummary
} from '@/utils/loadAggregatedData';

// Load all at once
const aggregatedData = await loadAllAggregatedData();

// Or load individually
const yearSeverity = await loadYearSeveritySummary();
const countyYear = await loadCountyYearSummary();
```

### Performance Optimization

For large datasets (10,000+ records):

1. **Use Aggregated Summaries for Overview Dashboards**
   - Use `year_severity_summary.csv` for KPIs and trends
   - Load full `dat.csv` only when drilling down into details

2. **Implement Lazy Loading**
   - Load aggregated data first for quick initial render
   - Load full dataset in background

3. **Use Memoization**
   - The existing `useClaimsData` hook already implements memoization
   - Add similar patterns for aggregated data

4. **Consider Pagination**
   - For tables showing detailed claims, implement pagination
   - Show 50-100 records per page

### Example: Using Aggregated Data for KPIs

```typescript
import { loadYearSeveritySummary } from '@/utils/loadAggregatedData';

function DashboardKPIs() {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    loadYearSeveritySummary().then(data => {
      setSummaries(data);
    });
  }, []);

  const totalClaims = summaries.reduce((sum, s) => sum + s.claim_count, 0);
  const avgSettlement = summaries.reduce((sum, s) =>
    sum + (s.avg_settlement * s.claim_count), 0) / totalClaims;

  return (
    <div>
      <KPICard title="Total Claims" value={totalClaims} />
      <KPICard title="Avg Settlement" value={formatCurrency(avgSettlement)} />
    </div>
  );
}
```

---

## Regenerating Sample Data

To regenerate the CSV files with different parameters:

```bash
# Generate 1000 claims (default)
node generate-csvs.mjs

# To change the number of claims, edit the script:
# Open generate-csvs.mjs
# Change: const claims = generateClaimsDataset(1000);
# To: const claims = generateClaimsDataset(5000); // or any number
```

### Customizing Data Generation

Edit `generate-csvs.mjs` to customize:

1. **Years**: Change the `years` array
2. **Counties**: Modify the `counties` array
3. **Adjusters**: Update the `adjusters` array
4. **Value Weights**: Adjust `VALUE_WEIGHTS` for different distributions
5. **Probability Thresholds**: Change `Math.random() > X` checks to make fields more/less common

---

## Column Mapping Reference

Mapping between old granular columns and new categorical columns:

| Old Column | New Column | Type |
|------------|------------|------|
| `IMPACT` (1-3) | `Vehicle_Impact` (Minimal/Moderate/Heavy) | Categorical |
| `causation_compliance` (0-1) | `Causation_Compliance` (Compliant/Non-Compliant) | Categorical |
| `causation_tx_delay` (0-1) | `Treatment_Delays` | Categorical |
| `causation_tx_gaps` (0-1) | `Treatment_Delays` | Categorical |
| `severity_allowed_tx_period` (0-1) | `Treatment_Period_Considered` | Categorical |
| `severity_initial_tx` (0-1) | `Treatment_Course` | Categorical |
| `severity_injections` (0-1) | `Pain_Management` | Categorical |
| `severity_objective_findings` (0-1) | `Clinical_Findings` | Categorical |
| `severity_pain_mgmt` (0-1) | `Pain_Management` | Categorical |
| `severity_type_tx` (0-1) | `Treatment_Course` | Categorical |

**Note:** Numeric factor columns are kept for model calculations, while categorical columns provide interpretable values for analysis.

---

## Benefits of New Structure

1. **Readability**: Categories are self-explanatory (e.g., "Mild" vs. 0.3)
2. **Analysis**: Easier to filter and group by meaningful categories
3. **Performance**: Aggregated summaries reduce processing for overview dashboards
4. **Flexibility**: Easy to add new categories without changing data structure
5. **Distribution Accuracy**: Values follow real-world frequencies from provided data
6. **Scalability**: Aggregated files enable handling of larger datasets (10K+ records)

---

## Migration Notes

### What Changed:
1. ✅ All categorical clinical columns now have meaningful values
2. ✅ 4 new aggregated summary files for performance
3. ✅ New utility functions in `loadAggregatedData.ts`
4. ✅ Column mapping documentation in `columnMapping.ts`
5. ✅ Data generation scripts in `generate-csvs.mjs`

### What Stayed the Same:
1. ✅ All existing column names are preserved
2. ✅ Numeric factor columns (causation_*, severity_*) remain unchanged
3. ✅ Core identifiers and financial data structure unchanged
4. ✅ Existing `loadCsvData.ts` function works without modification
5. ✅ Dashboard components work with minimal changes

### Next Steps:
1. Optionally update dashboard tabs to use aggregated summaries for performance
2. Add filters for new categorical values
3. Create visualizations for categorical distributions
4. Consider implementing lazy loading for large datasets

---

## Questions or Issues?

If you need to:
- Add more categorical values
- Change value distributions
- Create additional aggregated summaries
- Modify data generation logic

Edit the following files:
- `generate-csvs.mjs` - Main data generation script
- `src/utils/columnMapping.ts` - Column mappings and valid values
- `src/utils/generateAggregatedData.ts` - Aggregation logic (TypeScript version)
