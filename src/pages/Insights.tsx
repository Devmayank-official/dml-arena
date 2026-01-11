import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Target,
} from 'lucide-react';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { useModelPerformance } from '@/hooks/useModelPerformance';
import { getModelById } from '@/lib/models';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Insights() {
  const {
    records,
    isLoading,
    getModelStats,
    getCategoryStats,
    getRecentActivity,
    getFavoriteModels,
    totalQueries,
  } = useModelPerformance();

  const modelStats = useMemo(() => getModelStats(), [getModelStats]);
  const categoryStats = useMemo(() => getCategoryStats(), [getCategoryStats]);
  const recentActivity = useMemo(() => getRecentActivity(), [getRecentActivity]);
  const favoriteModels = useMemo(() => getFavoriteModels(), [getFavoriteModels]);

  // Prepare chart data
  const responseTimeData = useMemo(() => {
    return modelStats
      .map((stats) => {
        const model = getModelById(stats.modelId);
        return {
          name: model?.name || stats.modelId.split('/')[1] || stats.modelId,
          avgTime: Math.round(stats.avgResponseTime),
          requests: stats.totalRequests,
        };
      })
      .sort((a, b) => a.avgTime - b.avgTime)
      .slice(0, 8);
  }, [modelStats]);

  const categoryData = useMemo(() => {
    return categoryStats.map((stat, index) => ({
      name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
      value: stat.count,
      color: COLORS[index % COLORS.length],
    }));
  }, [categoryStats]);

  const successRateData = useMemo(() => {
    return modelStats
      .map((stats) => {
        const model = getModelById(stats.modelId);
        return {
          name: model?.name || stats.modelId.split('/')[1] || stats.modelId,
          successRate: stats.successRate,
          requests: stats.totalRequests,
        };
      })
      .filter((d) => d.requests >= 3)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 6);
  }, [modelStats]);

  const radarData = useMemo(() => {
    const topModels = [...modelStats]
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 4);

    if (topModels.length === 0) return [];

    const maxAvgTime = Math.max(...topModels.map((s) => s.avgResponseTime));
    const maxTokens = Math.max(...topModels.map((s) => s.avgTokens || 1));

    return topModels.map((stats) => {
      const model = getModelById(stats.modelId);
      return {
        model: model?.name || stats.modelId.split('/')[1] || stats.modelId,
        speed: maxAvgTime > 0 ? Math.round(100 - (stats.avgResponseTime / maxAvgTime) * 100) : 50,
        reliability: stats.successRate,
        efficiency: maxTokens > 0 ? Math.round(100 - ((stats.avgTokens || 0) / maxTokens) * 100) : 50,
        usage: Math.min(100, (stats.totalRequests / totalQueries) * 100 * 5),
      };
    });
  }, [modelStats, totalQueries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <BackgroundEffects />

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Performance Insights</h1>
              <p className="text-sm text-muted-foreground">
                Detailed analytics based on {totalQueries} queries
              </p>
            </div>
          </div>

          {totalQueries === 0 ? (
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No data yet</h3>
              <p className="text-muted-foreground mb-4">
                Start comparing AI models to see performance insights.
              </p>
              <Link to="/chat">
                <Button>Start Comparing</Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs">Total Queries</span>
                  </div>
                  <p className="text-2xl font-bold">{totalQueries}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Models Used</span>
                  </div>
                  <p className="text-2xl font-bold">{Object.keys(modelStats).length}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Avg Response</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {records.length > 0
                      ? (records.reduce((sum, r) => sum + r.response_time_ms, 0) / records.length / 1000).toFixed(1)
                      : 0}
                    s
                  </p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {records.length > 0
                      ? Math.round((records.filter((r) => r.success).length / records.length) * 100)
                      : 0}
                    %
                  </p>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Time Chart */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Average Response Time by Model
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={responseTimeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12 }} unit="ms" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value}ms`, 'Avg Time']}
                        />
                        <Bar dataKey="avgTime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Distribution */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Query Categories
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Success Rate */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Success Rate by Model
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={successRateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
                        />
                        <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Activity Timeline */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Recent Activity (7 Days)
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recentActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Radar Chart for Top Models */}
              {radarData.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Model Comparison (Top Models)
                  </h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="model" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Speed"
                          dataKey="speed"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                        />
                        <Radar
                          name="Reliability"
                          dataKey="reliability"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                        />
                        <Radar
                          name="Usage"
                          dataKey="usage"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.2}
                        />
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Favorite Models */}
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Most Used Models
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {favoriteModels.map((item, index) => {
                    const model = getModelById(item.modelId);
                    return (
                      <div
                        key={item.modelId}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {model?.name || item.modelId.split('/')[1]}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.count} uses</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </motion.div>
      </main>
    </AppLayout>
  );
}
