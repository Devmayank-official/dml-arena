import { Download, FileJson, FileText, FileCode, FileDown, Lock, Database, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { exportData, ExportFormat, EXPORT_FORMATS, ExportData } from '@/lib/exportUtils';
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
  type?: 'comparison' | 'debate';
  debateRounds?: any[];
  finalAnswer?: string;
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileDown className="h-4 w-4" />,
  json: <FileJson className="h-4 w-4" />,
  yaml: <FileCode className="h-4 w-4" />,
  xml: <FileCode className="h-4 w-4" />,
  md: <FileText className="h-4 w-4" />,
  txt: <FileText className="h-4 w-4" />,
  toml: <FileCode className="h-4 w-4" />,
  py: <FileCode className="h-4 w-4" />,
  js: <FileCode className="h-4 w-4" />,
  csv: <FileSpreadsheet className="h-4 w-4" />,
  sql: <Database className="h-4 w-4" />,
};

const FORMAT_GROUPS = {
  documents: ['pdf', 'md', 'txt'],
  data: ['json', 'yaml', 'xml', 'toml', 'csv', 'sql'],
  code: ['py', 'js'],
};

export function ExportDropdown({ 
  query, 
  responses, 
  createdAt, 
  disabled,
  type = 'comparison',
  debateRounds,
  finalAnswer,
}: ExportDropdownProps) {
  const { toast } = useToast();
  const { canExport } = useSubscription();

  const handleExport = async (format: ExportFormat) => {
    const data: ExportData = { 
      query, 
      responses, 
      createdAt,
      type,
      debateRounds,
      finalAnswer,
    };
    
    try {
      await exportData(data, format);
      
      const formatInfo = EXPORT_FORMATS.find(f => f.id === format);
      toast({
        title: 'Export successful',
        description: `Downloaded as ${formatInfo?.name || format.toUpperCase()}`,
      });
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
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Documents</DropdownMenuLabel>
        {FORMAT_GROUPS.documents.map(id => {
          const format = EXPORT_FORMATS.find(f => f.id === id)!;
          return (
            <DropdownMenuItem 
              key={format.id} 
              onClick={() => handleExport(format.id)} 
              className="gap-2 cursor-pointer"
            >
              {FORMAT_ICONS[format.id]}
              <span>{format.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{format.extension}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Data Formats</DropdownMenuLabel>
        {FORMAT_GROUPS.data.map(id => {
          const format = EXPORT_FORMATS.find(f => f.id === id)!;
          return (
            <DropdownMenuItem 
              key={format.id} 
              onClick={() => handleExport(format.id)} 
              className="gap-2 cursor-pointer"
            >
              {FORMAT_ICONS[format.id]}
              <span>{format.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{format.extension}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Code</DropdownMenuLabel>
        {FORMAT_GROUPS.code.map(id => {
          const format = EXPORT_FORMATS.find(f => f.id === id)!;
          return (
            <DropdownMenuItem 
              key={format.id} 
              onClick={() => handleExport(format.id)} 
              className="gap-2 cursor-pointer"
            >
              {FORMAT_ICONS[format.id]}
              <span>{format.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{format.extension}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}