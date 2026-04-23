import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Percent, Activity } from 'lucide-react';
import { ModelStats } from '@/hooks/useLeaderboardData';

interface PerformanceChartsProps {
  modelStats: ModelStats[];
}

export function PerformanceCharts({ modelStats }: PerformanceChartsProps) {
  // Prepare data for response time chart
  const responseTimeData = modelStats
    .filter(m => m.avgResponseTime > 0)
    .map(model => ({
      name: model.modelName,
      time: Number((model.avgResponseTime / 1000).toFixed(2)),
      fill: model.color,
    }));

  // Prepare data for win rate pie chart
  const winRateData = modelStats
    .filter(m => m.upvotes + m.downvotes > 0)
    .map(model => ({
      name: model.modelName,
      value: model.upvotes,
      fill: model.color,
    }));

  // Prepare data for radar chart (normalized metrics)
  const maxValues = {
    speed: Math.max(...modelStats.map(m => m.avgResponseTime > 0 ? 1 / m.avgResponseTime : 0)),
    tokens: Math.max(...modelStats.map(m => m.avgTokensPerResponse)),
    winRate: 100,
    responses: Math.max(...modelStats.map(m => m.totalResponses)),
    upvotes: Math.max(...modelStats.map(m => m.upvotes)),
  };

  const radarData = modelStats.slice(0, 5).map(model => ({
    name: model.modelName,
    speed: model.avgResponseTime > 0 ? ((1 / model.avgResponseTime) / maxValues.speed) * 100 : 0,
    quality: model.winRate,
    volume: maxValues.responses > 0 ? (model.totalResponses / maxValues.responses) * 100 : 0,
    engagement: maxValues.upvotes > 0 ? (model.upvotes / maxValues.upvotes) * 100 : 0,
  }));

  interface TooltipPayloadEntry {
    name?: string;
    value?: number | string;
    dataKey?: string;
  }
  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{label || payload[0]?.name}</p>
          <p className="text-muted-foreground text-xs">
            {payload[0]?.dataKey === 'time' ? `${payload[0]?.value}s` : payload[0]?.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Response Time Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Average Response Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {responseTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={responseTimeData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}s`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={90}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="time" 
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  >
                    {responseTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No response time data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Win Rate Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Percent className="h-5 w-5 text-accent" />
              Upvotes Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {winRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={winRateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {winRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No votes recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Radar Chart - Model Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="lg:col-span-2"
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Activity className="h-5 w-5 text-green-400" />
              Top 5 Models Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={[
                  { metric: 'Speed', ...Object.fromEntries(radarData.map(m => [m.name, m.speed])) },
                  { metric: 'Quality', ...Object.fromEntries(radarData.map(m => [m.name, m.quality])) },
                  { metric: 'Volume', ...Object.fromEntries(radarData.map(m => [m.name, m.volume])) },
                  { metric: 'Engagement', ...Object.fromEntries(radarData.map(m => [m.name, m.engagement])) },
                ]}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  {radarData.map((model, index) => (
                    <Radar
                      key={model.name}
                      name={model.name}
                      dataKey={model.name}
                      stroke={modelStats[index]?.color}
                      fill={modelStats[index]?.color}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Run some comparisons to see performance data
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {modelStats.slice(0, 5).map(model => (
                <div key={model.modelId} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: model.color }}
                  />
                  <span className="text-muted-foreground">{model.modelName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
