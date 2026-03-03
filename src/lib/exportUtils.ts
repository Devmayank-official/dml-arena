import { AI_MODELS } from './models';

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

export interface ExportData {
  query: string;
  responses: ModelResponse[];
  createdAt?: string;
  type?: 'comparison' | 'debate';
  debateRounds?: any[];
  finalAnswer?: string;
}

function getModelName(modelId: string): string {
  return AI_MODELS.find(m => m.id === modelId)?.name || modelId;
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

function escapeYAMLString(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapePythonString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"').replace(/'/g, "\\'");
}

function escapeJSString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// JSON Export
export function exportAsJSON(data: ExportData): void {
  const exportObj = {
    query: data.query,
    created_at: data.createdAt || new Date().toISOString(),
    type: data.type || 'comparison',
    responses: data.responses.map(r => ({
      model_id: r.model,
      model_name: getModelName(r.model),
      response: r.response,
      error: r.error || null,
      duration_ms: r.duration,
      tokens: r.tokens || null,
    })),
    ...(data.debateRounds && { debate_rounds: data.debateRounds }),
    ...(data.finalAnswer && { final_answer: data.finalAnswer }),
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `comparison-${Date.now()}.json`);
}

// YAML Export
export function exportAsYAML(data: ExportData): void {
  const lines: string[] = [
    `query: "${escapeYAMLString(data.query)}"`,
    `created_at: "${data.createdAt || new Date().toISOString()}"`,
    `type: "${data.type || 'comparison'}"`,
    `responses:`,
  ];

  data.responses.forEach(r => {
    lines.push(`  - model_id: "${r.model}"`);
    lines.push(`    model_name: "${getModelName(r.model)}"`);
    lines.push(`    response: |`);
    r.response.split('\n').forEach(line => {
      lines.push(`      ${line}`);
    });
    if (r.error) lines.push(`    error: "${escapeYAMLString(r.error)}"`);
    lines.push(`    duration_ms: ${r.duration}`);
    if (r.tokens) {
      lines.push(`    tokens:`);
      lines.push(`      prompt: ${r.tokens.prompt}`);
      lines.push(`      completion: ${r.tokens.completion}`);
      lines.push(`      total: ${r.tokens.total}`);
    }
  });

  if (data.finalAnswer) {
    lines.push(`final_answer: |`);
    data.finalAnswer.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/yaml' });
  downloadBlob(blob, `comparison-${Date.now()}.yaml`);
}

// XML Export
export function exportAsXML(data: ExportData): void {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<comparison>',
    `  <query><![CDATA[${data.query}]]></query>`,
    `  <created_at>${data.createdAt || new Date().toISOString()}</created_at>`,
    `  <type>${data.type || 'comparison'}</type>`,
    '  <responses>',
  ];

  data.responses.forEach(r => {
    lines.push('    <response>');
    lines.push(`      <model_id>${escapeXML(r.model)}</model_id>`);
    lines.push(`      <model_name>${escapeXML(getModelName(r.model))}</model_name>`);
    lines.push(`      <content><![CDATA[${r.response}]]></content>`);
    if (r.error) lines.push(`      <error><![CDATA[${r.error}]]></error>`);
    lines.push(`      <duration_ms>${r.duration}</duration_ms>`);
    if (r.tokens) {
      lines.push('      <tokens>');
      lines.push(`        <prompt>${r.tokens.prompt}</prompt>`);
      lines.push(`        <completion>${r.tokens.completion}</completion>`);
      lines.push(`        <total>${r.tokens.total}</total>`);
      lines.push('      </tokens>');
    }
    lines.push('    </response>');
  });

  lines.push('  </responses>');
  
  if (data.finalAnswer) {
    lines.push(`  <final_answer><![CDATA[${data.finalAnswer}]]></final_answer>`);
  }
  
  lines.push('</comparison>');

  const blob = new Blob([lines.join('\n')], { type: 'application/xml' });
  downloadBlob(blob, `comparison-${Date.now()}.xml`);
}

// Markdown Export
export function exportAsMarkdown(data: ExportData): void {
  const lines: string[] = [
    '# AI Model Comparison',
    '',
    `**Query:** ${data.query}`,
    '',
    `**Date:** ${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}`,
    '',
    '---',
    '',
  ];

  data.responses.forEach(r => {
    const modelName = getModelName(r.model);
    lines.push(`## ${modelName}`);
    lines.push('');
    if (r.error) {
      lines.push(`> ⚠️ Error: ${r.error}`);
    } else {
      lines.push(r.response);
    }
    lines.push('');
    lines.push(`*Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}*`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  if (data.finalAnswer) {
    lines.push('## Final Synthesized Answer');
    lines.push('');
    lines.push(data.finalAnswer);
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  downloadBlob(blob, `comparison-${Date.now()}.md`);
}

// Plain Text Export
export function exportAsText(data: ExportData): void {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '                     AI MODEL COMPARISON',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Query: ${data.query}`,
    `Date: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}`,
    '',
    '───────────────────────────────────────────────────────────────',
  ];

  data.responses.forEach(r => {
    const modelName = getModelName(r.model);
    lines.push('');
    lines.push(`▶ ${modelName}`);
    lines.push(`  Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}`);
    lines.push('');
    if (r.error) {
      lines.push(`  [ERROR] ${r.error}`);
    } else {
      r.response.split('\n').forEach(line => {
        lines.push(`  ${line}`);
      });
    }
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
  });

  if (data.finalAnswer) {
    lines.push('');
    lines.push('▶ FINAL SYNTHESIZED ANSWER');
    lines.push('');
    data.finalAnswer.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
  }

  lines.push('');
  lines.push('Generated by DML Arena');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  downloadBlob(blob, `comparison-${Date.now()}.txt`);
}

// TOML Export
export function exportAsTOML(data: ExportData): void {
  const lines: string[] = [
    '[comparison]',
    `query = "${escapeYAMLString(data.query)}"`,
    `created_at = "${data.createdAt || new Date().toISOString()}"`,
    `type = "${data.type || 'comparison'}"`,
    '',
  ];

  data.responses.forEach((r, i) => {
    lines.push(`[[responses]]`);
    lines.push(`model_id = "${r.model}"`);
    lines.push(`model_name = "${getModelName(r.model)}"`);
    lines.push(`response = """${r.response.replace(/"""/g, '\\"\\"\\"')}"""`);
    if (r.error) lines.push(`error = "${escapeYAMLString(r.error)}"`);
    lines.push(`duration_ms = ${r.duration}`);
    if (r.tokens) {
      lines.push(`tokens_prompt = ${r.tokens.prompt}`);
      lines.push(`tokens_completion = ${r.tokens.completion}`);
      lines.push(`tokens_total = ${r.tokens.total}`);
    }
    lines.push('');
  });

  if (data.finalAnswer) {
    lines.push(`[final_answer]`);
    lines.push(`content = """${data.finalAnswer.replace(/"""/g, '\\"\\"\\"')}"""`);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  downloadBlob(blob, `comparison-${Date.now()}.toml`);
}

// Python Export
export function exportAsPython(data: ExportData): void {
  const lines: string[] = [
    '#!/usr/bin/env python3',
    '"""',
    'AI Model Comparison Export',
    `Generated: ${data.createdAt || new Date().toISOString()}`,
    '"""',
    '',
    'comparison_data = {',
    `    "query": '''${escapePythonString(data.query)}''',`,
    `    "created_at": "${data.createdAt || new Date().toISOString()}",`,
    `    "type": "${data.type || 'comparison'}",`,
    '    "responses": [',
  ];

  data.responses.forEach((r, i) => {
    lines.push('        {');
    lines.push(`            "model_id": "${r.model}",`);
    lines.push(`            "model_name": "${getModelName(r.model)}",`);
    lines.push(`            "response": '''${escapePythonString(r.response)}''',`);
    if (r.error) lines.push(`            "error": "${escapePythonString(r.error)}",`);
    lines.push(`            "duration_ms": ${r.duration},`);
    if (r.tokens) {
      lines.push(`            "tokens": {"prompt": ${r.tokens.prompt}, "completion": ${r.tokens.completion}, "total": ${r.tokens.total}},`);
    }
    lines.push(`        }${i < data.responses.length - 1 ? ',' : ''}`);
  });

  lines.push('    ],');
  
  if (data.finalAnswer) {
    lines.push(`    "final_answer": '''${escapePythonString(data.finalAnswer)}''',`);
  }
  
  lines.push('}');
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push('    import json');
  lines.push('    print(json.dumps(comparison_data, indent=2))');

  const blob = new Blob([lines.join('\n')], { type: 'text/x-python' });
  downloadBlob(blob, `comparison-${Date.now()}.py`);
}

// JavaScript Export
export function exportAsJavaScript(data: ExportData): void {
  const lines: string[] = [
    '/**',
    ' * AI Model Comparison Export',
    ` * Generated: ${data.createdAt || new Date().toISOString()}`,
    ' */',
    '',
    'const comparisonData = {',
    `  query: \`${escapeJSString(data.query)}\`,`,
    `  createdAt: "${data.createdAt || new Date().toISOString()}",`,
    `  type: "${data.type || 'comparison'}",`,
    '  responses: [',
  ];

  data.responses.forEach((r, i) => {
    lines.push('    {');
    lines.push(`      modelId: "${r.model}",`);
    lines.push(`      modelName: "${getModelName(r.model)}",`);
    lines.push(`      response: \`${escapeJSString(r.response)}\`,`);
    if (r.error) lines.push(`      error: "${escapeJSString(r.error)}",`);
    lines.push(`      durationMs: ${r.duration},`);
    if (r.tokens) {
      lines.push(`      tokens: { prompt: ${r.tokens.prompt}, completion: ${r.tokens.completion}, total: ${r.tokens.total} },`);
    }
    lines.push(`    }${i < data.responses.length - 1 ? ',' : ''}`);
  });

  lines.push('  ],');
  
  if (data.finalAnswer) {
    lines.push(`  finalAnswer: \`${escapeJSString(data.finalAnswer)}\`,`);
  }
  
  lines.push('};');
  lines.push('');
  lines.push('export default comparisonData;');

  const blob = new Blob([lines.join('\n')], { type: 'text/javascript' });
  downloadBlob(blob, `comparison-${Date.now()}.js`);
}

// CSV Export
export function exportAsCSV(data: ExportData): void {
  const headers = ['Model ID', 'Model Name', 'Response', 'Duration (ms)', 'Tokens', 'Error'];
  const rows = data.responses.map(r => [
    r.model,
    getModelName(r.model),
    `"${r.response.replace(/"/g, '""')}"`,
    r.duration.toString(),
    r.tokens?.total?.toString() || '',
    r.error ? `"${r.error.replace(/"/g, '""')}"` : '',
  ]);

  const csvContent = [
    `# Query: ${data.query.replace(/\n/g, ' ')}`,
    `# Date: ${data.createdAt || new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  downloadBlob(blob, `comparison-${Date.now()}.csv`);
}

// SQLite Export (SQL schema + INSERT statements)
export function exportAsSQLite(data: ExportData): void {
  const timestamp = Date.now();
  const lines: string[] = [
    '-- AI Model Comparison Export',
    `-- Generated: ${data.createdAt || new Date().toISOString()}`,
    '',
    '-- Create tables',
    'CREATE TABLE IF NOT EXISTS comparisons (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  query TEXT NOT NULL,',
    '  type TEXT DEFAULT "comparison",',
    '  created_at TEXT NOT NULL,',
    '  final_answer TEXT',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS responses (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  comparison_id INTEGER NOT NULL,',
    '  model_id TEXT NOT NULL,',
    '  model_name TEXT NOT NULL,',
    '  response TEXT NOT NULL,',
    '  error TEXT,',
    '  duration_ms INTEGER NOT NULL,',
    '  tokens_prompt INTEGER,',
    '  tokens_completion INTEGER,',
    '  tokens_total INTEGER,',
    '  FOREIGN KEY (comparison_id) REFERENCES comparisons(id)',
    ');',
    '',
    '-- Insert comparison',
    `INSERT INTO comparisons (query, type, created_at${data.finalAnswer ? ', final_answer' : ''}) VALUES (`,
    `  '${data.query.replace(/'/g, "''")}',`,
    `  '${data.type || 'comparison'}',`,
    `  '${data.createdAt || new Date().toISOString()}'${data.finalAnswer ? `,\n  '${data.finalAnswer.replace(/'/g, "''")}'` : ''}`,
    ');',
    '',
    '-- Insert responses (using last_insert_rowid() for comparison_id)',
  ];

  data.responses.forEach(r => {
    lines.push(`INSERT INTO responses (comparison_id, model_id, model_name, response, ${r.error ? 'error, ' : ''}duration_ms${r.tokens ? ', tokens_prompt, tokens_completion, tokens_total' : ''}) VALUES (`);
    lines.push('  last_insert_rowid(),');
    lines.push(`  '${r.model}',`);
    lines.push(`  '${getModelName(r.model).replace(/'/g, "''")}',`);
    lines.push(`  '${r.response.replace(/'/g, "''")}',`);
    if (r.error) lines.push(`  '${r.error.replace(/'/g, "''")}',`);
    lines.push(`  ${r.duration}${r.tokens ? `,\n  ${r.tokens.prompt},\n  ${r.tokens.completion},\n  ${r.tokens.total}` : ''}`);
    lines.push(');');
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'application/sql' });
  downloadBlob(blob, `comparison-${Date.now()}.sql`);
}

