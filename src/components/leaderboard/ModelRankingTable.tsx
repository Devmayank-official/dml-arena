import { motion } from 'framer-motion';
import { Trophy, Clock, Coins, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ModelStats } from '@/hooks/useLeaderboardData';

interface ModelRankingTableProps {
  modelStats: ModelStats[];
}

export function ModelRankingTable({ modelStats }: ModelRankingTableProps) {
  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium w-5 text-center">{index + 1}</span>;
  };

  const formatTime = (ms: number) => {
    if (ms === 0) return '-';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return '-';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          Model Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="text-left p-4 font-medium">Rank</th>
                <th className="text-left p-4 font-medium">Model</th>
                <th className="text-center p-4 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    Avg Time
                  </div>
                </th>
                <th className="text-center p-4 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-4 w-4" />
                    Total Tokens
                  </div>
                </th>
                <th className="text-center p-4 font-medium">Responses</th>
                <th className="text-center p-4 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    /
                    <ThumbsDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="text-center p-4 font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {modelStats.map((model, index) => (
                <motion.tr
                  key={model.modelId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankBadge(index)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <div>
                        <p className="font-medium">{model.modelName}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {model.provider}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-sm">
                    {formatTime(model.avgResponseTime)}
                  </td>
                  <td className="p-4 text-center font-mono text-sm">
                    {formatTokens(model.totalTokens)}
                  </td>
                  <td className="p-4 text-center">{model.totalResponses}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-400">{model.upvotes}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-400">{model.downvotes}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{model.winRate.toFixed(1)}%</span>
                      <Progress value={model.winRate} className="w-20 h-2" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 p-4">
          {modelStats.map((model, index) => (
            <motion.div
              key={model.modelId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {getRankBadge(index)}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                  <div>
                    <p className="font-medium text-sm">{model.modelName}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {model.provider}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{model.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">Avg Time</p>
                  <p className="font-mono">{formatTime(model.avgResponseTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tokens</p>
                  <p className="font-mono">{formatTokens(model.totalTokens)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Responses</p>
                  <p>{model.totalResponses}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Votes</p>
                  <p>
                    <span className="text-green-400">{model.upvotes}</span>
                    /
                    <span className="text-red-400">{model.downvotes}</span>
                  </p>
                </div>
              </div>
              <Progress value={model.winRate} className="mt-3 h-1.5" />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
