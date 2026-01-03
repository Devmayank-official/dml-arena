import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar,
  Trash2,
  MessageSquare,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { useHistory } from '@/hooks/useHistory';
import { useSettings } from '@/hooks/useSettings';
import { ResponseGrid } from '@/components/ResponseGrid';
import { ShareButton } from '@/components/ShareButton';
import { ExportDropdown } from '@/components/ExportDropdown';
import { getModelById } from '@/lib/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type FilterType = 'all' | 'comparison' | 'debate';
type SortType = 'newest' | 'oldest';

export default function History() {
  const { settings } = useSettings();
  const history = useHistory(settings.autoSaveHistory);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortType>('newest');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Combine and filter history
  const combinedHistory = useMemo(() => {
    const comparisons = history.comparisonHistory.map(h => ({
      id: h.id,
      type: 'comparison' as const,
      query: h.query,
      responses: h.responses,
      created_at: h.created_at,
      models: (h.responses as any[]).map(r => r.model),
    }));

    const debates = history.debateHistory.map(h => ({
      id: h.id,
      type: 'debate' as const,
      query: h.query,
      responses: [],
      created_at: h.created_at,
      models: h.models,
      totalRounds: h.total_rounds,
      finalAnswer: h.final_answer,
    }));

    let combined = [...comparisons, ...debates];

    // Filter by type
    if (filterType !== 'all') {
      combined = combined.filter(h => h.type === filterType);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      combined = combined.filter(h => 
        h.query.toLowerCase().includes(query) ||
        h.models.some(m => m.toLowerCase().includes(query))
      );
    }

    // Sort
    combined.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return combined;
  }, [history.comparisonHistory, history.debateHistory, filterType, searchQuery, sortOrder]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 max-w-5xl">
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
              <HistoryIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">History</h1>
                <p className="text-sm text-muted-foreground">
                  {combinedHistory.length} {combinedHistory.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            
            {combinedHistory.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your comparison and debate history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => history.clearHistory()}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Filters */}
          <Card className="p-4 bg-card border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search queries or models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Type Filter */}
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="comparison">Comparisons</SelectItem>
                  <SelectItem value="debate">Debates</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortType)}>
                <SelectTrigger className="w-full sm:w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* History List */}
          {history.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : combinedHistory.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No history found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your filters or search query.'
                  : 'Start comparing AI models to build your history.'}
              </p>
              <Link to="/chat" className="mt-4 inline-block">
                <Button>Start Comparing</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {combinedHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Collapsible open={expandedItems.has(item.id)}>
                      <Card className="bg-card border-border overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className={`p-2 rounded-lg shrink-0 ${
                                item.type === 'debate' 
                                  ? 'bg-accent/20 text-accent' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {item.type === 'debate' ? (
                                  <Brain className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium line-clamp-2">{item.query}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {item.type === 'debate' ? 'Deep Debate' : 'Comparison'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(item.created_at)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.models.length} models
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    {expandedItems.has(item.id) ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {/* Model badges */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.models.slice(0, 4).map(modelId => {
                                    const model = getModelById(modelId);
                                    return (
                                      <span 
                                        key={modelId}
                                        className="text-xs px-2 py-0.5 rounded-full bg-muted"
                                        style={{ 
                                          borderLeft: `3px solid ${model?.color || 'hsl(var(--primary))'}`
                                        }}
                                      >
                                        {model?.name || modelId.split('/')[1]}
                                      </span>
                                    );
                                  })}
                                  {item.models.length > 4 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                      +{item.models.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t border-border p-4 bg-muted/30">
                            {/* Actions */}
                            <div className="flex items-center gap-2 mb-4">
                              <ShareButton
                                onShare={() => history.shareResult(item.id, item.type)}
                              />
                              {item.type === 'comparison' && item.responses.length > 0 && (
                                <ExportDropdown
                                  query={item.query}
                                  responses={item.responses as any}
                                  createdAt={item.created_at}
                                />
                              )}
                            </div>

                            {/* Responses */}
                            {item.type === 'comparison' && item.responses.length > 0 && (
                              <ResponseGrid
                                responses={item.responses as any}
                                loadingModels={[]}
                                historyId={item.id}
                                showVoting
                                onVote={(modelId, type) => history.vote(item.id, 'comparison', modelId, type)}
                                getVote={(modelId) => history.getVote(item.id, modelId)}
                              />
                            )}

                            {item.type === 'debate' && (item as any).finalAnswer && (
                              <div className="p-4 rounded-lg bg-card border border-border">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Brain className="h-4 w-4 text-accent" />
                                  Final Synthesized Answer
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-6">
                                  {(item as any).finalAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