// PDF Export (browser print)
export async function exportAsPDF(data: ExportData): Promise<void> {
  const content = generatePDFHTML(data);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }
  
  printWindow.document.write(content);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
}

function generatePDFHTML(data: ExportData): string {
  const responsesHTML = data.responses.map(r => {
    const modelName = getModelName(r.model);
    const responseContent = r.error 
      ? `<div class="error">Error: ${escapeHTML(r.error)}</div>`
      : `<div class="response-content">${escapeHTML(r.response).replace(/\n/g, '<br>')}</div>`;
    
    return `
      <div class="response-card">
        <h3>${escapeHTML(modelName)}</h3>
        ${responseContent}
        <div class="meta">Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}</div>
      </div>
    `;
  }).join('');

  const finalAnswerHTML = data.finalAnswer ? `
    <div class="final-answer">
      <h2>Final Synthesized Answer</h2>
      <div class="response-content">${escapeHTML(data.finalAnswer).replace(/\n/g, '<br>')}</div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Model Comparison - DML Arena</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1e293b;
          line-height: 1.6;
        }
        h1 { color: #6366f1; margin-bottom: 10px; }
        .date { color: #64748b; font-size: 14px; margin-bottom: 20px; }
        .query-box {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 30px;
        }
        .query-label { font-weight: 600; color: #475569; }
        .response-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .response-card h3 { color: #6366f1; margin-bottom: 12px; }
        .response-content { color: #334155; white-space: pre-wrap; }
        .error { color: #dc2626; font-style: italic; }
        .meta { color: #94a3b8; font-size: 12px; margin-top: 12px; }
        .final-answer {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        .final-answer h2 { color: #92400e; margin-bottom: 12px; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .response-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>AI Model Comparison</h1>
      <div class="date">Generated: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
      <div class="query-box">
        <span class="query-label">Query:</span> ${escapeHTML(data.query)}
      </div>
      ${responsesHTML}
      ${finalAnswerHTML}
      <div class="footer">Generated by DML Arena</div>
    </body>
    </html>
  `;
}

