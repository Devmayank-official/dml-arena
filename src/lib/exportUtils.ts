import { jsPDF } from 'jspdf';
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
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text('AI Model Comparison', margin, y);
  y += 12;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Muted color
  doc.text(`Generated: ${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}`, margin, y);
  y += 15;

  // Query box
  doc.setFillColor(241, 245, 249); // Light gray background
  doc.setDrawColor(99, 102, 241); // Primary border
  const queryLines = doc.splitTextToSize(`Query: ${data.query}`, contentWidth - 10);
  const queryHeight = queryLines.length * 6 + 10;
  doc.roundedRect(margin, y, contentWidth, queryHeight, 3, 3, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(queryLines, margin + 5, y + 8);
  y += queryHeight + 15;

  // Separator line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Responses
  for (const r of data.responses) {
    const modelName = getModelName(r.model);
    
    checkPageBreak(50);

    // Model name
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text(modelName, margin, y);
    y += 8;

    // Response content
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    const responseText = r.error ? `Error: ${r.error}` : r.response;
    const responseLines = doc.splitTextToSize(responseText, contentWidth);
    
    // Calculate if we need multiple pages
    const lineHeight = 5;
    for (let i = 0; i < responseLines.length; i++) {
      checkPageBreak(lineHeight + 5);
      doc.text(responseLines[i], margin, y);
      y += lineHeight;
    }
    y += 5;

    // Duration and tokens
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const metaText = `Duration: ${r.duration}ms${r.tokens ? ` | Tokens: ${r.tokens.total}` : ''}`;
    doc.text(metaText, margin, y);
    y += 15;

    // Separator between responses
    if (data.responses.indexOf(r) < data.responses.length - 1) {
      checkPageBreak(10);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);
      y += 5;
    }
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by CompareAI', margin, pageHeight - 10);

  // Download the PDF
  doc.save(`comparison-${Date.now()}.pdf`);
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
