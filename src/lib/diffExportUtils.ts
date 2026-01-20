import html2canvas from 'html2canvas';

export async function exportDiffAsImage(element: HTMLElement, filename: string = 'diff-comparison'): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const link = document.createElement('a');
  link.download = `${filename}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PDF export implemented via browser print-to-PDF.
 * This avoids heavyweight PDF dependencies (and works across browsers).
 */
export async function exportDiffAsPDF(element: HTMLElement, filename: string = 'diff-comparison'): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgDataUrl = canvas.toDataURL('image/png');
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) throw new Error('Popup blocked. Please allow popups to export as PDF.');

  w.document.title = `${filename}-${Date.now()}`;
  w.document.body.style.margin = '0';
  w.document.body.innerHTML = `
    <style>
      @page { margin: 0; }
      body { margin: 0; }
      img { width: 100%; height: auto; display: block; }
    </style>
    <img src="${imgDataUrl}" alt="Diff export" />
  `;

  // Give the browser a moment to paint the image before printing.
  await new Promise((r) => setTimeout(r, 250));
  w.focus();
  w.print();
  w.close();
}
