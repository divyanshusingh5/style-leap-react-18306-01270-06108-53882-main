/**
 * Enhanced Recommendations Tab with Charts
 * Visual analytics for variance drivers and actionable insights
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AggregatedData } from "@/hooks/useAggregatedClaimsData";
import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";

interface RecommendationsTabAggregatedProps {
  data: AggregatedData | null;
}

const COLORS = {
  good: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  primary: '#3b82f6',
};

export function RecommendationsTabAggregated({ data }: RecommendationsTabAggregatedProps) {
  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading recommendations...</p>
      </div>
    );
  }

  // Get top variance drivers (sorted by contribution score)
  const topDrivers = useMemo(() => {
    return [...data.varianceDrivers]
      .sort((a, b) => b.contribution_score - a.contribution_score)
      .slice(0, 15);
  }, [data]);

  // Identify high variance drivers (above average)
  const avgVariance = useMemo(() => {
    return data.varianceDrivers.reduce((sum, d) => sum + d.avg_variance_pct, 0) / data.varianceDrivers.length;
  }, [data]);

  const highVarianceDrivers = useMemo(() => topDrivers.filter(d => d.avg_variance_pct > avgVariance), [topDrivers, avgVariance]);

  // Get injury groups with highest variance
  const injuryHighVariance = useMemo(() => {
    return [...data.injuryGroup]
      .sort((a, b) => Math.abs(b.avg_variance_pct) - Math.abs(a.avg_variance_pct))
      .slice(0, 5);
  }, [data]);

  // Get injury groups with lowest variance (performing well)
  const injuryLowVariance = useMemo(() => {
    return [...data.injuryGroup]
      .sort((a, b) => Math.abs(a.avg_variance_pct) - Math.abs(b.avg_variance_pct))
      .slice(0, 5);
  }, [data]);

  // Chart data: Top 10 variance drivers
  const top10DriversChartData = useMemo(() => {
    return topDrivers.slice(0, 10).map(d => ({
      name: `${d.factor_name.substring(0, 15)}`,
      fullName: `${d.factor_name}: ${d.factor_value}`,
      contributionScore: d.contribution_score,
      avgVariance: d.avg_variance_pct,
      claims: d.claim_count,
      fill: d.avg_variance_pct > avgVariance ? COLORS.danger : COLORS.good,
    }));
  }, [topDrivers, avgVariance]);

  // Scatter plot data: Variance vs Volume
  const scatterData = useMemo(() => {
    return topDrivers.map(d => ({
      name: `${d.factor_name}: ${d.factor_value}`,
      variance: d.avg_variance_pct,
      claims: d.claim_count,
      score: d.contribution_score,
      fill: d.avg_variance_pct > avgVariance ? COLORS.danger : COLORS.warning,
    }));
  }, [topDrivers, avgVariance]);

  // Injury group comparison chart data
  const injuryComparisonData = useMemo(() => {
    return [...injuryHighVariance.slice(0, 5).map(i => ({
      name: i.injury_group.substring(0, 12),
      fullName: `${i.injury_group} (${i.severity_category})`,
      variance: Math.abs(i.avg_variance_pct),
      claims: i.claim_count,
      type: 'High Variance',
      fill: COLORS.danger,
    })),
    ...injuryLowVariance.slice(0, 5).map(i => ({
      name: i.injury_group.substring(0, 12),
      fullName: `${i.injury_group} (${i.severity_category})`,
      variance: Math.abs(i.avg_variance_pct),
      claims: i.claim_count,
      type: 'Low Variance',
      fill: COLORS.good,
    }))].slice(0, 10);
  }, [injuryHighVariance, injuryLowVariance]);

  return (
    <div className="space-y-6 p-6">
      {/* Key Recommendations Alert */}
      <Alert className="border-orange-500 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Model Update Recommendations</AlertTitle>
        <AlertDescription className="text-orange-800">
          Based on variance analysis, consider updating model parameters for the top {highVarianceDrivers.length} variance drivers
          and {injuryHighVariance.length} injury group combinations showing highest prediction errors.
        </AlertDescription>
      </Alert>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Variance Drivers Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Variance Drivers by Contribution</CardTitle>
            <CardDescription>Factors with highest impact on prediction variance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={top10DriversChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Contribution Score', position: 'bottom' }} />
                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '11px' }} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg text-xs">
                          <p className="font-semibold">{data.fullName}</p>
                          <p>Contribution: <strong>{data.contributionScore.toFixed(2)}</strong></p>
                          <p>Avg Variance: <strong>{data.avgVariance.toFixed(2)}%</strong></p>
                          <p>Claims: <strong>{data.claims.toLocaleString()}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="contributionScore" name="Contribution Score">
                  {top10DriversChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Variance vs Volume Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Variance vs Claim Volume Analysis</CardTitle>
            <CardDescription>Bubble size = contribution score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="claims"
                  name="Claims"
                  label={{ value: 'Claim Count', position: 'bottom' }}
                />
                <YAxis
                  type="number"
                  dataKey="variance"
                  name="Variance %"
                  label={{ value: 'Avg Variance %', angle: -90, position: 'insideLeft' }}
                />
                <ZAxis type="number" dataKey="score" range={[50, 500]} name="Score" />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg text-xs">
                          <p className="font-semibold">{data.name}</p>
                          <p>Variance: <strong>{data.variance.toFixed(2)}%</strong></p>
                          <p>Claims: <strong>{data.claims.toLocaleString()}</strong></p>
                          <p>Score: <strong>{data.score.toFixed(2)}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Injury Group Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Injury Group Performance Comparison</CardTitle>
          <CardDescription>Worst vs Best Performing Injury Combinations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={injuryComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
              <YAxis label={{ value: 'Variance %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg text-xs">
                        <p className="font-semibold">{data.fullName}</p>
                        <p>Variance: <strong>{data.variance.toFixed(2)}%</strong></p>
                        <p>Claims: <strong>{data.claims.toLocaleString()}</strong></p>
                        <p>Type: <Badge variant={data.type === 'High Variance' ? 'destructive' : 'default'}>{data.type}</Badge></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="variance" name="Variance %">
                {injuryComparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Injury Group Performance Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* High Variance Injury Groups - Need Attention */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingUp className="h-5 w-5" />
              Injury Groups Needing Model Improvement
            </CardTitle>
            <CardDescription>
              Injury combinations with highest prediction variance - prioritize for model updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {injuryHighVariance.map((injury, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-red-900">{injury.injury_group}</h4>
                      <p className="text-sm text-red-700">
                        {injury.severity_category} Severity • {injury.body_region}
                      </p>
                    </div>
                    <Badge variant="destructive">{Math.abs(injury.avg_variance_pct).toFixed(1)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-red-800">
                    <div>Claims: <strong>{injury.claim_count}</strong></div>
                    <div>Avg Settlement: <strong>${injury.avg_settlement.toLocaleString()}</strong></div>
                  </div>
                  <div className="mt-2 text-xs text-red-700">
                    <strong>Recommendation:</strong> Review {injury.injury_group} + {injury.severity_category}
                    severity feature weights. Consider adding interaction terms.
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Variance Injury Groups - Performing Well */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Well-Performing Injury Groups
            </CardTitle>
            <CardDescription>
              Injury combinations with lowest variance - model performing well
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {injuryLowVariance.map((injury, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-green-900">{injury.injury_group}</h4>
                      <p className="text-sm text-green-700">
                        {injury.severity_category} Severity • {injury.body_region}
                      </p>
                    </div>
                    <Badge className="bg-green-600">{Math.abs(injury.avg_variance_pct).toFixed(1)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                    <div>Claims: <strong>{injury.claim_count}</strong></div>
                    <div>Avg Settlement: <strong>${injury.avg_settlement.toLocaleString()}</strong></div>
                  </div>
                  <div className="mt-2 text-xs text-green-700">
                    <strong>Best Practice:</strong> Use this combination's feature patterns as benchmark
                    for similar injury groups.
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Variance Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Variance Drivers Analysis</CardTitle>
          <CardDescription>All top variance factors with contribution scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Factor</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-right p-2">Claims</th>
                  <th className="text-right p-2">Avg Variance %</th>
                  <th className="text-right p-2">Contribution Score</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((driver, idx) => {
                  const isHighVariance = driver.avg_variance_pct > avgVariance;
                  return (
                    <tr key={idx} className={`border-b hover:bg-gray-50 ${isHighVariance ? 'bg-red-50' : 'bg-green-50'}`}>
                      <td className="p-2 font-semibold">{idx + 1}</td>
                      <td className="p-2 font-medium">{driver.factor_name}</td>
                      <td className="p-2">{driver.factor_value}</td>
                      <td className="p-2 text-right">{driver.claim_count.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={isHighVariance ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {driver.avg_variance_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-2 text-right font-semibold">{driver.contribution_score.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        {isHighVariance ? (
                          <Badge variant="destructive" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            High Impact
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Stable
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

      {/* Actionable Insights Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Actionable Insights Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div className="flex gap-2">
            <span className="font-bold">1.</span>
            <p>
              <strong>Feature Engineering Priority:</strong> Focus on the top {highVarianceDrivers.length}
              variance drivers which show contribution scores above {avgVariance.toFixed(2)}%.
              Consider creating interaction terms between high-impact factors.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">2.</span>
            <p>
              <strong>Injury-Specific Models:</strong> {injuryHighVariance[0]?.injury_group} injuries
              with {injuryHighVariance[0]?.severity_category} severity show {injuryHighVariance[0]?.avg_variance_pct.toFixed(1)}%
              variance. Consider separate sub-models for this category.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">3.</span>
            <p>
              <strong>Best Practice Replication:</strong> {injuryLowVariance[0]?.injury_group} shows only {Math.abs(injuryLowVariance[0]?.avg_variance_pct || 0).toFixed(1)}%
              variance. Analyze its feature patterns and apply to similar injury groups.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">4.</span>
            <p>
              <strong>Model Validation:</strong> Retrain model monthly focusing on high-variance combinations.
              Track improvement in contribution scores after each update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
