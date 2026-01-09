import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, X, Eye, EyeOff, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getModelById } from '@/lib/models';
import { cn } from '@/lib/utils';
import { computeWordDiff, getSimilarityPercentage, type DiffSegment } from '@/lib/diffUtils';
import { Badge } from '@/components/ui/badge';
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

export function ResponseDiffView({ responses, onClose }: ResponseDiffViewProps) {
  const validResponses = responses.filter(r => !r.error && r.response);
  const [leftModel, setLeftModel] = useState<string>(validResponses[0]?.model || '');
  const [rightModel, setRightModel] = useState<string>(validResponses[1]?.model || '');
  const [showDiffHighlight, setShowDiffHighlight] = useState(true);

  const leftResponse = validResponses.find(r => r.model === leftModel);
  const rightResponse = validResponses.find(r => r.model === rightModel);

  const leftModelInfo = getModelById(leftModel);
  const rightModelInfo = getModelById(rightModel);

  // Compute word-level diff
  const { leftDiff, rightDiff, similarity } = useMemo(() => {
    if (!leftResponse?.response || !rightResponse?.response) {
      return { leftDiff: [], rightDiff: [], similarity: 0 };
    }

    const { left, right } = computeWordDiff(leftResponse.response, rightResponse.response);
    const sim = getSimilarityPercentage(leftResponse.response, rightResponse.response);
    
    return { leftDiff: left, rightDiff: right, similarity: sim };
  }, [leftResponse?.response, rightResponse?.response]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Compare Responses</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Percent className="h-3 w-3" />
            {similarity}% similar
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-border">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Left Model</label>
          <Select value={leftModel} onValueChange={setLeftModel}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {validResponses.map(r => {
                const model = getModelById(r.model);
                return (
                  <SelectItem key={r.model} value={r.model} disabled={r.model === rightModel}>
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
                  <SelectItem key={r.model} value={r.model} disabled={r.model === leftModel}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left Panel */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 border-b border-border">
            <div className={cn(
              "w-2 h-2 rounded-full",
              leftModelInfo?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
            )} />
            <span className="font-medium text-sm">{leftModelInfo?.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {((leftResponse?.duration || 0) / 1000).toFixed(2)}s
            </span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {leftResponse ? (
              showDiffHighlight && leftDiff.length > 0 ? (
                <DiffHighlightedText segments={leftDiff} />
              ) : (
                <MarkdownContent content={leftResponse.response} className="text-sm" />
              )
            ) : (
              <p className="text-muted-foreground text-sm">Select a model</p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 border-b border-border">
            <div className={cn(
              "w-2 h-2 rounded-full",
              rightModelInfo?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
            )} />
            <span className="font-medium text-sm">{rightModelInfo?.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {((rightResponse?.duration || 0) / 1000).toFixed(2)}s
            </span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {rightResponse ? (
              showDiffHighlight && rightDiff.length > 0 ? (
                <DiffHighlightedText segments={rightDiff} />
              ) : (
                <MarkdownContent content={rightResponse.response} className="text-sm" />
              )
            ) : (
              <p className="text-muted-foreground text-sm">Select a model</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}