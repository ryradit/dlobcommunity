/**
 * useReportGenerator Hook
 * Easy-to-use hook for generating and sharing PDF reports
 */

'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { MemberPerformanceReport, type MemberReportData } from '@/components/reports/MemberPerformanceReport';
import { AdminFinancialReport, type FinancialReportData } from '@/components/reports/AdminFinancialReport';
import { 
  captureElementAsImage, 
  getLogoAsBase64, 
  sharePDF, 
  downloadPDF,
  generateReportFilename,
  formatReportDate
} from '@/lib/reportGenerator';

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate Member Performance Report
   */
  const generateMemberReport = async (
    data: Omit<MemberReportData, 'reportDate' | 'logo' | 'chartImage'>,
    options?: {
      chartElementId?: string;
      share?: boolean;
    }
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get logo as base64
      const logo = await getLogoAsBase64('/dlob.png');

      // Capture chart if element ID provided
      let chartImage: string | undefined;
      if (options?.chartElementId) {
        try {
          chartImage = await captureElementAsImage(options.chartElementId);
        } catch (err) {
          console.warn('Failed to capture chart:', err);
        }
      }

      // Build complete report data
      const reportData: MemberReportData = {
        ...data,
        reportDate: formatReportDate(new Date()),
        logo,
        chartImage,
      };

      // Generate PDF
      const doc = <MemberPerformanceReport data={reportData} />;
      const blob = await pdf(doc).toBlob();
      
      // Generate filename
      const filename = generateReportFilename('Performance_Report', data.memberName);

      // Share or download
      if (options?.share) {
        await sharePDF(blob, filename);
      } else {
        downloadPDF(blob, filename);
      }

      setIsGenerating(false);
      return { success: true, filename };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      setIsGenerating(false);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Generate Admin Financial Report
   */
  const generateFinancialReport = async (
    data: Omit<FinancialReportData, 'reportDate' | 'logo' | 'chartImage'>,
    options?: {
      chartElementId?: string;
      share?: boolean;
    }
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get logo as base64
      const logo = await getLogoAsBase64('/dlob.png');

      // Capture chart if element ID provided
      let chartImage: string | undefined;
      if (options?.chartElementId) {
        try {
          chartImage = await captureElementAsImage(options.chartElementId);
        } catch (err) {
          console.warn('Failed to capture chart:', err);
        }
      }

      // Build complete report data
      const reportData: FinancialReportData = {
        ...data,
        reportDate: formatReportDate(new Date()),
        logo,
        chartImage,
      };

      // Generate PDF
      const doc = <AdminFinancialReport data={reportData} />;
      const blob = await pdf(doc).toBlob();
      
      // Generate filename
      const filename = generateReportFilename('Financial_Report');

      // Share or download
      if (options?.share) {
        await sharePDF(blob, filename);
      } else {
        downloadPDF(blob, filename);
      }

      setIsGenerating(false);
      return { success: true, filename };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      setIsGenerating(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    generateMemberReport,
    generateFinancialReport,
    isGenerating,
    error,
  };
}
