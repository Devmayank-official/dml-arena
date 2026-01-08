import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useModelPerformance } from '@/hooks/useModelPerformance';
import { useHistory } from '@/hooks/useHistory';
import { useSubscription } from '@/hooks/useSubscription';
import { getModelById } from '@/lib/models';
import { getCategoryInfo, QUERY_CATEGORIES, type QueryCategory } from '@/lib/queryCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  TrendingUp, 
  Star,
  Activity,
  PieChart,
  Crown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { isPro, remainingQueries } = useSubscription();
  const { 
    isLoading, 
    totalQueries, 
    getModelStats, 
    getCategoryStats, 
    getRecentActivity,
    getFavoriteModels 
  } = useModelPerformance();
  const history = useHistory(true);

  const modelStats = getModelStats();
  const categoryStats = getCategoryStats();
  const recentActivity = getRecentActivity();
  const favoriteModels = getFavoriteModels();

  // Calculate totals
  const totalResponseTime = modelStats.reduce((sum, s) => sum + s.avgResponseTime * s.totalRequests, 0);
  const avgResponseTime = totalQueries > 0 ? Math.round(totalResponseTime / totalQueries) : 0;
  const overallSuccessRate = modelStats.length > 0 
    ? Math.round(modelStats.reduce((sum, s) => sum + s.successRate, 0) / modelStats.length)
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Your personal AI usage analytics
            </p>
          </div>
          {isPro && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3 text-yellow-500" />
              Pro Member
            </Badge>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Queries
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQueries}</div>
              {!isPro && (
                <p className="text-xs text-muted-foreground mt-1">
                  {remainingQueries} remaining this month
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(avgResponseTime / 1000).toFixed(2)}s</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{overallSuccessRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Models Used
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelStats.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Different AI models
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={recentActivity}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No activity in the last 7 days
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Query Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <RechartsPie>
                      <Pie
                        data={categoryStats}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getCategoryInfo(entry.category as QueryCategory).color}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value, name) => [value, getCategoryInfo(name as QueryCategory).label]}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryStats.slice(0, 5).map((stat) => {
                      const info = getCategoryInfo(stat.category as QueryCategory);
                      return (
                        <div key={stat.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{info.icon}</span>
                            <span className="text-sm">{info.label}</span>
                          </div>
                          <span className="text-sm font-medium">{stat.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No categorized queries yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Performance & Favorites */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Favorite Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Most Used Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favoriteModels.length > 0 ? (
                <div className="space-y-4">
                  {favoriteModels.map((fav, index) => {
                    const model = getModelById(fav.modelId);
                    const maxCount = favoriteModels[0]?.count || 1;
                    const percentage = (fav.count / maxCount) * 100;
                    
                    return (
                      <div key={fav.modelId} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: model?.color }}
                            />
                            <span className="font-medium">{model?.name || fav.modelId}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {fav.count} queries
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: model?.color || 'hsl(var(--primary))',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Start comparing to see your favorite models
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Model Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {modelStats.length > 0 ? (
                <div className="space-y-3">
                  {modelStats.slice(0, 5).map((stat) => {
                    const model = getModelById(stat.modelId);
                    return (
                      <div
                        key={stat.modelId}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: model?.color }}
                          />
                          <span className="font-medium text-sm">{model?.name || stat.modelId}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{(stat.avgResponseTime / 1000).toFixed(2)}s avg</span>
                          <span className="text-green-500">{stat.successRate}%</span>
                          <span>{stat.totalRequests} req</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No performance data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
