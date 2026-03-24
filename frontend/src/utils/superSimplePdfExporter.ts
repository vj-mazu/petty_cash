import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { formatIndianCurrency } from './indianNumberFormat';
import { TransactionExportData } from './export';

/**
 * SUPER SIMPLE PDF EXPORTER
 * This exporter creates PDF without using autoTable to avoid compatibility issues
 * It manually draws the table structure for maximum reliability
 */
export const exportSimplePDF = async (
  data: TransactionExportData[],
  startDate: string,
  endDate: string,
  openingBalance: number = 0
): Promise<boolean> => {
  console.log('📄 SIMPLE PDF EXPORTER - Starting with:', { 
    dataLength: data?.length, 
    startDate, 
    endDate, 
    openingBalance 
  });

  try {
    // Validate input
    if (!data || !Array.isArray(data)) {
      console.log('⚠️ No data provided, creating empty report');
      data = [];
    }

    // Create PDF document with proper A4 portrait format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // A4 dimensions: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    let yPosition = 25;

    console.log('📐 PDF Dimensions:', { pageWidth, pageHeight });

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MRN INDUSTRIES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Transaction Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Date range
    const dateRange = startDate && endDate 
      ? `${format(new Date(startDate), 'dd-MMM-yyyy')} to ${format(new Date(endDate), 'dd-MMM-yyyy')}`
      : format(new Date(), 'dd-MMM-yyyy');
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Opening balance
    doc.text(`Opening Balance: ${formatIndianCurrency(openingBalance)}`, margin, yPosition);
    yPosition += 15;

    // Table Header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Define column positions and widths for perfect A4 portrait alignment
    // Total usable width: 210 - 30 = 180mm
    const cols = {
      sno: { x: margin, width: 15 },
      date: { x: margin + 15, width: 22 },
      txNo: { x: margin + 37, width: 18 },
      ledger: { x: margin + 55, width: 55 },
      debit: { x: margin + 110, width: 32 },
      credit: { x: margin + 142, width: 32 },
      remarks: { x: margin + 174, width: 21 }
    };

    // Draw header background with proper width
    doc.setFillColor(66, 139, 202);
    doc.rect(margin, yPosition - 5, 180, 8, 'F');
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.text('S.No', cols.sno.x + 2, yPosition);
    doc.text('Date', cols.date.x + 2, yPosition);
    doc.text('Tx#', cols.txNo.x + 2, yPosition);
    doc.text('Ledger', cols.ledger.x + 2, yPosition);
    doc.text('Debit', cols.debit.x + 2, yPosition);
    doc.text('Credit', cols.credit.x + 2, yPosition);
    doc.text('Remarks', cols.remarks.x + 2, yPosition);
    
    yPosition += 10;

    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Process data and calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = openingBalance;

    // Draw data rows
    data.forEach((transaction, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
        
        // Redraw header on new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(66, 139, 202);
        doc.rect(margin, yPosition - 5, 180, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.text('S.No', cols.sno.x + 2, yPosition);
        doc.text('Date', cols.date.x + 2, yPosition);
        doc.text('Tx#', cols.txNo.x + 2, yPosition);
        doc.text('Ledger', cols.ledger.x + 2, yPosition);
        doc.text('Debit', cols.debit.x + 2, yPosition);
        doc.text('Credit', cols.credit.x + 2, yPosition);
        doc.text('Remarks', cols.remarks.x + 2, yPosition);
        
        yPosition += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      try {
        // Parse debit and credit amounts
        const debitStr = transaction.debit || '';
        const creditStr = transaction.credit || '';
        
        const debit = debitStr ? parseFloat(debitStr.replace(/[₹,]/g, '')) || 0 : 0;
        const credit = creditStr ? parseFloat(creditStr.replace(/[₹,]/g, '')) || 0 : 0;
        
        totalDebit += debit;
        totalCredit += credit;
        runningBalance += (credit - debit);

        // Draw alternating row background
        if (index % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPosition - 3, 180, 6, 'F');
        }

        // Row data with proper text truncation
        const rowData = {
          sno: String(index + 1),
          date: transaction.date ? format(new Date(transaction.date), 'dd/MM/yy') : 'N/A',
          txNo: String(transaction.txNumber || index + 1).substring(0, 6),
          ledger: String(transaction.ledger || 'Unknown').substring(0, 25),
          debit: debitStr || '-',
          credit: creditStr || '-',
          remarks: String(transaction.particulars || '-').substring(0, 12)
        };

        // Draw cell data with proper error handling
        try {
          doc.text(rowData.sno, cols.sno.x + 2, yPosition, { maxWidth: cols.sno.width - 4 });
          doc.text(rowData.date, cols.date.x + 2, yPosition, { maxWidth: cols.date.width - 4 });
          doc.text(rowData.txNo, cols.txNo.x + 2, yPosition, { maxWidth: cols.txNo.width - 4 });
          doc.text(rowData.ledger, cols.ledger.x + 2, yPosition, { maxWidth: cols.ledger.width - 4 });
          doc.text(rowData.debit, cols.debit.x + cols.debit.width - 2, yPosition, { align: 'right', maxWidth: cols.debit.width - 4 });
          doc.text(rowData.credit, cols.credit.x + cols.credit.width - 2, yPosition, { align: 'right', maxWidth: cols.credit.width - 4 });
          doc.text(rowData.remarks, cols.remarks.x + 2, yPosition, { maxWidth: cols.remarks.width - 4 });
        } catch (textError) {
          console.warn(`Text rendering issue at row ${index}:`, textError);
        }

        yPosition += 6;
      } catch (rowError) {
        console.warn(`Row ${index} processing failed:`, rowError);
        yPosition += 6;
      }
    });

    // Add totals row
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition - 3, 180, 8, 'F');
    
    doc.text('TOTAL', cols.sno.x + 2, yPosition);
    doc.text(formatIndianCurrency(totalDebit), cols.debit.x + cols.debit.width - 2, yPosition, { align: 'right' });
    doc.text(formatIndianCurrency(totalCredit), cols.credit.x + cols.credit.width - 2, yPosition, { align: 'right' });
    doc.text(`Closing: ${formatIndianCurrency(runningBalance)}`, cols.remarks.x + 2, yPosition);

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 10);
    }

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `Transaction_Report_${timestamp}.pdf`;

    // Save PDF with error handling
    try {
      doc.save(filename);
      console.log('✅ PDF saved successfully:', filename);
      return true;
    } catch (saveError) {
      console.error('💾 Error saving PDF:', saveError);
      throw new Error(`Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'Unknown save error'}`);
    }

  } catch (error) {
    console.error('🚨 PDF Export failed:', error);
    
    // Create minimal error PDF
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('PDF Export Error', 20, 30);
      doc.setFontSize(12);
      doc.text('An error occurred while generating the PDF report.', 20, 50);
      doc.text('Please try again or contact support.', 20, 70);
      doc.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 20, 90);
      doc.save('Error_Report.pdf');
      console.log('📄 Error report PDF created');
    } catch (finalError) {
      console.error('Even error PDF creation failed:', finalError);
    }
    
    return false;
  }
};

export default exportSimplePDF;