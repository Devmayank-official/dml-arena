import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getModelById } from '@/lib/models';
import { cn } from '@/lib/utils';
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

export function ResponseDiffView({ responses, onClose }: ResponseDiffViewProps) {
  const validResponses = responses.filter(r => !r.error && r.response);
  const [leftModel, setLeftModel] = useState<string>(validResponses[0]?.model || '');
  const [rightModel, setRightModel] = useState<string>(validResponses[1]?.model || '');

  const leftResponse = validResponses.find(r => r.model === leftModel);
  const rightResponse = validResponses.find(r => r.model === rightModel);

  const leftModelInfo = getModelById(leftModel);
  const rightModelInfo = getModelById(rightModel);

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
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Compare Responses</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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
              <MarkdownContent content={leftResponse.response} className="text-sm" />
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
              <MarkdownContent content={rightResponse.response} className="text-sm" />
            ) : (
              <p className="text-muted-foreground text-sm">Select a model</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}