// Export format types
export type ExportFormat = 'pdf' | 'json' | 'yaml' | 'xml' | 'md' | 'txt' | 'toml' | 'py' | 'js' | 'csv' | 'sql';

export const EXPORT_FORMATS: { id: ExportFormat; name: string; extension: string }[] = [
  { id: 'pdf', name: 'PDF Document', extension: '.pdf' },
  { id: 'json', name: 'JSON', extension: '.json' },
  { id: 'yaml', name: 'YAML', extension: '.yaml' },
  { id: 'xml', name: 'XML', extension: '.xml' },
  { id: 'md', name: 'Markdown', extension: '.md' },
  { id: 'txt', name: 'Plain Text', extension: '.txt' },
  { id: 'toml', name: 'TOML', extension: '.toml' },
  { id: 'py', name: 'Python', extension: '.py' },
  { id: 'js', name: 'JavaScript', extension: '.js' },
  { id: 'csv', name: 'CSV', extension: '.csv' },
  { id: 'sql', name: 'SQLite', extension: '.sql' },
];

// Main export function
export async function exportData(data: ExportData, format: ExportFormat): Promise<void> {
  switch (format) {
    case 'pdf':
      await exportAsPDF(data);
      break;
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
    case 'txt':
      exportAsText(data);
      break;
    case 'toml':
      exportAsTOML(data);
      break;
    case 'py':
      exportAsPython(data);
      break;
    case 'js':
      exportAsJavaScript(data);
      break;
    case 'csv':
      exportAsCSV(data);
      break;
    case 'sql':
      exportAsSQLite(data);
      break;
  }
}