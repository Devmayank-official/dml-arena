import { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, X, Eye, EyeOff, Percent, Columns2, Columns3, Link2, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getModelById } from '@/lib/models';
import { cn } from '@/lib/utils';
import { computeWordDiff, getSimilarityPercentage, type DiffSegment } from '@/lib/diffUtils';
import { Badge } from '@/components/ui/badge';
import { DiffExportMenu } from '@/components/DiffExportMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
}

interface ResponseDiffViewProps {
  responses: ModelResponse[];
  onClose: () => void;
}

type ScrollRef = React.RefObject<HTMLDivElement | null>;

function DiffHighlightedText({ segments }: { segments: DiffSegment[] }) {
  return (
    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(
            segment.type === 'delete' && 'bg-red-500/20 text-red-700 dark:text-red-300 line-through',
            segment.type === 'insert' && 'bg-green-500/20 text-green-700 dark:text-green-300'
          )}
        >
          {segment.value}
        </span>
      ))}
    </div>
  );
}

function ModelPanel({ 
  model, 
  response, 
  diffSegments, 
  showDiffHighlight,
  scrollRef,
  onScroll
}: { 
  model: string; 
  response: ModelResponse | undefined; 
  diffSegments: DiffSegment[];
  showDiffHighlight: boolean;
  scrollRef?: ScrollRef;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
  const modelInfo = getModelById(model);
  
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 border-b border-border">
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          modelInfo?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
        )} />
        <span className="font-medium text-sm truncate">{modelInfo?.name}</span>
        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
          {((response?.duration || 0) / 1000).toFixed(2)}s
        </span>
      </div>
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="p-4 max-h-[400px] overflow-y-auto scroll-smooth"
      >
        {response ? (
          showDiffHighlight && diffSegments.length > 0 ? (
            <DiffHighlightedText segments={diffSegments} />
          ) : (
            <MarkdownContent content={response.response} className="text-sm" />
          )
        ) : (
          <p className="text-muted-foreground text-sm">Select a model</p>
        )}
      </div>
    </div>
  );
}

