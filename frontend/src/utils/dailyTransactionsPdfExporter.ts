import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatIndianCurrency } from './indianNumberFormat';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DailyTransactionExportRow {
  date: string;
  particulars: string;
  ledger?: string;
  credit: string;
  debit: string;
  txNumber?: string;
}

export async function exportDailyTransactionsPDF(
  rows: DailyTransactionExportRow[],
  reportDate: Date,
  openingBalance: number
): Promise<boolean> {
  try {
    if (!rows || rows.length === 0) throw new Error('No transactions to export');

    // Create PDF document with proper dimensions
    const doc = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true // Enable compression for better file size
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Set default font settings for better readability
    doc.setFont('helvetica');
    doc.setFontSize(10);

    // --- 1. Header ---
    const drawHeader = () => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MRN INDUSTRIES', pageWidth / 2, margin, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Daily Transaction Report', pageWidth / 2, margin + 7, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Report Date: ${format(reportDate, 'dd-MMM-yyyy')}`, pageWidth / 2, margin + 12, { align: 'center' });
    };

    // --- 2. Table Settings ---
    const tableSettings = {
      startY: margin + 20,
      margin: { top: 10, right: margin, bottom: 10, left: margin },
      columnStyles: {
        date: { cellWidth: 25 },
        particulars: { cellWidth: 'auto' },
        ledger: { cellWidth: 35 },
        credit: { cellWidth: 25, halign: 'right' },
        debit: { cellWidth: 25, halign: 'right' },
        txNumber: { cellWidth: 20 }
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [220, 220, 220],
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    };

    // --- 3. Footer ---
    const drawFooter = (pageNumber: number, pageCount: number) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = `Page ${pageNumber} of ${pageCount}`;
      const generationDate = `Generated on: ${format(new Date(), 'dd-MMM-yyyy HH:mm')}`;
      
      doc.text(generationDate, margin, pageHeight - margin + 10);
      doc.text(footerText, pageWidth - margin, pageHeight - margin + 10, { align: 'right' });
    };

    // --- 4. Helpers ---
    const toNumber = (val?: string) => {
      if (!val) return 0;
      const clean = String(val).replace(/[^0-9.]/g, '');
      return parseFloat(clean) || 0;
    };

    const tableBody: any[] = rows.map((row, index) => {
      const c = toNumber(row.credit);
      const d = toNumber(row.debit);
      return [
        index + 1,
        format(new Date(row.date), 'dd/MM/yy'),
        row.particulars || '—',
        row.ledger || '—',
        c > 0 ? formatIndianCurrency(c) : '',
        d > 0 ? formatIndianCurrency(d) : ''
      ];
    });

    // Add Opening Balance Row
    tableBody.unshift([
      '',
      '',
      { content: 'Opening Balance', styles: { fontStyle: 'bold' } },
      '',
      '',
      { content: formatIndianCurrency(openingBalance), styles: { fontStyle: 'bold', halign: 'right' } }
    ]);

    // --- 4. AutoTable Generation ---
    autoTable(doc, {
      startY: margin + 20,
        head: [['#', 'Date', 'Particulars', 'Ledger', 'Credit (₹)', 'Debit (₹)']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185], // Professional blue
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
            0: { cellWidth: 10, halign: 'center' },  // #
            1: { cellWidth: 22, halign: 'center' },  // Date
            2: { cellWidth: 86, halign: 'left' },    // Particulars
            3: { cellWidth: 40, halign: 'left' },    // Ledger
            4: { cellWidth: 25, halign: 'right' },   // Credit
            5: { cellWidth: 25, halign: 'right' },   // Debit
      },
      didDrawPage: (data) => {
        drawHeader();
        drawFooter(data.pageNumber, (doc as any).internal.getNumberOfPages());
      },
      margin: { top: margin + 20 }
    });

    // --- 5. Summary Section ---
    const creditTotal = rows.reduce((sum, r) => sum + (r.credit ? parseFloat(r.credit.replace(/,/g, '')) : 0), 0);
    const debitTotal = rows.reduce((sum, r) => sum + (r.debit ? parseFloat(r.debit.replace(/,/g, '')) : 0), 0);
    const closingBalance = openingBalance + creditTotal - debitTotal;
    const finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, finalY + 15);

    autoTable(doc, {
      startY: finalY + 18,
      body: [
        ['Total Credit', { content: formatIndianCurrency(creditTotal), styles: { halign: 'right' } }],
        ['Total Debit', { content: formatIndianCurrency(debitTotal), styles: { halign: 'right' } }],
        ['Closing Balance', { content: formatIndianCurrency(closingBalance), styles: { halign: 'right', fontStyle: 'bold' } }],
      ],
      theme: 'grid',
      styles: { fontStyle: 'bold' },
      columnStyles: {
        0: { fillColor: [236, 240, 241], cellWidth: 105 }, // Labels column consistent
        1: { halign: 'right' as const },
      },
    });

    // --- 6. Save Document ---
    const dateStr = format(reportDate, 'dd-MMM-yyyy');
    doc.save(`Transaction-Report-${dateStr}.pdf`);

    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}
