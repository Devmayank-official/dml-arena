import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, Sparkles, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CommunityComparison } from '@/hooks/useCommunityFeed';
import { AI_MODELS } from '@/lib/models';
import { formatDistanceToNow } from 'date-fns';

interface CommunityFeedProps {
  comparisons: CommunityComparison[];
  onVote: (comparisonId: string, voteType: 'up' | 'down') => void;
  isAuthenticated: boolean;
}

export function CommunityFeed({ comparisons, onVote, isAuthenticated }: CommunityFeedProps) {
  const navigate = useNavigate();

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No comparisons yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Be the first to share an AI comparison with the community!
        </p>
      </div>
    );
  }

  const handleCardClick = (comparisonId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on voting buttons or profile link
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    navigate(`/chat/community/${comparisonId}`);
  };

  return (
    <div className="space-y-4">
      {comparisons.map((comparison, index) => (
        <motion.div
          key={comparison.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="p-5 bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={(e) => handleCardClick(comparison.id, e)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium line-clamp-2 mb-2">
                  {comparison.query}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {comparison.user_id && (
                    <Link 
                      to={`/chat/profile/${comparison.user_id}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <User className="h-3 w-3" />
                      View profile
                    </Link>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(comparison.created_at), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {comparison.responses.length} models
                  </span>
                </div>
              </div>
              
              {/* Voting */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(comparison.id, 'up')}
                  className={`h-8 px-2 ${
                    comparison.userVote === 'up' 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  disabled={!isAuthenticated}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {comparison.upvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVote(comparison.id, 'down')}
                  className={`h-8 px-2 ${
                    comparison.userVote === 'down' 
                      ? 'text-destructive bg-destructive/10' 
                      : 'text-muted-foreground hover:text-destructive'
                  }`}
                  disabled={!isAuthenticated}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {comparison.downvotes}
                </Button>
              </div>
            </div>

            {/* Model responses preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comparison.responses.slice(0, 3).map((response, idx) => {
                const model = AI_MODELS.find(m => m.id === response.model);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: model?.color || '#888' }}
                      />
                      <span className="text-xs font-medium text-foreground truncate">
                        {model?.name || response.model}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {response.error || response.response.slice(0, 150)}
                      {response.response.length > 150 ? '...' : ''}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* View Full Button */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              {comparison.responses.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{comparison.responses.length - 3} more responses
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-primary ml-auto">
                <span>View full comparison</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
