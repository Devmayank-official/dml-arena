import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportDiffAsImage(element: HTMLElement, filename: string = 'diff-comparison'): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to export diff as image:', error);
    throw error;
  }
}

export async function exportDiffAsPDF(element: HTMLElement, filename: string = 'diff-comparison'): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Failed to export diff as PDF:', error);
    throw error;
  }
}
