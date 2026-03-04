// Ultra-simple PDF exporter without autoTable dependency
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { formatIndianCurrency } from './indianNumberFormat';

export interface SimpleTransactionData {
  date: string;
  particulars: string;
  reference?: string;
  debit: string;
  credit: string;
}

export const exportSimplePDFWithoutAutoTable = async (
  data: SimpleTransactionData[],
  title: string,
  startDate: string,
  endDate: string,
  openingBalance: number
): Promise<boolean> => {
  try {
    console.log('Starting simple PDF export without autoTable...');
    
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 20; // Starting Y position

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION REPORT', 20, y);
    y += 15;
    
    // Date and opening balance
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(startDate), 'dd MMM yyyy'), 20, y);
    y += 10;
    doc.text(`Opening Balance: ${formatIndianCurrency(openingBalance)}`, 20, y);
    y += 20;

    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Draw header background (optional)
    doc.setFillColor(230, 230, 230);
    doc.rect(20, y - 5, 250, 10, 'F');
    
    // Header text positioned to align with data
    doc.text('S.No', 25, y);
    doc.text('Date', 50, y);
    doc.text('Particulars', 85, y);
    doc.text('Credit', 150, y);
    doc.text('Debit', 200, y);
    y += 15;

    // Table data
    doc.setFont('helvetica', 'normal');
    let serialNo = 1;

    data.forEach((transaction) => {
      const creditAmount = parseFloat(transaction.credit.replace(/,/g, '')) || 0;
      const debitAmount = parseFloat(transaction.debit.replace(/,/g, '')) || 0;
      
      if (creditAmount > 0 || debitAmount > 0) {
        // Check if we need a new page
        if (y > 180) {
          doc.addPage();
          y = 20;
        }

        doc.text(serialNo.toString(), 25, y);
        doc.text(format(new Date(transaction.date), 'dd-MM-yy'), 50, y);
        
        // Truncate long particulars
        const particulars = transaction.particulars || '';
        const truncatedParticulars = particulars.length > 30 ? particulars.substring(0, 30) + '...' : particulars;
        doc.text(truncatedParticulars, 85, y);
        
        if (creditAmount > 0) {
          // Make credit amounts italic
          doc.setFont('helvetica', 'italic');
          doc.text(formatIndianCurrency(creditAmount), 150, y);
          doc.setFont('helvetica', 'normal'); // Reset to normal
        }
        
        if (debitAmount > 0) {
          // Make debit amounts bold
          doc.setFont('helvetica', 'bold');
          doc.text(formatIndianCurrency(debitAmount), 200, y);
          doc.setFont('helvetica', 'normal'); // Reset to normal
        }
        
        y += 8;
        serialNo++;
      }
    });

    // Add some space before totals
    y += 10;

    // Calculate and display totals
    const totalCredit = data.reduce((sum, item) => sum + (parseFloat(item.credit.replace(/,/g, '')) || 0), 0);
    const totalDebit = data.reduce((sum, item) => sum + (parseFloat(item.debit.replace(/,/g, '')) || 0), 0);
    const closingBalance = openingBalance + totalCredit - totalDebit;

    // Draw totals background
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, 250, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Credit: ${formatIndianCurrency(totalCredit)}`, 25, y);
    doc.text(`Total Debit: ${formatIndianCurrency(totalDebit)}`, 25, y + 8);
    doc.text(`Closing Balance: ${formatIndianCurrency(closingBalance)}`, 25, y + 16);

    // Save PDF
    const fileName = `Transaction_Report_${format(new Date(), 'dd-MM-yyyy_HH-mm-ss')}.pdf`;
    
    try {
      doc.save(fileName);
      console.log('PDF saved successfully');
      return true;
    } catch (saveError) {
      console.log('Direct save failed, trying blob method');
      
      // Fallback to blob download
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('PDF saved using blob method');
      return true;
    }
    
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};