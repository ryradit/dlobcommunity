'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to load image as base64
async function loadImageAsBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    img.src = imagePath;
  });
}

// Helper function to add diagonal watermark to PDF
function addWatermarkToPDF(pdf: jsPDF, watermarkData: string, opacity: number) {
  const pageCount = (pdf as any).internal.pages.length - 1;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setGState(new (pdf as any).GState({ opacity: opacity }));
    
    // Create a rotated watermark image
    const img = new Image();
    img.src = watermarkData;
    
    // Add watermark at an angle (diagonal)
    const diagonal = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
    const scale = diagonal / 200; // Scale factor for watermark size
    
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: opacity }));
    
    // Translate to center, rotate, then draw
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(240, 240, 240);
    
    // Draw rotated watermark (we'll use text as watermark)
    const doc = pdf as any;
    doc.setTextColor(200, 200, 200);
    doc.setFont('Arial', 'bold');
    doc.setFontSize(80);
    
    // Apply rotation transformation
    const angle = -45; // diagonal angle
    const rad = (angle * Math.PI) / 180;
    
    doc.text('DLOB', centerX, centerY, { 
      align: 'center',
      angle: angle,
      opacity: opacity
    });
    
    pdf.restoreGraphicsState();
  }
}

interface PaymentReceiptData {
  matchNumber: number;
  matchDate: string;
  memberName: string;
  shuttlecockFee: number;
  attendanceFee: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'cancelled' | 'rejected' | 'revision';
  paidAt?: string;
}

interface BulkPaymentData {
  matchNumber: number;
  matchDate: string;
  shuttlecockFee: number;
  attendanceFee: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'cancelled' | 'rejected' | 'revision';
  paidAt?: string;
}

interface MembershipPaymentData {
  month: number;
  year: number;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'cancelled' | 'rejected' | 'revision';
  paidAt?: string;
}

