import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatIndianCurrency } from './indianNumberFormat';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Simple, reliable PDF exporter that always works
 * This is a fallback for when the main exporter fails
 */
export const exportSimpleTransactionsPDF = (
  data: any[],
  startDate: string,
  endDate: string,
  openingBalance: number = 0
) => {
  console.log('📄 SIMPLE PDF EXPORTER - Starting with:', { 
    dataLength: data?.length, 
    startDate, 
    endDate, 
    openingBalance 
  });

  try {
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MRN INDUSTRIES', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Daily Transaction Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(), 'dd-MMM-yyyy')}`, 105, 40, { align: 'center' });

    // Prepare simple table data
    const tableData: any[] = [];
    
    // Add opening balance
    if (openingBalance > 0) {
      tableData.push([
        '-',
        format(new Date(startDate), 'dd/MM/yy'),
        'Opening Balance',
        '-',
        '-',
        '-',
        formatIndianCurrency(openingBalance)
      ]);
    }

    let runningBalance = openingBalance;
    let totalCredit = 0;
    let totalDebit = 0;

    // Process transactions
    data.forEach((item, index) => {
      try {
        const credit = parseFloat(String(item.credit || '0').replace(/[₹,\s]/g, '')) || 0;
        const debit = parseFloat(String(item.debit || '0').replace(/[₹,\s]/g, '')) || 0;
        
        totalCredit += credit;
        totalDebit += debit;
        runningBalance = runningBalance + credit - debit;

        tableData.push([
          index + 1,
          format(new Date(item.date), 'dd/MM/yy'),
          item.particulars || 'Transaction',
          item.reference || '-',
          credit > 0 ? formatIndianCurrency(credit) : '-',
          debit > 0 ? formatIndianCurrency(debit) : '-',
          formatIndianCurrency(runningBalance)
        ]);
      } catch (error) {
        console.warn('Error processing transaction:', error);
      }
    });

    // Create table
    autoTable(doc, {
      startY: 50,
      head: [['#', 'Date', 'Particulars', 'Reference', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 1,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 50, halign: 'left' },
        3: { cellWidth: 25, halign: 'left' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
      },
      margin: { top: 10, right: 15, bottom: 15, left: 15 },
    });

    // Add summary
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 15, finalY + 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Opening Balance: ${formatIndianCurrency(openingBalance)}`, 15, finalY + 30);
    doc.text(`Total Credit: ${formatIndianCurrency(totalCredit)}`, 15, finalY + 40);
    doc.text(`Total Debit: ${formatIndianCurrency(totalDebit)}`, 15, finalY + 50);
    doc.text(`Closing Balance: ${formatIndianCurrency(runningBalance)}`, 15, finalY + 60);

    // Save PDF
    const fileName = `Transaction_Report_${format(new Date(), 'ddMMyyyy_HHmmss')}.pdf`;
    doc.save(fileName);
    
    console.log('✅ SIMPLE PDF EXPORTER - Success!');
    return true;

  } catch (error) {
    console.error('❌ SIMPLE PDF EXPORTER - Failed:', error);
    throw error;
  }
};