export function ResponseDiffView({ responses, onClose }: ResponseDiffViewProps) {
  const validResponses = responses.filter(r => !r.error && r.response);
  const [leftModel, setLeftModel] = useState<string>(validResponses[0]?.model || '');
  const [middleModel, setMiddleModel] = useState<string>(validResponses[2]?.model || '');
  const [rightModel, setRightModel] = useState<string>(validResponses[1]?.model || '');
  const [showDiffHighlight, setShowDiffHighlight] = useState(true);
  const [tripleMode, setTripleMode] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  // Refs for scroll synchronization and export
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const middleScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<boolean>(false);
  const diffContainerRef = useRef<HTMLDivElement>(null);

  const canTripleCompare = validResponses.length >= 3;

  // Sync scroll handler
  const handleSyncScroll = useCallback((source: 'left' | 'middle' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    const target = e.currentTarget;
    const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight);
    
    const scrollToRatio = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current && ref !== (source === 'left' ? leftScrollRef : source === 'middle' ? middleScrollRef : rightScrollRef)) {
        const maxScroll = ref.current.scrollHeight - ref.current.clientHeight;
        ref.current.scrollTop = scrollRatio * maxScroll;
      }
    };
    
    if (source !== 'left') scrollToRatio(leftScrollRef);
    if (tripleMode && source !== 'middle') scrollToRatio(middleScrollRef);
    if (source !== 'right') scrollToRatio(rightScrollRef);
    
    // Debounce to prevent scroll loops
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  }, [syncScroll, tripleMode]);

  const leftResponse = validResponses.find(r => r.model === leftModel);
  const middleResponse = validResponses.find(r => r.model === middleModel);
  const rightResponse = validResponses.find(r => r.model === rightModel);

  // Compute word-level diffs for 2-way comparison
  const { leftDiff, rightDiff, similarity } = useMemo(() => {
    if (!leftResponse?.response || !rightResponse?.response) {
      return { leftDiff: [], rightDiff: [], similarity: 0 };
    }

    const { left, right } = computeWordDiff(leftResponse.response, rightResponse.response);
    const sim = getSimilarityPercentage(leftResponse.response, rightResponse.response);
    
    return { leftDiff: left, rightDiff: right, similarity: sim };
  }, [leftResponse?.response, rightResponse?.response]);

  // Compute diffs for 3-way comparison (left vs middle, middle vs right)
  const tripleDiffs = useMemo(() => {
    if (!tripleMode || !leftResponse?.response || !middleResponse?.response || !rightResponse?.response) {
      return {
        leftDiff: [],
        middleDiffLeft: [],
        middleDiffRight: [],
        rightDiff: [],
        simLeftMiddle: 0,
        simMiddleRight: 0,
        simLeftRight: 0,
      };
    }

    const { left: lm1, right: lm2 } = computeWordDiff(leftResponse.response, middleResponse.response);
    const { left: mr1, right: mr2 } = computeWordDiff(middleResponse.response, rightResponse.response);
    
    const simLM = getSimilarityPercentage(leftResponse.response, middleResponse.response);
    const simMR = getSimilarityPercentage(middleResponse.response, rightResponse.response);
    const simLR = getSimilarityPercentage(leftResponse.response, rightResponse.response);

    return {
      leftDiff: lm1,
      middleDiffLeft: lm2,
      middleDiffRight: mr1,
      rightDiff: mr2,
      simLeftMiddle: simLM,
      simMiddleRight: simMR,
      simLeftRight: simLR,
    };
  }, [tripleMode, leftResponse?.response, middleResponse?.response, rightResponse?.response]);

  if (validResponses.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">Need at least 2 successful responses to compare.</p>
        <Button variant="ghost" size="sm" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  const selectedModels = tripleMode 
    ? [leftModel, middleModel, rightModel] 
    : [leftModel, rightModel];

  return (
    <motion.div
      ref={diffContainerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Compare Responses</span>
          </div>
          {tripleMode ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="gap-1 text-xs">
                <Percent className="h-3 w-3" />
                L↔M: {tripleDiffs.simLeftMiddle}%
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Percent className="h-3 w-3" />
                M↔R: {tripleDiffs.simMiddleRight}%
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Percent className="h-3 w-3" />
                L↔R: {tripleDiffs.simLeftRight}%
              </Badge>
            </div>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Percent className="h-3 w-3" />
              {similarity}% similar
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canTripleCompare && (
            <Button
              variant={tripleMode ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setTripleMode(!tripleMode)}
            >
              {tripleMode ? <Columns3 className="h-3 w-3" /> : <Columns2 className="h-3 w-3" />}
              {tripleMode ? '3-Way' : '2-Way'}
            </Button>
          )}
          <Button
            variant={syncScroll ? "secondary" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setSyncScroll(!syncScroll)}
          >
            {syncScroll ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
            Sync
          </Button>
          <DiffExportMenu targetRef={diffContainerRef} />
          <Button
            variant={showDiffHighlight ? "secondary" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowDiffHighlight(!showDiffHighlight)}
          >
            {showDiffHighlight ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Diff
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diff Legend when highlighting is enabled */}
      {showDiffHighlight && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b border-border text-xs">
          <span className="text-muted-foreground">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
            Removed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
            Added
          </span>
        </div>
      )}

      {/* Model Selectors */}
      <div className={cn(
        "grid gap-4 p-4 border-b border-border",
        tripleMode ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
      )}>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {tripleMode ? 'Left Model' : 'Left Model'}
          </label>
          <Select value={leftModel} onValueChange={setLeftModel}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {validResponses.map(r => {
                const model = getModelById(r.model);
                return (
                  <SelectItem 
                    key={r.model} 
                    value={r.model} 
                    disabled={selectedModels.includes(r.model) && r.model !== leftModel}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        model?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                      )} />
                      {model?.name || r.model}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {tripleMode && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Middle Model</label>
            <Select value={middleModel} onValueChange={setMiddleModel}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {validResponses.map(r => {
                  const model = getModelById(r.model);
                  return (
                    <SelectItem 
                      key={r.model} 
                      value={r.model} 
                      disabled={selectedModels.includes(r.model) && r.model !== middleModel}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          model?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                        )} />
                        {model?.name || r.model}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Right Model</label>
          <Select value={rightModel} onValueChange={setRightModel}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {validResponses.map(r => {
                const model = getModelById(r.model);
                return (
                  <SelectItem 
                    key={r.model} 
                    value={r.model} 
                    disabled={selectedModels.includes(r.model) && r.model !== rightModel}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        model?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                      )} />
                      {model?.name || r.model}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Side by Side Comparison */}
      <div className={cn(
        "grid divide-y md:divide-y-0 md:divide-x divide-border",
        tripleMode ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
      )}>
        {/* Left Panel */}
        <ModelPanel
          model={leftModel}
          response={leftResponse}
          diffSegments={tripleMode ? tripleDiffs.leftDiff : leftDiff}
          showDiffHighlight={showDiffHighlight}
          scrollRef={leftScrollRef}
          onScroll={handleSyncScroll('left')}
        />

        {/* Middle Panel (3-way only) */}
        {tripleMode && (
          <ModelPanel
            model={middleModel}
            response={middleResponse}
            diffSegments={tripleDiffs.middleDiffLeft}
            showDiffHighlight={showDiffHighlight}
            scrollRef={middleScrollRef}
            onScroll={handleSyncScroll('middle')}
          />
        )}

        {/* Right Panel */}
        <ModelPanel
          model={rightModel}
          response={rightResponse}
          diffSegments={tripleMode ? tripleDiffs.rightDiff : rightDiff}
          showDiffHighlight={showDiffHighlight}
          scrollRef={rightScrollRef}
          onScroll={handleSyncScroll('right')}
        />
      </div>
    </motion.div>
  );
}