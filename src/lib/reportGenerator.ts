/**
 * Report Generator Utility
 * Handles PDF generation and sharing for DLOB Community reports
 */

import html2canvas from 'html2canvas';

/**
 * Convert a DOM element (like a chart) to a base64 image
 */
export async function captureElementAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false,
  });

  return canvas.toDataURL('image/png');
}

/**
 * Convert logo image to base64
 */
export async function getLogoAsBase64(logoPath: string = '/dlob.png'): Promise<string> {
  try {
    const response = await fetch(logoPath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

/**
 * Share or download PDF blob
 */
export async function sharePDF(blob: Blob, filename: string): Promise<void> {
  // Check if Web Share API is available and supports files
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename.replace('.pdf', ''),
          text: 'DLOB Community Report',
        });
        return;
      }
    } catch (error) {
      console.log('Share API not supported, falling back to download');
    }
  }

  // Fallback: Download the file
  downloadPDF(blob, filename);
}

/**
 * Download PDF blob
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for reports
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for reports
 */
export function formatReportDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate report filename
 */
export function generateReportFilename(type: string, memberName?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const name = memberName ? `_${memberName.replace(/\s+/g, '_')}` : '';
  return `DLOB_${type}${name}_${date}.pdf`;
}
