import { useState } from 'react';
import { Download, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportDiffAsImage, exportDiffAsPDF } from '@/lib/diffExportUtils';
import { useToast } from '@/hooks/use-toast';

interface DiffExportMenuProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
}

export function DiffExportMenu({ targetRef, filename = 'diff-comparison' }: DiffExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'image' | 'pdf') => {
    if (!targetRef.current) {
      toast({
        title: 'Export failed',
        description: 'Could not find the diff view to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'image') {
        await exportDiffAsImage(targetRef.current, filename);
        toast({ title: 'Image exported', description: 'Diff view saved as PNG image.' });
      } else {
        await exportDiffAsPDF(targetRef.current, filename);
        toast({ title: 'PDF exported', description: 'Diff view saved as PDF document.' });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export the diff view. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('image')} className="gap-2">
          <Image className="h-4 w-4" />
          Export as Image (PNG)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
