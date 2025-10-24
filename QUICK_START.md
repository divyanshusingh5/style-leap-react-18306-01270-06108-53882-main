# Quick Start Guide

## Your Dashboard is Ready! 🎉

Your insurance claims dashboard has been upgraded with categorical data and performance optimizations.

---

## What's New

### ✅ Generated Files

5 CSV files have been created in the `/public` folder:

1. **dat.csv** (542 KB) - 1,000 sample claims with categorical data
2. **year_severity_summary.csv** - 9 aggregated records
3. **county_year_summary.csv** - 24 aggregated records
4. **injury_type_summary.csv** - 5 aggregated records
5. **treatment_summary.csv** - 3 aggregated records

### ✅ New Utilities

Created helper functions and hooks:

- `src/utils/columnMapping.ts` - Categorical value definitions
- `src/utils/generateAggregatedData.ts` - Data generation logic
- `src/utils/loadAggregatedData.ts` - Load aggregated CSVs
- `src/hooks/useAggregatedData.ts` - React hooks for aggregated data
- `generate-csvs.mjs` - Script to regenerate CSV files

### ✅ Documentation

- `DATA_STRUCTURE.md` - Complete data structure reference
- `README_DATA_MIGRATION.md` - Migration summary and details
- `QUICK_START.md` - This file

---

## Test Your Dashboard

### 1. View the Dashboard

The dev server is already running!

**Open in your browser:**
- Local: http://localhost:8081
- Network: http://192.168.1.11:8081

### 2. What to Check

✅ **Data Loads Successfully**
- No errors in browser console (F12)
- Claims data appears in tables/charts
- KPI cards show values

✅ **Filters Work**
- Try selecting different counties
- Filter by severity level
- Change year selections

✅ **Charts Render**
- Actual vs Predicted chart shows data
- Variance trend chart displays
- Severity distribution pie chart works

✅ **All Tabs Function**
- Overview tab
- Recommendations tab
- Alignment tab
- Injury tab
- Adjuster tab
- Venue tab

---

## Common Tasks

### Regenerate CSV Files

To create new sample data:

```bash
node generate-csvs.mjs
```

The script will:
- Generate 1,000 sample claims (customizable)
- Create 4 aggregated summary files
- Save all files to `/public` folder

### Change Number of Records

Edit `generate-csvs.mjs` line 165:

```javascript
// Change from:
const claims = generateClaimsDataset(1000);

// To:
const claims = generateClaimsDataset(5000); // Generate 5,000 claims
```

Then run:
```bash
node generate-csvs.mjs
```

### Add New Categorical Values

Edit `src/utils/columnMapping.ts`:

```typescript
// Add new values to an existing category
export const CATEGORICAL_VALUES = {
  'Vehicle_Impact': ['Minimal', 'Moderate', 'Heavy', 'Severe'], // Added 'Severe'
  // ...
};

// Add weights for realistic distribution
export const VALUE_WEIGHTS = {
  'Vehicle_Impact': {
    'Minimal': 276613,
    'Moderate': 509269,
    'Heavy': 343651,
    'Severe': 50000, // New value with weight
  },
  // ...
};
```

---

## Using Aggregated Data

### Option 1: Use Existing Hook

The existing dashboard already works with the new data!

```typescript
import { useClaimsData } from '@/hooks/useClaimsData';

function MyComponent() {
  const { claims, loading } = useClaimsData();

  // All existing code works as-is
  return <div>{claims.length} claims</div>;
}
```

### Option 2: Use New Aggregated Hook (Faster)

For better performance with large datasets:

```typescript
import { useAggregatedKPIs } from '@/hooks/useAggregatedData';

function FastKPIs() {
  const kpis = useAggregatedKPIs();

  return (
    <div>
      <KPICard title="Total Claims" value={kpis.totalClaims} />
      <KPICard title="Avg Settlement" value={`$${kpis.avgSettlement.toLocaleString()}`} />
      <KPICard title="Avg Days" value={kpis.avgDaysToSettlement} />
      <KPICard title="High Variance %" value={`${kpis.highVariancePct}%`} />
    </div>
  );
}
```

### Option 3: Load Raw Aggregated Data

```typescript
import { useAggregatedData } from '@/hooks/useAggregatedData';

function MyAnalysis() {
  const { data, loading, error } = useAggregatedData();

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  // Access aggregated summaries
  console.log('Year-Severity:', data.yearSeverity);
  console.log('County-Year:', data.countyYear);
  console.log('Injury Type:', data.injuryType);
  console.log('Treatment:', data.treatment);

  return <YourComponent data={data} />;
}
```

---

## Performance Tips

### For 1,000-5,000 Claims

✅ **Current approach works great:**
- Load full `dat.csv` with `useClaimsData()`
- Use existing filtering and memoization
- No changes needed

### For 5,000-10,000 Claims

⚡ **Use aggregated summaries for overview:**

```typescript
function Dashboard() {
  // Load fast aggregated data for KPIs
  const kpis = useAggregatedKPIs();

  // Load full data for detailed tables
  const { claims } = useClaimsData();

  return (
    <>
      {/* Fast KPIs from aggregated data */}
      <KPISection kpis={kpis} />

      {/* Detailed view with full data */}
      <DetailTable data={claims} />
    </>
  );
}
```

### For 10,000+ Claims

🚀 **Implement lazy loading:**

