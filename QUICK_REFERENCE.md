# Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Add Your Data
```bash
# Place your actual dat.csv (86 columns) in public folder
cp /path/to/your/dat.csv public/dat.csv
```

### 2. Process Data
```bash
# Generate all aggregated CSVs
node process-data.mjs
```

### 3. View Dashboard
```bash
# Start server (if not already running)
npm run dev

# Open: http://localhost:8081
```

---

## 📁 Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `process-data.mjs` | Main processing script | 440 |
| `src/utils/dataProcessor.ts` | TypeScript utilities | 600+ |
| `HOW_TO_USE_YOUR_DATA.md` | Detailed usage guide | Complete |
| `DATA_STRUCTURE.md` | Data reference | Complete |
| `FINAL_SUMMARY.md` | Final summary | Complete |
| `QUICK_REFERENCE.md` | This file | Quick ref |

---

## 📊 Generated Aggregated CSVs

After running `node process-data.mjs`:

| File | Description | Use |
|------|-------------|-----|
| `year_severity_summary.csv` | Year × Severity | KPIs, trends |
| `county_year_summary.csv` | County × Year | Geographic analysis |
| `injury_group_summary.csv` | Injury analysis | Injury patterns |
| `adjuster_performance_summary.csv` | Adjuster metrics | Performance review |
| `venue_analysis_summary.csv` | Venue impact | Venue analysis |
| `variance_drivers_analysis.csv` | Top drivers | Recommendations |

---

## 🧮 Key Formulas

### Variance Percentage
```
Variance % = ((Actual - Predicted) / Predicted) × 100
```

### Contribution Score
```
Contribution = Avg Variance × Frequency
```

### Model Accuracy
```
Accuracy % = (Claims within ±25%) / Total × 100
```

---

## 📋 Required Columns

**Minimum required in your dat.csv:**

✅ `DOLLARAMOUNTHIGH` or `SETTLEMENTAMOUNT`
✅ `CAUSATION_HIGH_RECOMMENDATION`
✅ `SETTLEMENT_DAYS`
✅ `INCIDENTDATE` or `CLAIMCLOSEDATE`
✅ `ADJUSTERNAME`
✅ `COUNTNAME` or `COUNTYNAME`
✅ `VENUESTATE`
✅ `PRIMARY_INJURYGROUP_CODE`

**Optional but recommended:**
- `INJURY_SEVERITY_CATEGORY`
- `BODY_REGION`
- `VENUERATING`
- All 40+ categorical clinical fields

---

## 🎯 Dashboard Tabs

| Tab | Shows | Data Source |
|-----|-------|-------------|
| **Overview** | KPIs, trends, top deviations | dat.csv + year_severity |
| **Recommendations** | Variance drivers, insights | variance_drivers |
| **Alignment** | Model vs actual scatter | dat.csv |
| **Injury** | Injury patterns, variance | injury_group |
| **Adjuster** | Performance metrics | adjuster_performance |
| **Venue** | Geographic patterns | venue_analysis + county_year |

---

## 🔍 Variance Categories

| Range | Category | Model Status |
|-------|----------|--------------|
| < -50% | High Overprediction | Predicted way too high |
| -50% to -25% | Overprediction | Predicted too high |
| -25% to +25% | **Accurate** | ✅ Good prediction |
| +25% to +50% | Underprediction | Predicted too low |
| > +50% | High Underprediction | Predicted way too low |

---

## 🛠️ Common Commands

```bash
# Process data
node process-data.mjs

# Start dev server
npm run dev

# Check CSV structure
head -n 1 public/dat.csv

# Count records
wc -l public/dat.csv

# View aggregated summary
cat public/variance_drivers_analysis.csv | head -10

# Install dependencies
npm install

# Install csv-parse (if needed)
npm install csv-parse
```

---

## 🐛 Quick Troubleshooting

### No variance calculated
**Check:** Column names match (CAUSATION_HIGH_RECOMMENDATION vs predicted_pain_suffering)

### Empty aggregations
**Check:** Grouping fields have data (INJURY_SEVERITY_CATEGORY, COUNTNAME, etc.)

### Dashboard shows no data
**Check:** Run `node process-data.mjs` first

### Processing fails
**Check:** `npm install csv-parse`

---

## 📈 Performance Tips

| Dataset Size | Strategy |
|--------------|----------|
| < 5,000 | Load full dat.csv directly |
| 5K - 10K | Use aggregated CSVs for overview |
| 10K - 50K | Load aggregated first, full on-demand |
| 50K+ | Use only aggregated CSVs |

---

## 🎨 Customization

### Change variance threshold (from 25%)
```javascript
// In process-data.mjs, replace all:
Math.abs(v) > 25

// With:
Math.abs(v) > YOUR_THRESHOLD
```

### Add new variance driver
```javascript
// In analyzeVarianceDrivers():
const categoricalFactors = [
  // ... existing ...
  'YOUR_NEW_FIELD',
];
```

### Create custom aggregation
```javascript
function createCustomSummary(claims) {
  const grouped = groupBy(claims, c => c.YOUR_FIELD);
  // ... your logic
}
```

---

## 📞 Documentation

| Document | When to Read |
|----------|--------------|
| `QUICK_REFERENCE.md` | This file - quick lookup |
| `FINAL_SUMMARY.md` | Complete overview |
| `HOW_TO_USE_YOUR_DATA.md` | Using actual data |
| `DATA_STRUCTURE.md` | Column reference |

---

## ✅ Verification

After processing, check:

```bash
# 1. Files created
ls public/*summary*.csv

# 2. Non-empty files
wc -l public/*.csv

# 3. Valid CSV format
head -5 public/year_severity_summary.csv

# 4. Dashboard accessible
curl http://localhost:8081
```

---

## 🎉 Key Features

✅ **100% Dynamic** - All calculations from real data
✅ **No Fixed Values** - Everything data-driven
✅ **Smart Variance Analysis** - Identifies contributors
✅ **Multiple Column Names** - Handles various formats
✅ **Performance Optimized** - Aggregated summaries
✅ **Comprehensive Insights** - 6 analysis dimensions

---

## 📞 Support

**Issue:** Something not working?

1. Check `FINAL_SUMMARY.md` troubleshooting section
2. Verify your dat.csv has required columns
3. Run `node process-data.mjs` and check for errors
4. Check browser console (F12) for errors

---

## 🔄 Typical Workflow

```
1. Get actual dat.csv (86 columns)
   ↓
2. Place in public/dat.csv
   ↓
3. Run: node process-data.mjs
   ↓
4. Verify: 6 CSV files created
   ↓
5. Start: npm run dev
   ↓
6. Open: http://localhost:8081
   ↓
7. Review all 6 tabs
   ↓
8. Analyze variance drivers
   ↓
9. Implement recommendations
```

---

**Ready to go! 🚀**

Run `node process-data.mjs` with your actual data to see dynamic insights!
