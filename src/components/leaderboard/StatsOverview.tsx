import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, ThumbsUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsOverviewProps {
  totalComparisons: number;
  totalDebates: number;
  totalVotes: number;
  totalModels: number;
}

export function StatsOverview({ totalComparisons, totalDebates, totalVotes, totalModels }: StatsOverviewProps) {
  const stats = [
    {
      label: 'Total Comparisons',
      value: totalComparisons,
      icon: BarChart3,
      color: 'text-primary',
    },
    {
      label: 'Deep Debates',
      value: totalDebates,
      icon: MessageSquare,
      color: 'text-accent',
    },
    {
      label: 'Total Votes',
      value: totalVotes,
      icon: ThumbsUp,
      color: 'text-green-400',
    },
    {
      label: 'AI Models',
      value: totalModels,
      icon: Zap,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
