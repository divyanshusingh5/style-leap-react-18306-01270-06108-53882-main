# How to Use Your Actual dat.csv Data

## Overview

The dashboard is now configured to dynamically process your actual dat.csv file with all 86 columns and generate aggregated insights, variance analysis, and recommendations based on **real data only** - no dummy or fixed values.

---

## Step 1: Replace dat.csv with Your Actual Data

1. **Locate your actual dat.csv file** with the 86 columns:
   - CLAIMID, EXPSR_NBR, CLAIMCLOSEDATE, CAUSATION_HIGH_RECOMMENDATION, etc.
   - All 40+ categorical clinical fields (Advanced_Pain_Treatment, Causation_Compliance, etc.)

2. **Replace the sample file**:
   ```bash
   # Backup current sample data
   mv public/dat.csv public/dat.csv.sample

   # Copy your actual data
   cp /path/to/your/actual/dat.csv public/dat.csv
   ```

3. **Verify the file**:
   ```bash
   # Check header
   head -n 1 public/dat.csv

   # Count records
   wc -l public/dat.csv
   ```

---

## Step 2: Process Your Data

Run the data processing script to generate all aggregated CSVs:

```bash
node process-data.mjs
```

**This script will:**
1. Read your actual dat.csv
2. Calculate all metrics dynamically from real data:
   - Variance percentages (Actual vs Predicted)
   - Settlement patterns by severity, injury, venue
   - Adjuster performance metrics
   - Variance contribution analysis by factor
3. Generate 6 aggregated CSV files for optimized dashboard performance:
   - `year_severity_summary.csv` - Year × Severity trends
   - `county_year_summary.csv` - Geographic analysis
   - `injury_group_summary.csv` - Injury type patterns
   - `adjuster_performance_summary.csv` - Adjuster metrics
   - `venue_analysis_summary.csv` - Venue impact analysis
   - `variance_drivers_analysis.csv` - Top 30 variance contributors

**Output example:**
```
Reading dat.csv...
Loaded 5247 claims from dat.csv

Generating aggregated summaries...
✓ Year-Severity Summary: 18 records
✓ County-Year Summary: 127 records
✓ Injury Group Summary: 45 records
✓ Adjuster Performance Summary: 23 records
✓ Venue Analysis Summary: 89 records
✓ Variance Drivers Analysis: 30 records

Writing aggregated CSV files...
✓ Created public/year_severity_summary.csv
✓ Created public/county_year_summary.csv
✓ Created public/injury_group_summary.csv
✓ Created public/adjuster_performance_summary.csv
✓ Created public/venue_analysis_summary.csv
✓ Created public/variance_drivers_analysis.csv

✅ All aggregated CSV files generated successfully!
```

---

## Step 3: View Your Dashboard

Start or refresh the development server:

```bash
npm run dev
```

Open: http://localhost:8081

**The dashboard will now display:**
- ✅ Real KPIs from your actual data
- ✅ Dynamic variance analysis
- ✅ Actual settlement patterns
- ✅ Real adjuster performance
- ✅ Genuine variance drivers and recommendations

---

## What Gets Calculated Dynamically

### 1. **Variance Analysis**

**Formula:**
```javascript
Variance % = ((DOLLARAMOUNTHIGH - CAUSATION_HIGH_RECOMMENDATION) / CAUSATION_HIGH_RECOMMENDATION) * 100
```

**Categories:**
- **Overpredicted**: Variance < -25% (Model predicted too high)
- **Underpredicted**: Variance > +25% (Model predicted too low)
- **High Variance**: |Variance| > 25% (Significant deviation)
- **Accurate**: |Variance| ≤ 25%

### 2. **Model Performance Metrics**

Calculated from your actual data:

- **MAPE** (Mean Absolute Percentage Error):
  ```javascript
  MAPE = (Σ |Actual - Predicted| / Actual) / n * 100
  ```

- **RMSE** (Root Mean Square Error):
  ```javascript
  RMSE = √(Σ(Actual - Predicted)² / n)
  ```

- **Accuracy Rates**:
  - Overall accuracy rate (within 25% variance)
  - Accuracy by severity category
  - Accuracy by settlement amount range
  - Overprediction rate
  - Underprediction rate

### 3. **Variance Contribution Analysis**

For each categorical factor, calculates:

```javascript
Contribution Score = Average Variance × Frequency
```

