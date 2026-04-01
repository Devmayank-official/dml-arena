import { useState } from 'react';
import { Share2, Check, Link, Copy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/features/subscription';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ShareButtonProps {
  onShare: () => Promise<string | null>;
  disabled?: boolean;
}

export function ShareButton({ onShare, disabled }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { canShare } = useSubscription();

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const shareCode = await onShare();
      if (shareCode) {
        const url = `${window.location.origin}/share/${shareCode}`;
        setShareUrl(url);
      } else {
        toast({ title: 'Error', description: 'Failed to create share link', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create share link', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!', description: 'Share link copied to clipboard' });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !shareUrl) {
      handleShare();
    }
    if (!isOpen) {
      setShareUrl(null);
      setCopied(false);
    }
  };

  if (!canShare) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled className="gap-2 opacity-50">
              <Lock className="h-4 w-4" />
              Share
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                Pro
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to Pro to share results</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Share Result
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view this result.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          {isLoading ? (
            <div className="flex-1 h-10 bg-muted rounded-md animate-pulse" />
          ) : shareUrl ? (
            <>
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to generate link</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
