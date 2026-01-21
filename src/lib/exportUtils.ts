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

interface ExportData {
  query: string;
  responses: ModelResponse[];
  createdAt?: string;
}

function getModelName(modelId: string): string {
  return AI_MODELS.find(m => m.id === modelId)?.name || modelId;
}

export function exportAsJSON(data: ExportData): void {
  const exportObj = {
    query: data.query,
    created_at: data.createdAt || new Date().toISOString(),
    responses: data.responses.map(r => ({
      model_id: r.model,
      model_name: getModelName(r.model),
      response: r.response,
      error: r.error || null,
      duration_ms: r.duration,
      tokens: r.tokens || null,
    })),
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `comparison-${Date.now()}.json`);
}

export function exportAsYAML(data: ExportData): void {
  const lines: string[] = [
    `query: "${escapeYAMLString(data.query)}"`,
    `created_at: "${data.createdAt || new Date().toISOString()}"`,
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

  const blob = new Blob([lines.join('\n')], { type: 'text/yaml' });
  downloadBlob(blob, `comparison-${Date.now()}.yaml`);
}

export function exportAsXML(data: ExportData): void {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<comparison>',
    `  <query><![CDATA[${data.query}]]></query>`,
    `  <created_at>${data.createdAt || new Date().toISOString()}</created_at>`,
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
  lines.push('</comparison>');

  const blob = new Blob([lines.join('\n')], { type: 'application/xml' });
  downloadBlob(blob, `comparison-${Date.now()}.xml`);
}

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

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  downloadBlob(blob, `comparison-${Date.now()}.md`);
}

export async function exportAsPDF(data: ExportData): Promise<void> {
  // Create a printable HTML document
  const content = generatePDFHTML(data);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }
  
  printWindow.document.write(content);
  printWindow.document.close();
  
  // Wait for content to load then print
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Model Comparison - CompareAI</title>
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
      <div class="footer">Generated by CompareAI</div>
    </body>
    </html>
  `;
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