**Factors analyzed:**
- Injury_Extent, Treatment_Course, Pain_Management
- Physical_Therapy, Vehicle_Impact, Emergency_Treatment
- Prior_Treatment, INJURY_SEVERITY_CATEGORY, BODY_REGION
- Consistent_Mechanism, Treatment_Delays
- And more...

**Correlation Strength:**
- **High**: Avg Variance > 40%
- **Medium**: Avg Variance 25-40%
- **Low**: Avg Variance < 25%

### 4. **Aggregations by Dimension**

All aggregations use real data:

**Year × Severity:**
- Total and average actual settlements
- Total and average predicted settlements
- Average variance percentage
- Average settlement days
- Over/underprediction counts

**County × Venue:**
- Settlement totals and averages per county
- Variance patterns by geographic location
- Venue rating impact on settlements
- High variance claim percentages

**Injury Group × Body Region:**
- Settlement amounts by injury type
- Average days to settlement by injury
- Variance patterns by injury severity
- Body region impact analysis

**Adjuster Performance:**
- Claims handled per adjuster
- Average actual vs predicted settlements
- Variance percentages by adjuster
- High variance claim rates
- Over/underprediction tendencies

---

## Dashboard Tab Insights

### **Overview Tab**

**KPIs (All Dynamic):**
- Total Claims: Count from actual data
- Avg Settlement: Mean of DOLLARAMOUNTHIGH
- Avg Days to Settlement: Mean of SETTLEMENT_DAYS
- High Variance %: % of claims with |variance| > 25%
- Overprediction Rate: % of claims with variance < -25%
- Underprediction Rate: % of claims with variance > +25%

**Charts:**
- Actual vs Predicted trend by month
- Variance distribution over time
- Severity distribution pie chart

**Deviation Analysis Table:**
- Top 20 claims with highest variance
- Sorted by absolute variance percentage
- Shows actual, predicted, and variance for each

### **Recommendations Tab**

**Top Variance Drivers:**
- Dynamically calculated contribution scores
- Sorted by impact on overall variance
- Shows:
  - Factor name and value
  - Number of claims affected
  - Average variance percentage
  - Contribution score
  - Correlation strength

**Recommendations Generated:**
- "Review [Factor] = [Value]: affects [N] claims with [X]% avg variance"
- "Consider recalibrating model for [Severity] severity cases"
- "Investigate [County] venue: [X]% high variance rate"

### **Alignment Tab**

**Model vs Actual Analysis:**
- Scatter plot: Predicted vs Actual settlements
- By severity category
- By injury group
- By venue rating
- Identifies systematic over/underprediction patterns

### **Injury Tab**

**Injury Pattern Analysis:**
- Settlement distribution by injury group
- Average variance by injury type
- Body region impact on predictions
- Severity correlation with variance

### **Adjuster Tab**

**Performance Metrics:**
- Claims per adjuster
- Average settlement vs predicted
- Variance percentages
- High variance rates
- Best/worst performing adjusters

### **Venue Tab**

**Geographic Analysis:**
- Settlement patterns by venue rating
- County-level variance analysis
- State comparisons
- Venue rating point impact
- Plaintiff-friendly vs defense-friendly patterns

---

## Key Formulas Used

### Variance Percentage
```javascript
variance_pct = ((actual - predicted) / predicted) × 100
```

### Mean Absolute Percentage Error (MAPE)
```javascript
MAPE = (Σ|actual - predicted| / actual) / n × 100
```

### Root Mean Square Error (RMSE)
```javascript
RMSE = √(Σ(actual - predicted)² / n)
```

### Contribution Score
```javascript
contribution = avg_variance × (group_count / total_count)
```

### Accuracy Rate
```javascript
accuracy = (claims_within_25% / total_claims) × 100
```

---

## Expected Column Mappings

The processing script expects these key columns from your dat.csv:

