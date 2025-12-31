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
  const modelResponses = data.responses.map(r => {
    const modelName = getModelName(r.model);
    return `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h2 style="color: #6366f1; margin-bottom: 12px; font-size: 18px;">${modelName}</h2>
        ${r.error 
          ? `<p style="color: #ef4444; padding: 12px; background: #fef2f2; border-radius: 8px;">Error: ${escapeHTML(r.error)}</p>` 
          : `<div style="white-space: pre-wrap; line-height: 1.6; background: #f8fafc; padding: 16px; border-radius: 8px;">${escapeHTML(r.response)}</div>`
        }
        <p style="color: #64748b; margin-top: 8px; font-size: 12px;">
          Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}
        </p>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI Comparison</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1e293b; }
        .query { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
        .meta { color: #64748b; font-size: 14px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
      </style>
    </head>
    <body>
      <h1>AI Model Comparison</h1>
      <div class="query">
        <strong>Query:</strong> ${escapeHTML(data.query)}
      </div>
      <p class="meta">Generated: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
      <hr>
      ${modelResponses}
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
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
