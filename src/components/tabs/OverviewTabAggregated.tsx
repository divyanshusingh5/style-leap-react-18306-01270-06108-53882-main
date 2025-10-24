/**
 * Enhanced Overview Tab - Purple/Blue Theme with Filters
 * Professional charts and executive summary with dynamic filtering
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, BarChart3, Activity } from "lucide-react";
import { AggregatedData } from "@/hooks/useAggregatedClaimsData";
import { useMemo, useState } from "react";
import { DashboardFilters, FilterState } from "@/components/dashboard/DashboardFilters";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface OverviewTabAggregatedProps {
  data: AggregatedData;
  kpis: {
    totalClaims: number;
    avgSettlement: number;
    avgDays: number;
    highVariancePct: number;
    overpredictionRate: number;
    underpredictionRate: number;
  };
  filterOptions: {
    counties: string[];
    years: number[];
    injuryGroups: string[];
    venueRatings: string[];
    severityCategories: string[];
    adjusters: string[];
  };
}

const COLORS = {
  primary: '#8b5cf6',    // purple
  secondary: '#3b82f6',   // blue
  success: '#10b981',     // green
  warning: '#f59e0b',     // orange
  danger: '#ef4444',      // red
  purple: {
    light: '#e9d5ff',
    main: '#8b5cf6',
    dark: '#6d28d9',
  },
  blue: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1e40af',
  }
};

export function OverviewTabAggregated({ data, kpis: initialKpis, filterOptions }: OverviewTabAggregatedProps) {
  const [filters, setFilters] = useState<FilterState>({
    county: "all",
    injuryGroup: "all",
    severity: "all",
    year: "all",
    impactOnLife: "all",
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      county: "all",
      injuryGroup: "all",
      severity: "all",
      year: "all",
      impactOnLife: "all",
    });
  };

  // Filter all data based on current filters
  const filteredData = useMemo(() => {
    const filterYearSeverity = data.yearSeverity.filter(item => {
      const matchesYear = filters.year === "all" || item.year.toString() === filters.year;
      const matchesSeverity = filters.severity === "all" || item.severity_category === filters.severity;
      return matchesYear && matchesSeverity;
    });

    const filterCountyYear = data.countyYear.filter(item => {
      const matchesCounty = filters.county === "all" || item.county === filters.county;
      const matchesYear = filters.year === "all" || item.year.toString() === filters.year;
      return matchesCounty && matchesYear;
    });

    const filterInjuryGroup = data.injuryGroup.filter(item => {
      const matchesInjury = filters.injuryGroup === "all" || item.injury_group === filters.injuryGroup;
      const matchesSeverity = filters.severity === "all" || item.severity_category === filters.severity;
      return matchesInjury && matchesSeverity;
    });

    return {
      yearSeverity: filterYearSeverity,
      countyYear: filterCountyYear,
      injuryGroup: filterInjuryGroup,
      adjusterPerformance: data.adjusterPerformance,
      venueAnalysis: data.venueAnalysis,
      varianceDrivers: data.varianceDrivers,
    };
  }, [data, filters]);

  // Recalculate KPIs based on filtered data
  const kpis = useMemo(() => {
    const totalClaims = filteredData.yearSeverity.reduce((sum, s) => sum + s.claim_count, 0);
    if (totalClaims === 0) return initialKpis;

    const totalActual = filteredData.yearSeverity.reduce((sum, s) => sum + s.total_actual_settlement, 0);
    const totalDays = filteredData.yearSeverity.reduce((sum, s) => sum + (s.avg_settlement_days * s.claim_count), 0);
    const totalHighVariance = filteredData.yearSeverity.reduce((sum, s) => sum + s.high_variance_count, 0);
    const totalOver = filteredData.yearSeverity.reduce((sum, s) => sum + s.overprediction_count, 0);
    const totalUnder = filteredData.yearSeverity.reduce((sum, s) => sum + s.underprediction_count, 0);

    return {
      totalClaims,
      avgSettlement: Math.round(totalActual / totalClaims),
      avgDays: Math.round(totalDays / totalClaims),
      highVariancePct: (totalHighVariance / totalClaims) * 100,
      overpredictionRate: (totalOver / totalClaims) * 100,
      underpredictionRate: (totalUnder / totalClaims) * 100,
    };
  }, [filteredData, initialKpis]);

  // Executive Summary with filtered data
  const executiveSummary = useMemo(() => {
    const severityPerformance = filteredData.yearSeverity.reduce((acc, item) => {
      const existing = acc.find(s => s.severity === item.severity_category);
      if (existing) {
        existing.claimCount += item.claim_count;
        existing.weightedVariance += Math.abs(item.avg_variance_pct) * item.claim_count;
      } else {
        acc.push({
          severity: item.severity_category,
          claimCount: item.claim_count,
          weightedVariance: Math.abs(item.avg_variance_pct) * item.claim_count,
        });
      }
      return acc;
    }, [] as any[]).map(s => ({
      factor: `${s.severity} Severity`,
      avgDeviation: s.claimCount > 0 ? s.weightedVariance / s.claimCount : 0,
      claimCount: s.claimCount,
      category: 'Severity',
    }));

    const injuryPerformance = filteredData.injuryGroup.reduce((acc, item) => {
      const existing = acc.find(i => i.injuryGroup === item.injury_group);
      if (existing) {
        existing.claimCount += item.claim_count;
        existing.weightedVariance += Math.abs(item.avg_variance_pct) * item.claim_count;
      } else {
        acc.push({
          injuryGroup: item.injury_group,
          claimCount: item.claim_count,
          weightedVariance: Math.abs(item.avg_variance_pct) * item.claim_count,
        });
      }
      return acc;
    }, [] as any[]).map(i => ({
      factor: `${i.injuryGroup} Injuries`,
      avgDeviation: i.claimCount > 0 ? i.weightedVariance / i.claimCount : 0,
      claimCount: i.claimCount,
      category: 'Injury Type',
    }));

    const driverPerformance = data.varianceDrivers.slice(0, 5).map(d => ({
      factor: `${d.factor_name}: ${d.factor_value}`,
      avgDeviation: Math.abs(d.avg_variance_pct),
      claimCount: d.claim_count,
      category: 'Driver',
    }));

    return [...severityPerformance, ...injuryPerformance, ...driverPerformance]
      .sort((a, b) => b.avgDeviation - a.avgDeviation);
  }, [filteredData, data.varianceDrivers]);

  // Chart data
  const varianceByYearData = useMemo(() => {
    return filteredData.yearSeverity.reduce((acc, item) => {
      const existing = acc.find(y => y.year === item.year);
      if (existing) {
        existing.claimCount += item.claim_count;
        existing.weightedVariance += Math.abs(item.avg_variance_pct) * item.claim_count;
      } else {
        acc.push({
          year: item.year,
          claimCount: item.claim_count,
          weightedVariance: Math.abs(item.avg_variance_pct) * item.claim_count,
        });
      }
      return acc;
    }, [] as any[]).map(y => ({
      year: y.year.toString(),
      avgVariance: y.claimCount > 0 ? y.weightedVariance / y.claimCount : 0,
    })).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [filteredData]);

  const claimsBySeverityData = useMemo(() => {
    const severityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
    return filteredData.yearSeverity.reduce((acc, item) => {
      const existing = acc.find(s => s.severity === item.severity_category);
      if (existing) {
        existing.value += item.claim_count;
      } else {
        acc.push({
          name: item.severity_category,
          severity: item.severity_category,
          value: item.claim_count,
        });
      }
      return acc;
    }, [] as any[]).sort((a, b) =>
      (severityOrder[a.severity as keyof typeof severityOrder] || 99) -
      (severityOrder[b.severity as keyof typeof severityOrder] || 99)
    );
  }, [filteredData]);

  const topInjuryGroupsData = useMemo(() => {
    return filteredData.injuryGroup.reduce((acc, item) => {
      const existing = acc.find(i => i.injuryGroup === item.injury_group);
      if (existing) {
        existing.claimCount += item.claim_count;
      } else {
        acc.push({
          name: item.injury_group,
          injuryGroup: item.injury_group,
          claimCount: item.claim_count,
        });
      }
      return acc;
    }, [] as any[]).map(i => ({
      name: i.name,
      claims: i.claimCount,
    })).sort((a, b) => b.claims - a.claims).slice(0, 6);
  }, [filteredData]);

  const predictionDistribution = [
    { name: 'Accurate', value: kpis.totalClaims * (1 - kpis.highVariancePct / 100), fill: COLORS.success },
    { name: 'High Variance', value: kpis.totalClaims * (kpis.highVariancePct / 100), fill: COLORS.danger },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        filterOptions={filterOptions}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Claims</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{kpis.totalClaims.toLocaleString()}</div>
            <p className="text-xs text-purple-600">Analyzed</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Avg Settlement</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${kpis.avgSettlement.toLocaleString()}</div>
            <p className="text-xs text-blue-600">Per claim</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Avg Days</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{Math.round(kpis.avgDays)}</div>
            <p className="text-xs text-purple-600">To settle</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">High Variance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.highVariancePct.toFixed(1)}%</div>
            <p className="text-xs text-orange-700">{Math.round(kpis.totalClaims * kpis.highVariancePct / 100)} claims</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Over-Predicted</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.overpredictionRate.toFixed(1)}%</div>
            <p className="text-xs text-blue-700">Of claims</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Under-Predicted</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.underpredictionRate.toFixed(1)}%</div>
            <p className="text-xs text-orange-700">Of claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary Table */}
      <Card className="border-2 border-purple-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Activity className="h-5 w-5" />
            Executive Summary: Factor Performance Analysis
          </CardTitle>
          <CardDescription className="text-purple-700">
            Key factors ranked by average deviation - Red (needs improvement) | Green (performing well)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="text-left p-3 font-semibold text-purple-900">Rank</th>
                  <th className="text-left p-3 font-semibold text-purple-900">Factor</th>
                  <th className="text-left p-3 font-semibold text-purple-900">Category</th>
                  <th className="text-right p-3 font-semibold text-purple-900">Avg Deviation %</th>
                  <th className="text-right p-3 font-semibold text-purple-900">Claims</th>
                  <th className="text-center p-3 font-semibold text-purple-900">Performance</th>
                </tr>
              </thead>
              <tbody>
                {executiveSummary.map((item, idx) => {
                  const isGood = item.avgDeviation < 5;
                  const isWarning = item.avgDeviation >= 5 && item.avgDeviation < 15;
                  const isBad = item.avgDeviation >= 15;

                  return (
                    <tr
                      key={idx}
                      className={`border-b hover:bg-purple-50 transition-colors ${
                        isBad ? 'bg-red-50' : isWarning ? 'bg-orange-50' : 'bg-green-50'
                      }`}
                    >
                      <td className="p-3 font-bold text-purple-700">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-900">{item.factor}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="border-purple-300 text-purple-700">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${
                          isBad ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-green-700'
                        }`}>
                          {item.avgDeviation.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {item.claimCount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {isBad && (
                          <Badge variant="destructive" className="font-semibold">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs Attention
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge className="bg-orange-600 font-semibold">
                            ⚠ Monitor
                          </Badge>
                        )}
                        {isGood && (
                          <Badge className="bg-green-600 font-semibold">
                            ✓ Good
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Variance Trend Over Time</CardTitle>
            <CardDescription>Average prediction variance by year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={varianceByYearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis dataKey="year" stroke="#6d28d9" />
                <YAxis label={{ value: 'Avg Variance %', angle: -90, position: 'insideLeft' }} stroke="#6d28d9" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgVariance"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="Avg Variance %"
                  dot={{ fill: COLORS.primary, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Prediction Accuracy Distribution</CardTitle>
            <CardDescription>Claims within vs. outside acceptable variance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={predictionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.value / kpis.totalClaims) * 100).toFixed(1)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {predictionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Claims Distribution by Severity</CardTitle>
            <CardDescription>Volume of claims across severity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={claimsBySeverityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis dataKey="name" stroke="#6d28d9" />
                <YAxis label={{ value: 'Claims', angle: -90, position: 'insideLeft' }} stroke="#6d28d9" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Claims">
                  {claimsBySeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'High' ? COLORS.danger :
                      entry.name === 'Medium' ? COLORS.warning :
                      COLORS.success
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Top Injury Groups by Volume</CardTitle>
            <CardDescription>Claims count for major injury types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topInjuryGroupsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis type="number" stroke="#6d28d9" />
                <YAxis dataKey="name" type="category" width={100} stroke="#6d28d9" style={{ fontSize: '11px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="claims" fill={COLORS.primary} name="Claims" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