export async function generatePaymentPDF(data: PaymentReceiptData) {
  // Create a temporary container for HTML rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#000';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const paidDate = data.paidAt ? formatDate(data.paidAt) : '';

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/dlob.png" alt="DLOB Logo" style="height: 60px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 28px; color: #333;">STRUK PEMBAYARAN</h1>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">DLOB Community</p>
      <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
    </div>

    <div style="margin-bottom: 20px; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Nama Anggota:</span>
        <span>${data.memberName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Pertandingan #:</span>
        <span>${data.matchNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Tanggal Pertandingan:</span>
        <span>${formatDate(data.matchDate)}</span>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Rincian Pembayaran</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; text-align: left;">Biaya Shuttlecock</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(data.shuttlecockFee)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; text-align: left;">Biaya Kehadiran</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(data.attendanceFee)}</td>
        </tr>
        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
          <td style="padding: 12px 0; text-align: left; font-weight: bold; font-size: 16px;">Total Pembayaran</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px; color: #667eea;">${formatCurrency(data.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
        <span style="font-weight: bold;">Status Pembayaran:</span>
        <span style="padding: 4px 12px; background-color: #10b981; color: white; border-radius: 4px; font-weight: bold;">LUNAS</span>
      </div>
      ${paidDate ? `
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="font-weight: bold;">Tanggal Pembayaran:</span>
          <span>${paidDate}</span>
        </div>
      ` : ''}
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Terima kasih telah menjadi bagian dari DLOB Community</p>
      <p style="margin: 5px 0;">Struk ini adalah bukti pembayaran yang sah</p>
      <p style="margin: 0; margin-top: 15px; color: #ccc;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

    // Add watermark
    try {
      const watermarkData = await loadImageAsBase64('/dlob.png');
      addWatermarkToPDF(pdf, watermarkData, 0.18);
    } catch (error) {
      console.warn('Failed to add watermark:', error);
    }

    // Generate filename with match number and date
    const fileName = `Struk_Pembayaran_Pertandingan_${data.matchNumber}_${new Date(data.matchDate).toISOString().split('T')[0]}.pdf`;

    // Download
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateBulkPaymentPDF(
  memberName: string,
  payments: BulkPaymentData[],
  type: 'all' | 'month' | 'selection' | 'daily',
  month?: number,
  year?: number,
  day?: number,
  membership?: MembershipPaymentData | null
) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '900px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#000';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMonthYear = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  };

  const totalShuttlecock = payments.reduce((sum, p) => sum + p.shuttlecockFee, 0);
  const totalAttendance = payments.reduce((sum, p) => sum + p.attendanceFee, 0);
  const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const paidCount = payments.filter(p => p.paymentStatus === 'paid').length;
  
  const membershipAmount = membership && membership.paymentStatus === 'paid' ? membership.amount : 0;
  const grandTotal = totalAmount + membershipAmount;

  let titleText = 'RINGKASAN PEMBAYARAN SEMUA PERTANDINGAN';
  if (type === 'month' && month && year) {
    const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    titleText = `RINGKASAN PEMBAYARAN - ${monthName.toUpperCase()}`;
  } else if (type === 'selection') {
    titleText = `RINGKASAN PEMBAYARAN TERPILIH`;
  } else if (type === 'daily' && day && month && year) {
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    titleText = `RINGKASAN PEMBAYARAN - ${dateStr.toUpperCase()}`;
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/dlob.png" alt="DLOB Logo" style="height: 60px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 28px; color: #333;">${titleText}</h1>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">DLOB Community</p>
      <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
    </div>

    <div style="margin-bottom: 20px; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Nama Anggota:</span>
        <span>${memberName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Total Pertandingan:</span>
        <span>${payments.length} pertandingan</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Pembayaran Lunas:</span>
        <span>${paidCount} pertandingan</span>
      </div>
      ${membership ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: bold;">Membership:</span>
        <span>${membership.paymentStatus === 'paid' ? '✓ Lunas' : 'Pending'}</span>
      </div>
      ` : ''}
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Daftar Pertandingan</h3>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
            <th style="padding: 8px; text-align: left; font-weight: bold; border-right: 1px solid #ddd;">Match #</th>
            <th style="padding: 8px; text-align: center; font-weight: bold; border-right: 1px solid #ddd;">Tanggal</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">Shuttlecock</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">Kehadiran</th>
            <th style="padding: 8px; text-align: right; font-weight: bold;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((payment, idx) => `
            <tr style="border-bottom: 1px solid #eee; ${idx % 2 === 0 ? 'background-color: #fafafa;' : ''}">
              <td style="padding: 8px; border-right: 1px solid #ddd;">#${payment.matchNumber}</td>
              <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-size: 11px;">${formatDate(payment.matchDate)}</td>
              <td style="padding: 8px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${formatCurrency(payment.shuttlecockFee)}</td>
              <td style="padding: 8px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">${formatCurrency(payment.attendanceFee)}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(payment.totalAmount)}</td>
            </tr>
          `).join('')}
          ${membership && membership.paymentStatus === 'paid' ? `
            <tr style="border-bottom: 1px solid #eee; background-color: #e8f3f8;">
              <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">MEMBERSHIP</td>
              <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-size: 11px;">${formatMonthYear(membership.month, membership.year)}</td>
              <td style="padding: 8px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">-</td>
              <td style="padding: 8px; text-align: right; border-right: 1px solid #ddd; font-size: 11px;">-</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(membership.amount)}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;">

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Ringkasan Total</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; text-align: left;">Total Biaya Shuttlecock</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(totalShuttlecock)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; text-align: left;">Total Biaya Kehadiran</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(totalAttendance)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; text-align: left;">Total Pertandingan</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(totalAmount)}</td>
        </tr>
        ${membership && membership.paymentStatus === 'paid' ? `
        <tr style="border-bottom: 1px solid #eee; background-color: #e8f3f8;">
          <td style="padding: 8px 0; text-align: left; font-weight: bold;">Biaya Membership</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(membership.amount)}</td>
        </tr>
        ` : ''}
        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
          <td style="padding: 12px 0; text-align: left; font-weight: bold; font-size: 16px;">TOTAL PEMBAYARAN</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px;">
            <div style="display: flex; justify-content: flex-end; gap: 10px; align-items: center;">
              <span style="color: #667eea;">${formatCurrency(grandTotal)}</span>
              <span style="padding: 4px 10px; background-color: #10b981; color: white; border-radius: 3px; font-size: 12px;">✓ LUNAS</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Terima kasih telah menjadi bagian dari DLOB Community</p>
      <p style="margin: 5px 0;">Dokumen ini adalah ringkasan pembayaran resmi</p>
      <p style="margin: 0; margin-top: 15px; color: #ccc;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 0;
    let pageNum = 1;

    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 0, yPosition, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      yPosition = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, yPosition, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      pageNum++;
    }

    // Add watermark to all pages
    try {
      const watermarkData = await loadImageAsBase64('/dlob.png');
      addWatermarkToPDF(pdf, watermarkData, 0.18);
    } catch (error) {
      console.warn('Failed to add watermark:', error);
    }

    let fileName = 'Ringkasan_Pembayaran';
    if (type === 'month' && month && year) {
      const monthStr = String(month).padStart(2, '0');
      const yearStr = year;
      fileName = `Ringkasan_Pembayaran_${monthStr}-${yearStr}`;
    } else if (type === 'selection') {
      fileName = `Ringkasan_Pembayaran_Terpilih`;
    } else if (type === 'daily' && day && month && year) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      const yearStr = year;
      fileName = `Ringkasan_Pembayaran_${dayStr}-${monthStr}-${yearStr}`;
    }
    fileName += `_${new Date().toISOString().split('T')[0]}.pdf`;

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
