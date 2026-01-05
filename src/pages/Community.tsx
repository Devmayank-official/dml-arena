import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Users, Trophy, MessageSquare, TrendingUp, Calendar, Filter, Zap, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { StatsOverview } from '@/components/leaderboard/StatsOverview';
import { ModelRankingTable } from '@/components/leaderboard/ModelRankingTable';
import { PerformanceCharts } from '@/components/leaderboard/PerformanceCharts';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = 'all' | 'week' | 'month' | 'today';
type SortMetric = 'winRate' | 'avgResponseTime' | 'totalResponses' | 'upvotes';

export default function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const [statsView, setStatsView] = useState('rankings');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortMetric, setSortMetric] = useState<SortMetric>('winRate');
  
  const { modelStats, totalComparisons, totalDebates, totalVotes, isLoading: statsLoading, refetch: refetchStats } = useLeaderboardData();
  const { comparisons, isLoading: feedLoading, user, vote, refetch: refetchFeed } = useCommunityFeed();

  // Sort models based on selected metric
  const sortedStats = [...modelStats].sort((a, b) => {
    switch (sortMetric) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'avgResponseTime':
        return a.avgResponseTime - b.avgResponseTime;
      case 'totalResponses':
        return b.totalResponses - a.totalResponses;
      case 'upvotes':
        return b.upvotes - a.upvotes;
      default:
        return 0;
    }
  });

  const topModel = sortedStats[0];

  const handleRefresh = () => {
    if (activeTab === 'feed') {
      refetchFeed();
    } else {
      refetchStats();
    }
  };

  const isLoading = activeTab === 'feed' ? feedLoading : statsLoading;

  return (
    <div className="min-h-screen bg-background">
      <BackgroundEffects />
      <Header />

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Link to="/chat">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                <span className="gradient-text">Community</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore AI comparisons & model leaderboard
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary/50">
            <TabsTrigger value="feed" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {feedLoading ? (
                <div className="text-center py-16">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading community feed...</p>
                </div>
              ) : (
                <CommunityFeed 
                  comparisons={comparisons} 
                  onVote={vote}
                  isAuthenticated={!!user}
                />
              )}
            </motion.div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="stats" className="mt-6 space-y-4 sm:space-y-6">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <StatsOverview
                totalComparisons={totalComparisons}
                totalDebates={totalDebates}
                totalVotes={totalVotes}
                totalModels={modelStats.length}
              />
            </motion.div>

            {/* Sub-tabs for Rankings/Charts */}
            <Tabs value={statsView} onValueChange={setStatsView}>
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
                {statsLoading ? (
                  <Card className="p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </Card>
                ) : (
                  <ModelRankingTable modelStats={sortedStats} />
                )}
              </TabsContent>

              <TabsContent value="charts" className="mt-4">
                {statsLoading ? (
                  <Card className="p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </Card>
                ) : (
                  <PerformanceCharts modelStats={sortedStats} />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