| Your Column | Used For |
|-------------|----------|
| CLAIMID | Unique identifier |
| DOLLARAMOUNTHIGH | Actual settlement amount |
| SETTLEMENTAMOUNT | Backup for actual amount |
| CAUSATION_HIGH_RECOMMENDATION | Model predicted amount |
| VARIANCE_PERCENTAGE | Pre-calculated variance (if available) |
| SETTLEMENT_DAYS | Days to settlement |
| INCIDENTDATE | Incident date for year extraction |
| CLAIMCLOSEDATE | Close date (backup for year) |
| ADJUSTERNAME | Adjuster assignment |
| COUNTNAME | County name |
| VENUESTATE | State |
| VENUERATING / VENUERATINGTEXT | Venue rating |
| VENUERATINGPOINT | Numeric venue score |
| PRIMARY_INJURYGROUP_CODE | Primary injury type |
| INJURY_SEVERITY_CATEGORY | Severity classification |
| BODY_REGION | Body region affected |
| ACTUAL_SETTLEMENT_CATEGORY | Settlement amount category |
| MODEL_ACCURACY_CATEGORY | Model accuracy classification |
| All 40+ categorical fields | Variance driver analysis |

**Missing columns are handled gracefully:**
- Falls back to alternative columns (e.g., SETTLEMENTAMOUNT if DOLLARAMOUNTHIGH missing)
- Uses 'Unknown' for missing categorical values
- Calculates VARIANCE_PERCENTAGE if not provided
- Extracts year from available date fields

---

## Testing Your Data

### 1. Check Data Quality

After processing, verify the aggregated files:

```bash
# Check year-severity summary
cat public/year_severity_summary.csv

# Check variance drivers
head -20 public/variance_drivers_analysis.csv
```

### 2. Validate Calculations

Open the dashboard and verify:
- KPI numbers make sense (not zeros or NaN)
- Charts display actual data points
- Filters work correctly
- Variance percentages are calculated
- Recommendations are relevant

### 3. Debug Issues

If you see issues:

**No data appearing:**
```bash
# Check if dat.csv loaded correctly
node -e "
const fs = require('fs');
const content = fs.readFileSync('public/dat.csv', 'utf-8');
const lines = content.split('\\n');
console.log('Total lines:', lines.length);
console.log('Header:', lines[0].substring(0, 200));
"
```

**Incorrect calculations:**
- Verify DOLLARAMOUNTHIGH and CAUSATION_HIGH_RECOMMENDATION columns exist
- Check for null/empty values in key columns
- Ensure dates are in valid format (YYYY-MM-DD or similar)

**Missing aggregations:**
- Check that categorical fields have values
- Verify column names match exactly (case-sensitive)
- Ensure grouping fields have valid data

---

## Customizing Aggregations

### Add New Aggregation

Edit `process-data.mjs` to add custom aggregations:

```javascript
function createCustomSummary(claims) {
  // Your custom grouping logic
  const grouped = groupBy(claims, c => c.YOUR_FIELD);

  const summaries = [];
  grouped.forEach((groupClaims, key) => {
    // Calculate metrics
    summaries.push({
      field: key,
      count: groupClaims.length,
      avg_settlement: /* calculate */,
      // ... more metrics
    });
  });

  return summaries;
}

// Add to main execution
const customSummary = createCustomSummary(claims);
fs.writeFileSync(
  path.join(publicDir, 'custom_summary.csv'),
  convertToCSV(customSummary)
);
```

### Modify Variance Threshold

Change the 25% threshold:

```javascript
// In all functions, replace:
variances.filter(v => Math.abs(v) > 25).length

// With your threshold:
variances.filter(v => Math.abs(v) > YOUR_THRESHOLD).length
```

### Add More Variance Drivers

Edit the `categoricalFactors` array in `analyzeVarianceDrivers()`:

```javascript
const categoricalFactors = [
  'Injury_Extent',
  'Treatment_Course',
  // ... existing factors ...
  'YOUR_CUSTOM_FIELD', // Add here
];
```

---

## Performance with Large Datasets

### For 10,000+ Claims

**Processing time:** ~2-5 seconds
**Dashboard load:** Use aggregated CSVs for faster initial load

### For 100,000+ Claims

1. **Process data offline:**
   ```bash
   node process-data.mjs
   ```

2. **Use only aggregated files in dashboard:**
   - Don't load full dat.csv in browser
   - Load aggregated CSVs only
   - Fetch full data on-demand for drill-downs

3. **Add pagination:**
   - Show 100 rows per page in tables
   - Implement virtual scrolling

---

## Summary

✅ **Replace dat.csv** with your actual data (86 columns)

✅ **Run `node process-data.mjs`** to generate aggregations

✅ **Start dashboard** with `npm run dev`

✅ **All insights are calculated dynamically** from your real data:
- No dummy data
- No fixed values
- Real variance analysis
- Actual contribution scores
- Genuine recommendations

**Everything is data-driven and dynamic!**
