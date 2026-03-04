import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { AnamathEntry } from '../services/api';
import { formatIndianNumber } from './formatters';
import { toTitleCase } from './textUtils';

export interface TransactionExportData {
  date: string;
  particulars: string;
  reference?: string;
  debit: string;
  credit: string;
  txNumber?: string;
  ledger?: string;
}

export const exportToCSV = async (
  data: TransactionExportData[],
  startDate: string,
  endDate: string,
  openingBalance: number,
  totalDebit: number,
  totalCredit: number
) => {
  try {
    // Create workbook for colored Excel export
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data
    const wsData: any[][] = [];
    
    // Company header with styling
    wsData.push(['MRN INDUSTRIES']);
    wsData.push(['Transaction Records']);
    wsData.push(['']);
    
    // Safe date formatting for header
    let headerDate = '';
    try {
      const dateObj = new Date(startDate);
      if (!isNaN(dateObj.getTime())) {
        headerDate = format(dateObj, 'MMM dd, yyyy').toUpperCase();
      } else {
        headerDate = startDate || '';
      }
    } catch (error) {
      headerDate = startDate || '';
    }
    
    wsData.push([headerDate]);
    wsData.push([`OPENING: ₹${openingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`]);
    wsData.push(['']);
    
    // New inline format matching frontend
    wsData.push(['SL. NO', 'DATE', 'TX #', 'TYPE', 'AMOUNT', 'LEDGER', 'DESCRIPTION']);
    
    // Add transactions in inline format
    data.forEach((transaction, index) => {
      const isCredit = parseFloat(transaction.credit) > 0;
      const amount = isCredit ? parseFloat(transaction.credit) : parseFloat(transaction.debit);
      const type = isCredit ? 'CREDIT' : 'DEBIT';
      
      // Safe date formatting
      let formattedDate = '';
      try {
        const dateObj = new Date(transaction.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = format(dateObj, 'dd/MM/yy');
        } else {
          formattedDate = transaction.date || '';
        }
      } catch (error) {
        formattedDate = transaction.date || '';
      }
      
      wsData.push([
        index + 1, // SL. NO
        formattedDate, // DATE
        transaction.txNumber || '—', // TX #
        type, // TYPE
        `₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, // AMOUNT
        transaction.ledger || '', // LEDGER
        transaction.particulars || '' // DESCRIPTION
      ]);
    });
    
    wsData.push(['']);
    
    // Add totals section
    wsData.push(['DAILY TOTALS:']);
    wsData.push(['CREDIT:', `₹${totalCredit.toLocaleString('en-IN', {minimumFractionDigits: 2})}`]);
    wsData.push(['DEBIT:', `₹${totalDebit.toLocaleString('en-IN', {minimumFractionDigits: 2})}`]);
    wsData.push(['NET:', `₹${(totalCredit - totalDebit).toLocaleString('en-IN', {minimumFractionDigits: 2})}`]);
    wsData.push(['CLOSING:', `₹${(openingBalance + totalCredit - totalDebit).toLocaleString('en-IN', {minimumFractionDigits: 2})}`]);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add colors and styling
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Apply center alignment to all cells
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddr]) {
          if (!ws[cellAddr].s) ws[cellAddr].s = {};
          ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
    
    // Style company header (row 1)
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Style transaction records title (row 2)
    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 12, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Style date header (row 4)
    if (ws['A4']) {
      ws['A4'].s = {
        font: { bold: true, color: { rgb: "1E40AF" } },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Style opening balance (row 5)
    if (ws['A5']) {
      ws['A5'].s = {
        font: { bold: true, color: { rgb: "1E40AF" } },
        fill: { fgColor: { rgb: "DBEAFE" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Style table headers (row 7)
    const headerRow = 6;
    for (let col = 0; col < 7; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (ws[cellAddr]) {
        ws[cellAddr].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4B5563" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }
    
    // Style transaction rows with alternating colors and colored TYPE column
    for (let row = headerRow + 1; row < headerRow + 1 + data.length; row++) {
      const isEvenRow = (row - headerRow - 1) % 2 === 0;
      const bgColor = isEvenRow ? "F9FAFB" : "FFFFFF";
      
      for (let col = 0; col < 7; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddr]) {
          // Check if this is the TYPE column (index 3)
          if (col === 3) {
            const cellValue = ws[cellAddr].v;
            const isCredit = cellValue === 'CREDIT';
            ws[cellAddr].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: isCredit ? "16A34A" : "DC2626" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          } else {
            ws[cellAddr].s = {
              fill: { fgColor: { rgb: bgColor } },
              alignment: { horizontal: col === 4 ? "right" : "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          }
        }
      }
    }
    
    // Style daily totals section
    const totalsStartRow = headerRow + data.length + 2;
    for (let row = totalsStartRow; row <= totalsStartRow + 4; row++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (ws[cellAddr]) {
        ws[cellAddr].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1F2937" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      const valueAddr = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (ws[valueAddr]) {
        ws[valueAddr].s = {
          font: { bold: true },
          alignment: { horizontal: "right", vertical: "center" }
        };
      }
    }
    
    // Set column widths for perfect display
    ws['!cols'] = [
      { wch: 8 },   // SL. NO
      { wch: 12 },  // DATE
      { wch: 8 },   // TX #
      { wch: 10 },  // TYPE
      { wch: 15 },  // AMOUNT
      { wch: 20 },  // LEDGER
      { wch: 25 }   // DESCRIPTION
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Records');
    
    // Generate file
    const fileName = `transaction-records-${headerDate.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success(`Excel file exported successfully: ${fileName}`);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export Excel file');
  }
};

export const exportToXlsx = (data: AnamathEntry[], fileName: string) => {
  try {
    const toastId = toast.loading('Preparing Excel export...');
    
    try {
      console.log('Starting Excel export for Anamath Records...');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data with title case formatting and proper structure
      const wsData: any[][] = [];
      
      // Company header - centered
      wsData.push(['MRN INDUSTRIES']);
      wsData.push(['']);
      wsData.push(['ANAMATH OPENING RECORDS']);
      wsData.push(['']);
      
      // Headers
      wsData.push(['SL.NO', 'DATE', 'LEDGER', 'AMOUNT', 'REMARKS', 'STATUS']);
      
      // Data rows
      data.forEach((entry, index) => {
        // Safe date formatting
        let formattedDate = '';
        try {
          const dateObj = new Date(entry.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = format(dateObj, 'dd/MM/yyyy');
          } else {
            formattedDate = entry.date || '';
          }
        } catch (error) {
          formattedDate = entry.date || '';
        }

        wsData.push([
          index + 1,
          formattedDate,
          toTitleCase(entry.ledger?.name || ''),
          formatIndianNumber(entry.amount || 0),
          toTitleCase(entry.remarks || ''),
          toTitleCase(entry.isClosed ? 'Closed' : 'Open')
        ]);
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 8 },   // SL.NO
        { wch: 12 },  // DATE
        { wch: 25 },  // LEDGER
        { wch: 15 },  // AMOUNT
        { wch: 30 },  // REMARKS
        { wch: 12 }   // STATUS
      ];
      
      // Add styles
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Style headers
      for (let col = 0; col <= range.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 4, c: col });
        if (ws[headerCell]) {
          ws[headerCell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
      
      // Style company header
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 14, color: { rgb: "000000" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      if (ws['A3']) {
        ws['A3'].s = {
          font: { bold: true, sz: 12, color: { rgb: "000000" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Anamath Records');
      
      // Download
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      
      toast.dismiss(toastId);
      toast.success('Excel file downloaded successfully!');
      
    } catch (exportError) {
      console.error('Excel export error:', exportError);
      toast.dismiss(toastId);
      toast.error('Failed to export Excel file');
    }
  } catch (error) {
    console.error('Unexpected export error:', error);
    toast.error('Unexpected error during export');
  }
};