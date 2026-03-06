import { Download, FileJson, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getModelById } from '@/lib/models';

interface ComparisonItem {
  id: string;
  query: string;
  responses: any[];
  created_at: string;
}

interface DebateItem {
  id: string;
  query: string;
  models: string[];
  final_answer: string | null;
  total_rounds: number;
  created_at: string;
}

interface BulkExportProps {
  comparisons: ComparisonItem[];
  debates: DebateItem[];
}

function getModelName(modelId: string): string {
  return getModelById(modelId)?.name || modelId;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BulkExport({ comparisons, debates }: BulkExportProps) {
  const { toast } = useToast();
  const totalItems = comparisons.length + debates.length;

  const exportAsJSON = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_comparisons: comparisons.length,
      total_debates: debates.length,
      comparisons: comparisons.map(c => ({
        id: c.id,
        query: c.query,
        created_at: c.created_at,
        responses: c.responses.map((r: any) => ({
          model_id: r.model,
          model_name: getModelName(r.model),
          response: r.response,
          error: r.error || null,
          duration_ms: r.duration,
          tokens: r.tokens || null,
        })),
      })),
      debates: debates.map(d => ({
        id: d.id,
        query: d.query,
        created_at: d.created_at,
        models: d.models.map(m => ({ id: m, name: getModelName(m) })),
        total_rounds: d.total_rounds,
        final_answer: d.final_answer,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `dmlarena-history-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: 'Export complete',
      description: `Exported ${totalItems} items as JSON`,
    });
  };

  const exportAsCSV = () => {
    const rows: string[] = [
      'Type,ID,Query,Created At,Models,Response Summary',
    ];

    comparisons.forEach(c => {
      const models = c.responses.map((r: any) => getModelName(r.model)).join('; ');
      const summary = c.responses.map((r: any) => 
        `${getModelName(r.model)}: ${r.response?.slice(0, 100) || r.error || 'N/A'}...`
      ).join(' | ');
      rows.push([
        'Comparison',
        c.id,
        `"${c.query.replace(/"/g, '""')}"`,
        c.created_at,
        `"${models}"`,
        `"${summary.replace(/"/g, '""')}"`,
      ].join(','));
    });

    debates.forEach(d => {
      const models = d.models.map(m => getModelName(m)).join('; ');
      const summary = d.final_answer ? d.final_answer.slice(0, 200) + '...' : 'No final answer';
      rows.push([
        'Debate',
        d.id,
        `"${d.query.replace(/"/g, '""')}"`,
        d.created_at,
        `"${models}"`,
        `"${summary.replace(/"/g, '""')}"`,
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `dmlarena-history-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: 'Export complete',
      description: `Exported ${totalItems} items as CSV`,
    });
  };

  const exportAsMarkdown = () => {
    const lines: string[] = [
      '# DML Arena History Export',
      '',
      `**Exported:** ${new Date().toLocaleString()}`,
      '',
      `**Total Comparisons:** ${comparisons.length}`,
      `**Total Debates:** ${debates.length}`,
      '',
      '---',
      '',
    ];

    if (comparisons.length > 0) {
      lines.push('## Comparisons', '');
      
      comparisons.forEach((c, i) => {
        lines.push(`### ${i + 1}. ${c.query.slice(0, 80)}${c.query.length > 80 ? '...' : ''}`);
        lines.push('');
        lines.push(`*Created: ${new Date(c.created_at).toLocaleString()}*`);
        lines.push('');
        
        c.responses.forEach((r: any) => {
          lines.push(`#### ${getModelName(r.model)}`);
          lines.push('');
          if (r.error) {
            lines.push(`> ⚠️ Error: ${r.error}`);
          } else {
            lines.push(r.response || 'No response');
          }
          lines.push('');
          lines.push(`*Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}*`);
          lines.push('');
        });
        
        lines.push('---', '');
      });
    }

    if (debates.length > 0) {
      lines.push('## Deep Debates', '');
      
      debates.forEach((d, i) => {
        lines.push(`### ${i + 1}. ${d.query.slice(0, 80)}${d.query.length > 80 ? '...' : ''}`);
        lines.push('');
        lines.push(`*Created: ${new Date(d.created_at).toLocaleString()}*`);
        lines.push('');
        lines.push(`**Models:** ${d.models.map(m => getModelName(m)).join(', ')}`);
        lines.push('');
        lines.push(`**Rounds:** ${d.total_rounds}`);
        lines.push('');
        
        if (d.final_answer) {
          lines.push('#### Final Synthesized Answer');
          lines.push('');
          lines.push(d.final_answer);
          lines.push('');
        }
        
        lines.push('---', '');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    downloadBlob(blob, `dmlarena-history-${new Date().toISOString().split('T')[0]}.md`);
    
    toast({
      title: 'Export complete',
      description: `Exported ${totalItems} items as Markdown`,
    });
  };

  if (totalItems === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
          <FileJson className="h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsMarkdown} className="gap-2">
          <FileText className="h-4 w-4" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
