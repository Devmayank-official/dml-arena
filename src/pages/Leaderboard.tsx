import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  RefreshCw,
  Calendar,
  Filter,
  TrendingUp,
  Zap,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { StatsOverview } from '@/components/leaderboard/StatsOverview';
import { ModelRankingTable } from '@/components/leaderboard/ModelRankingTable';
import { PerformanceCharts } from '@/components/leaderboard/PerformanceCharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type TimeRange = 'all' | 'week' | 'month' | 'today';
type SortMetric = 'winRate' | 'avgResponseTime' | 'totalResponses' | 'upvotes';

export default function Leaderboard() {
  const { modelStats, totalComparisons, totalDebates, totalVotes, isLoading, refetch } = useLeaderboardData();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortMetric, setSortMetric] = useState<SortMetric>('winRate');
  const [activeTab, setActiveTab] = useState('rankings');

  // Sort models based on selected metric
  const sortedStats = [...modelStats].sort((a, b) => {
    switch (sortMetric) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'avgResponseTime':
        return a.avgResponseTime - b.avgResponseTime; // Lower is better
      case 'totalResponses':
        return b.totalResponses - a.totalResponses;
      case 'upvotes':
        return b.upvotes - a.upvotes;
      default:
        return 0;
    }
  });

  const topModel = sortedStats[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10">
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
          className="space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">AI Leaderboard</h1>
                <p className="text-sm text-muted-foreground">
                  Track model performance across all comparisons
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Top Performer Highlight */}
          {topModel && topModel.totalResponses > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 sm:p-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Current Leader</p>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {topModel.modelName}
                      <Badge variant="outline" className="ml-2">
                        {topModel.provider}
                      </Badge>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="h-4 w-4" />
                        {topModel.winRate.toFixed(1)}% win rate
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        {topModel.avgResponseTime.toFixed(0)}ms avg
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        {topModel.upvotes} upvotes
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Filters */}
          <Card className="p-4 bg-card border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Time Range */}
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Metric */}
              <Select value={sortMetric} onValueChange={(v) => setSortMetric(v as SortMetric)}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                  <SelectItem value="avgResponseTime">Response Time</SelectItem>
                  <SelectItem value="totalResponses">Total Responses</SelectItem>
                  <SelectItem value="upvotes">Upvotes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Stats Overview */}
          <StatsOverview
            totalComparisons={totalComparisons}
            totalDebates={totalDebates}
            totalVotes={totalVotes}
            totalModels={modelStats.length}
          />

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rankings" className="gap-2">
                <Trophy className="h-4 w-4" />
                Rankings
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Charts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rankings" className="mt-4">
              {isLoading ? (
                <Card className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </Card>
              ) : (
                <ModelRankingTable modelStats={sortedStats} />
              )}
            </TabsContent>

            <TabsContent value="charts" className="mt-4">
              {isLoading ? (
                <Card className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </Card>
              ) : (
                <PerformanceCharts modelStats={sortedStats} />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
