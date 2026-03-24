import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

let XLSX: any = null;

// Initialize XLSX with better error handling
const initializeXLSX = async () => {
  try {
    if (!XLSX) {
      console.log('Initializing XLSX...');
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule.default || xlsxModule;
    }
    
    if (!XLSX) {
      throw new Error('Failed to initialize XLSX library');
    }
    
    console.log('XLSX library initialized successfully');
    return XLSX;
  } catch (error) {
    console.error('Error initializing XLSX library:', error);
    throw new Error(`Failed to initialize Excel export library: ${(error as Error).message}`);
  }
};

export interface TransactionExportData {
  date: string;
  particulars: string;
  reference?: string;
  debit: string;
  credit: string;
}

// Helper function to format numbers in Indian numbering system
const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Helper function to convert pixels to mm (1mm = 3.779528 px)
const pxToMm = (px: number): number => px * 0.264583;

export interface TransactionRow {
  slNo: number;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
}

export const exportToPDF = async (
  data: TransactionExportData[],
  title: string = 'Transaction Report',
  startDate: string,
  endDate: string,
  openingBalance: number,
  overallTotalDebit: number = 0,
  overallTotalCredit: number = 0,
  dailyTotalDebit: number = 0,
  dailyTotalCredit: number = 0
) => {
  try {
    // Initialize jsPDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document properties
    doc.setProperties({
      title: `Transaction Report_${format(new Date(startDate), 'yyyyMMdd')}`,
      subject: 'Transaction Report',
      author: 'Cash Management System',
      creator: 'Cash Management System'
    });

    // Set default font and styles
    doc.setFont('helvetica');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Define margins (in mm)
    const margin = {
      top: 20,
      bottom: 20,
      left: 25,
      right: 25
    };

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yOffset = margin.top;

    // Separate credit and debit transactions
    const creditData: TransactionRow[] = [];
    const debitData: TransactionRow[] = [];
    
    data.forEach((item, index) => {
      const amount = parseFloat(item.credit) || parseFloat(item.debit) || 0;
      const type = item.credit ? 'credit' : 'debit';
      
      const row: TransactionRow = {
        slNo: index + 1,
        date: item.date,
        amount,
        description: item.particulars || '',
        type
      };
      
      if (type === 'credit') {
        creditData.push(row);
      } else {
        debitData.push(row);
      }
    });

    // Calculate totals if not provided
    if (overallTotalCredit === 0 && creditData.length > 0) {
      overallTotalCredit = creditData.reduce((sum, row) => sum + row.amount, 0);
    }
    
    if (overallTotalDebit === 0 && debitData.length > 0) {
      overallTotalDebit = debitData.reduce((sum, row) => sum + row.amount, 0);
    }

    const netTotal = overallTotalCredit - overallTotalDebit;
    const closingBalance = openingBalance + netTotal;

    // Add header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    // Add date range
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `From ${format(new Date(startDate), 'dd-MMM-yyyy')} to ${format(new Date(endDate), 'dd-MMM-yyyy')}`,
      pageWidth / 2,
      yOffset,
      { align: 'center' }
    );
    yOffset += 15;

    // Add opening balance
    doc.setFont('helvetica', 'bold');
    doc.text('Opening Balance:', margin.left, yOffset);
    doc.text(
      formatIndianNumber(openingBalance),
      pageWidth - margin.right,
      yOffset,
      { align: 'right' }
    );
    yOffset += 10;

    // Add totals row
    doc.setFont('helvetica', 'bold');
    doc.text('Totals:', margin.left, yOffset);
    
    // Add credit total (green)
    doc.setTextColor(0, 100, 0); // Dark green
    doc.text(
      formatIndianNumber(overallTotalCredit),
      pageWidth - margin.right - 150,
      yOffset,
      { align: 'right' }
    );
    
    // Add debit total (red)
    doc.setTextColor(178, 34, 34); // Firebrick red
    doc.text(
      formatIndianNumber(overallTotalDebit),
      pageWidth - margin.right - 75,
      yOffset,
      { align: 'right' }
    );
    
    // Add net total (blue)
    doc.setTextColor(0, 0, 139); // Dark blue
    doc.text(
      formatIndianNumber(netTotal),
      pageWidth - margin.right,
      yOffset,
      { align: 'right' }
    );
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    yOffset += 15;

    // Prepare table data
    const tableColumns = [
      { header: '#', dataKey: 'slNo' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Description', dataKey: 'description' }
    ];

    // Add credit transactions table
    doc.setFillColor(230, 255, 230); // Light green background
    doc.rect(margin.left, yOffset, (pageWidth - margin.left - margin.right) / 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Credit Transactions', margin.left + 5, yOffset + 6);
    yOffset += 10;

    (doc as any).autoTable({
      startY: yOffset,
      margin: { left: margin.left, right: margin.left + (pageWidth - margin.left - margin.right) / 2 },
      head: [['#', 'Date', 'Amount', 'Description']],
      body: creditData.map(row => [
        row.slNo,
        format(new Date(row.date), 'dd-MMM-yyyy'),
        { content: formatIndianNumber(row.amount), styles: { halign: 'right' } },
        row.description
      ]),
      headStyles: { fillColor: [34, 139, 34] }, // Forest green header
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: (data: any) => {
        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth - margin.right,
          pageHeight - margin.bottom / 2,
          { align: 'right' }
        );
      }
    });

    // Add debit transactions table
    yOffset = margin.top + 18; // Reset Y position for debit table
    doc.setFillColor(255, 230, 230); // Light red background
    doc.rect(pageWidth / 2, yOffset, (pageWidth - margin.left - margin.right) / 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Debit Transactions', pageWidth / 2 + 5, yOffset + 6);
    yOffset += 10;

    (doc as any).autoTable({
      startY: yOffset,
      margin: { left: pageWidth / 2, right: margin.right },
      head: [['#', 'Date', 'Amount', 'Description']],
      body: debitData.map(row => [
        row.slNo,
        format(new Date(row.date), 'dd-MMM-yyyy'),
        { content: formatIndianNumber(row.amount), styles: { halign: 'right' } },
        row.description
      ]),
      headStyles: { fillColor: [178, 34, 34] }, // Firebrick red header
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: (data: any) => {
        // Add page numbers (already added in credit table)
      }
    });

    // Add closing balance
    yOffset = pageHeight - margin.bottom - 20;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Dark blue
    doc.text(
      `Closing Balance: ${formatIndianNumber(closingBalance)}`,
      pageWidth / 2,
      yOffset,
      { align: 'center' }
    );

    // Add generation timestamp
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${format(new Date(), 'dd-MMM-yyyy hh:mm a')}`,
      pageWidth / 2,
      pageHeight - margin.bottom / 2,
      { align: 'center' }
    );

    // Save the PDF
    const fileName = `Transaction_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

interface FormattedTransaction {
  date: string;
  particulars: string;
  reference: string;
  debit: string;
  credit: string;
  type: 'credit' | 'debit';
  amount: number;
}

export const exportToCSV = async (
  data: TransactionExportData[], 
  startDate: string, 
  endDate: string, 
  openingBalance: number
) => {
  try {
    await initializeXLSX();
    
    // Process and format the data
    const formattedData: FormattedTransaction[] = data.map(item => ({
      ...item,
      reference: item.reference || '', // Ensure reference is always a string
      type: parseFloat(item.credit) > 0 ? 'credit' : 'debit',
      amount: parseFloat(item.credit) || parseFloat(item.debit) || 0
    }));

    // Separate credit and debit transactions
    const creditData = formattedData.filter(item => item.type === 'credit');
    const debitData = formattedData.filter(item => item.type === 'debit');

    // Calculate totals
    const totalCredit = creditData.reduce((sum, item) => sum + item.amount, 0);
    const totalDebit = debitData.reduce((sum, item) => sum + item.amount, 0);
    const closingBalance = openingBalance + totalCredit - totalDebit;

    // Prepare CSV data
    const csvData: any[] = [];
    
    // 1. Opening Balance
    csvData.push(
      ['Opening Balance:', { v: openingBalance, t: 'n', s: { font: { color: { rgb: '0000FF' } } } }],
      []
    );

    // 2. Date
    const formattedDate = format(new Date(startDate), 'dd/MM/yyyy');
    csvData.push(['Date:', formattedDate], []);

    // 3. Credit Section
    csvData.push(
      ['CREDIT'],
      ['SL No', 'Amount', 'Description']
    );
    
    creditData.forEach((item, index) => {
      csvData.push([
        index + 1,  // SL No
        { v: item.amount, t: 'n', z: '#,##0' },  // Amount without decimals
        item.particulars  // Description
      ]);
    });
    
    // Add empty row after credit section
    csvData.push([]);
    
    // 4. Debit Section
    csvData.push(
      ['DEBIT'],
      ['Amount', 'Description']
    );
    
    debitData.forEach(item => {
      csvData.push([
        { v: item.amount, t: 'n', z: '#,##0' },  // Amount without decimals
        item.particulars  // Description
      ]);
    });
    
    // 5. Totals
    csvData.push(
      [],
      ['TOTALS'],
      ['Total Credit:', { v: totalCredit, t: 'n', z: '#,##0' }],
      ['Total Debit:', { v: totalDebit, t: 'n', z: '#,##0' }],
      ['Closing Balance:', { v: closingBalance, t: 'n', z: '#,##0' }]
    );

    // Create worksheet with the formatted data
    const ws = XLSX.utils.aoa_to_sheet(csvData);
    
    // Set column widths
    const wscols = [
      { wch: 15 }, // SL No column
      { wch: 15 }, // Amount column
      { wch: 40 }  // Description column
    ];
    ws['!cols'] = wscols;
    
    // Create workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    // Generate file name with date
    const fileName = `Transactions_${formattedDate.replace(/\//g, '-')}.xlsx`;
    
    // Save the file
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

const formatDateForExport = (date: Date): string => {
  return format(date, 'dd-MMM-yyyy');
};
