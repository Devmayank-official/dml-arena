import { Download, FileJson, FileText, FileCode, FileDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportAsJSON, exportAsYAML, exportAsXML, exportAsMarkdown, exportAsPDF } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
}

interface ExportDropdownProps {
  query: string;
  responses: ModelResponse[];
  createdAt?: string;
  disabled?: boolean;
}

export function ExportDropdown({ query, responses, createdAt, disabled }: ExportDropdownProps) {
  const { toast } = useToast();
  const { canExport } = useSubscription();

  const handleExport = async (format: 'json' | 'yaml' | 'xml' | 'md' | 'pdf') => {
    const data = { query, responses, createdAt };
    
    try {
      switch (format) {
        case 'json':
          exportAsJSON(data);
          break;
        case 'yaml':
          exportAsYAML(data);
          break;
        case 'xml':
          exportAsXML(data);
          break;
        case 'md':
          exportAsMarkdown(data);
          break;
        case 'pdf':
          await exportAsPDF(data);
          toast({
            title: 'PDF exported',
            description: 'Downloaded as PDF file',
          });
          break;
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Could not export the comparison',
        variant: 'destructive',
      });
    }
  };

  if (!canExport) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className="gap-2 opacity-50">
              <Lock className="h-4 w-4" />
              Export
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                Pro
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to Pro to export results</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2" data-action="export">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
          <FileDown className="h-4 w-4" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('yaml')} className="gap-2 cursor-pointer">
          <FileCode className="h-4 w-4" />
          YAML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xml')} className="gap-2 cursor-pointer">
          <FileCode className="h-4 w-4" />
          XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('md')} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
