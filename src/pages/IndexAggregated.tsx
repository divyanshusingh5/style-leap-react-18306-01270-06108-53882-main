/**
 * Main Dashboard Page - Using Aggregated Data Only
 * This version loads ONLY small aggregated CSVs, not the large dat.csv
 * Works with 1M+ record datasets without "string too long" errors
 */

import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OverviewTabAggregated } from "@/components/tabs/OverviewTabAggregated";
import { RecommendationsTabAggregated } from "@/components/tabs/RecommendationsTabAggregated";
import { InjuryAnalysisTabAggregated } from "@/components/tabs/InjuryAnalysisTabAggregated";
import { AdjusterPerformanceTabAggregated } from "@/components/tabs/AdjusterPerformanceTabAggregated";
import { ModelPerformanceTabAggregated } from "@/components/tabs/ModelPerformanceTabAggregated";
import { useAggregatedClaimsData } from "@/hooks/useAggregatedClaimsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

const IndexAggregated = () => {
  const { data, kpis, filterOptions, isLoading, error } = useAggregatedClaimsData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading aggregated claims data...</p>
          <p className="text-xs text-muted-foreground mt-2">
            (Loading only small CSV files, not full dat.csv)
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2 text-destructive">Error loading data</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2">
            <p className="font-semibold">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Place your dat.csv in the public/ folder</li>
              <li>Run: <code className="bg-background px-2 py-1 rounded">node process-data-streaming.mjs</code></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Claims Variance Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Analyzing {kpis.totalClaims.toLocaleString()} claims from aggregated data
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="injury">Injury Analysis</TabsTrigger>
            <TabsTrigger value="adjuster">Adjuster Performance</TabsTrigger>
            <TabsTrigger value="model">Model Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTabAggregated data={data} kpis={kpis} filterOptions={filterOptions} />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationsTabAggregated data={data} />
          </TabsContent>

          <TabsContent value="injury">
            <InjuryAnalysisTabAggregated data={data} />
          </TabsContent>

          <TabsContent value="adjuster">
            <AdjusterPerformanceTabAggregated data={data} />
          </TabsContent>

          <TabsContent value="model">
            <ModelPerformanceTabAggregated data={data} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default IndexAggregated;