```typescript
function Dashboard() {
  const [fullDataLoaded, setFullDataLoaded] = useState(false);

  // Load aggregated data immediately
  const kpis = useAggregatedKPIs();

  // Load full data after 2 seconds
  useEffect(() => {
    setTimeout(() => setFullDataLoaded(true), 2000);
  }, []);

  return (
    <>
      {/* Show KPIs immediately */}
      <KPISection kpis={kpis} />

      {/* Show detailed data when ready */}
      {fullDataLoaded ? (
        <DetailedView />
      ) : (
        <LoadingSpinner message="Loading detailed data..." />
      )}
    </>
  );
}
```

---

## Adding Categorical Filters

### Example: Add Vehicle Impact Filter

1. **Update FilterState type** in `src/types/claims.ts`:

```typescript
export interface FilterState {
  injuryGroupCode: string;
  county: string;
  severityScore: string;
  cautionLevel: string;
  venueRating: string;
  impact: string;
  year: string;
  vehicleImpact: string; // ← Add this
}
```

2. **Add filter in FilterSidebar component**:

```typescript
<div>
  <Label>Vehicle Impact</Label>
  <Select
    value={filters.vehicleImpact}
    onValueChange={(value) => setFilters({ ...filters, vehicleImpact: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Impacts" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">All Impacts</SelectItem>
      <SelectItem value="Minimal">Minimal</SelectItem>
      <SelectItem value="Moderate">Moderate</SelectItem>
      <SelectItem value="Heavy">Heavy</SelectItem>
    </SelectContent>
  </Select>
</div>
```

3. **Apply filter in useClaimsData hook**:

```typescript
const filtered = useMemo(() => {
  return allClaims.filter(claim => {
    // ... existing filters ...

    // Add vehicle impact filter
    if (filters.vehicleImpact && claim.Vehicle_Impact !== filters.vehicleImpact) {
      return false;
    }

    return true;
  });
}, [allClaims, filters]);
```

---

## Categorical Fields Reference

### Most Useful for Filtering

1. **Vehicle_Impact** - Minimal, Moderate, Heavy
2. **Injury_Extent** - Mild, Moderate, Severe
3. **Treatment_Course** - Active, Passive, Eval Only
4. **Pain_Management** - RX, OTC, Injections
5. **Physical_Therapy** - Outpatient, Inpatient, No
6. **Prior_Treatment** - Various prior treatment statuses
7. **Causation_Compliance** - Compliant, Non-Compliant
8. **Emergency_Treatment** - Released, Admitted
9. **Recovery_Duration** - Time ranges

### All 40+ Categorical Fields

See `DATA_STRUCTURE.md` for the complete list with all valid values.

---

## Troubleshooting

### Issue: Dashboard shows no data

**Check:**
1. CSV files exist in `/public` folder
2. Browser console (F12) for errors
3. Network tab shows CSV files loading successfully

**Fix:**
```bash
# Regenerate CSV files
node generate-csvs.mjs
```

### Issue: Filters not working

**Check:**
- FilterState type includes the filter field
- Filter logic in useClaimsData hook
- Filter values match data values exactly (case-sensitive)

### Issue: Performance is slow

**Solutions:**
1. Use aggregated data hooks for KPIs
2. Implement pagination for tables
3. Add virtual scrolling for long lists
4. Reduce number of records (edit generate-csvs.mjs)

### Issue: Categorical values are empty

**Check:**
- Some fields are intentionally sparse (e.g., Dental_Procedure only 1% of claims)
- Edit `generate-csvs.mjs` probability thresholds to make fields more common

**Example:**
```javascript
// Make Concussion_Diagnosis more common
// Change from:
claim.Concussion_Diagnosis = Math.random() > 0.99 ? ... : '';

// To:
claim.Concussion_Diagnosis = Math.random() > 0.90 ? ... : ''; // 10% instead of 1%
```

---

## Next Steps

### Recommended Enhancements

1. **Add more categorical filters** (see example above)
2. **Create category distribution charts**
3. **Implement pagination for tables**
4. **Add data export functionality**
5. **Scale to 10,000+ claims and optimize**

### Optional Features

1. **Admin panel** to regenerate data from UI
2. **Advanced analytics** (correlations, patterns)
3. **Custom reports** builder
4. **Data import** from external sources

---

## File Reference

### Key Files to Edit

| File | Purpose | When to Edit |
|------|---------|--------------|
| `generate-csvs.mjs` | Generate CSV files | Change record count, distributions |
| `src/utils/columnMapping.ts` | Column definitions | Add new categorical values |
| `src/types/claims.ts` | Type definitions | Add new filters |
| `src/hooks/useClaimsData.ts` | Data filtering | Add new filter logic |
| `src/components/dashboard/FilterSidebar.tsx` | Filter UI | Add new filter controls |

### Documentation Files

| File | Content |
|------|---------|
| `DATA_STRUCTURE.md` | Complete data structure reference |
| `README_DATA_MIGRATION.md` | Detailed migration information |
| `QUICK_START.md` | This quick start guide |

---

## Summary

✅ **What You Have:**
- Dashboard running at http://localhost:8081
- 1,000 sample claims with categorical data
- 4 aggregated summary files for performance
- React hooks for easy data access
- Full documentation

✅ **What Works:**
- All existing dashboard features
- Data loading and filtering
- Charts and visualizations
- No breaking changes

🚀 **What's New:**
- Meaningful categorical values (not codes)
- Performance optimization tools
- Easy to scale to 10,000+ records
- Comprehensive documentation

**You're all set!** Open http://localhost:8081 to view your dashboard.

For more details, see:
- `DATA_STRUCTURE.md` - Full data documentation
- `README_DATA_MIGRATION.md` - Migration details
- `src/utils/columnMapping.ts` - All categorical values
