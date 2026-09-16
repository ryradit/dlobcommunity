'use client';

import React, { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

interface DlbcSessionSheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export default function DlbcSessionSheetPrintModal({
  isOpen,
  onClose,
  defaultDate,
}: DlbcSessionSheetPrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const rows = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      {/* Printable Sheet Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 my-auto text-black overflow-x-auto print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-black text-gray-900">
              Template Lembar Pemakaian Kock & Lapangan DLBC
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              A4 Landscape Ready
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET CONTENT */}
        <div ref={printAreaRef} className="print-sheet text-[11px] font-sans text-black">
          {/* Sheet Header */}
          <div className="flex justify-between items-center mb-2 px-1">
            <div>
              <h1 className="text-base font-black tracking-wider uppercase">
                DLOB CIKUPA (DLBC) — LEMBAR PEMAKAIAN KOCK & LAPANGAN
              </h1>
              <p className="text-[10px] text-gray-600">
                Komunitas Badminton DLOB Cikupa
              </p>
            </div>
            <div className="text-right text-[11px] font-semibold space-y-0.5">
              <p>Tanggal: <span className="font-mono">{defaultDate || '................................'}</span></p>
              <p>Sesi / Jam: <span>................................</span></p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-black overflow-hidden">
            <table className="w-full border-collapse text-center border-black">
              <thead>
                {/* Row 1 Header */}
                <tr className="border-b border-black font-bold text-[10px] bg-gray-50 print:bg-transparent">
                  <th rowSpan={2} className="border-r border-black w-8 py-1">NO</th>
                  <th rowSpan={2} className="border-r border-black w-44 py-1">NAMA</th>
                  <th colSpan={10} className="border-r border-black py-1">Pemakaian Kock</th>
                  <th colSpan={2} className="border-r border-black py-1">Total Pemakaian Kock</th>
                  <th rowSpan={1} className="border-r border-black w-24 py-1">Lapangan</th>
                  <th rowSpan={2} className="border-r border-black w-20 py-1">TOTAL</th>
                  <th rowSpan={2} className="w-24 py-1">Keterangan</th>
                </tr>
                {/* Row 2 Sub-Header */}
                <tr className="border-b border-black font-bold text-[9px] bg-gray-50 print:bg-transparent">
                  {/* Matches 1 to 10 */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="border-r border-black w-7 py-1">
                      <span className="block text-[8px] text-gray-500 font-normal">Match</span>
                      <span>{i + 1}</span>
                    </th>
                  ))}
                  {/* Total Pemakaian Kock subheaders */}
                  <th className="border-r border-black w-9 py-0.5">Pcs</th>
                  <th className="border-r border-black w-24 py-0.5 font-normal">
                    <span className="font-bold block">Rp</span>
                    <span className="text-[8px] text-gray-500">(...................)</span>
                  </th>
                  {/* Lapangan subheader */}
                  <th className="border-r border-black w-24 py-0.5 font-normal">
                    <span className="font-bold block">Rp</span>
                    <span className="text-[8px] text-gray-500">(...................)</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((num) => {
                  // Thicker horizontal separation lines matching user template (after rows 3, 17)
                  const isThickBottom = num === 3 || num === 17;
                  const borderBottomClass = isThickBottom 
                    ? 'border-b-2 border-black' 
                    : 'border-b border-black';

                  return (
                    <tr key={num} className={`${borderBottomClass} h-6 print:h-5 text-[10px]`}>
                      <td className="border-r border-black font-bold py-0.5">{num}</td>
                      <td className="border-r border-black text-left px-2 py-0.5 font-medium"></td>
                      {/* 10 Match Columns */}
                      {Array.from({ length: 10 }, (_, mIdx) => (
                        <td key={mIdx} className="border-r border-black py-0.5"></td>
                      ))}
                      {/* Pcs */}
                      <td className="border-r border-black py-0.5"></td>
                      {/* Kok Rp */}
                      <td className="border-r border-black py-0.5"></td>
                      {/* Lapangan Rp */}
                      <td className="border-r border-black py-0.5"></td>
                      {/* TOTAL */}
                      <td className="border-r border-black py-0.5"></td>
                      {/* Keterangan */}
                      <td className="py-0.5"></td>
                    </tr>
                  );
                })}

                {/* GRAND TOTAL ROW */}
                <tr className="font-black text-[11px] bg-gray-50 print:bg-transparent h-7">
                  <td colSpan={12} className="border-r border-black text-center tracking-widest py-1">
                    GRAND TOTAL
                  </td>
                  <td className="border-r border-black py-1"></td>
                  <td className="border-r border-black py-1"></td>
                  <td className="border-r border-black py-1"></td>
                  <td className="border-r border-black py-1"></td>
                  <td className="py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="flex justify-between items-end mt-4 px-6 text-[10px] print:mt-3">
            <div className="text-center">
              <p className="text-gray-600 mb-10">Koordinator Sesi DLBC,</p>
              <p className="border-t border-black font-bold pt-1 min-w-32">( ........................................ )</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-10">Admin / Keuangan DLBC,</p>
              <p className="border-t border-black font-bold pt-1 min-w-32">( ........................................ )</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific style tag */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-sheet,
          .print-sheet * {
            visibility: visible !important;
          }
          .print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: landscape;
            margin: 6mm;
          }
        }
      `}</style>
    </div>
  );
}
