import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Users, Trophy, MessageSquare, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/leaderboard/StatsOverview';
import { ModelRankingTable } from '@/components/leaderboard/ModelRankingTable';
import { PerformanceCharts } from '@/components/leaderboard/PerformanceCharts';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { AI_MODELS } from '@/lib/models';

export default function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const { modelStats, totalComparisons, totalDebates, totalVotes, isLoading: statsLoading, refetch: refetchStats } = useLeaderboardData();
  const { comparisons, isLoading: feedLoading, user, vote, refetch: refetchFeed } = useCommunityFeed();

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
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-6 md:py-8 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8"
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
                Explore AI comparisons shared by the community
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary/50">
            <TabsTrigger value="feed" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
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

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6 space-y-6">
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
                totalModels={AI_MODELS.length}
              />
            </motion.div>

            {/* Model Rankings */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ModelRankingTable modelStats={modelStats} />
            </motion.div>

            {/* Performance Charts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <PerformanceCharts modelStats={modelStats} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
