// services/balanceContinuityValidator.js
const { OpeningBalance, Transaction, Ledger, sequelize } = require('../models');
const { Op } = require('sequelize');
const { format, parseISO, addDays, subDays } = require('date-fns');

class BalanceContinuityValidator {
  /**
   * Validate balance continuity across a date range
   */
  async validateContinuity(startDate, endDate) {
    try {
      console.log(`Validating balance continuity from ${startDate} to ${endDate}`);
      
      const dates = this.getDateRange(startDate, endDate);
      const issues = [];
      const validations = [];
      
      for (let i = 1; i < dates.length; i++) {
        const previousDate = dates[i - 1];
        const currentDate = dates[i];
        
        const validation = await this.validateDayTransition(previousDate, currentDate);
        validations.push(validation);
        
        if (!validation.isValid) {
          issues.push(validation);
        }
      }
      
      return {
        success: true,
        isValid: issues.length === 0,
        totalChecks: validations.length,
        passedChecks: validations.length - issues.length,
        failedChecks: issues.length,
        issues,
        validations,
        summary: {
          startDate,
          endDate,
          datesChecked: dates.length,
          continuityStatus: issues.length === 0 ? 'VALID' : 'BROKEN'
        }
      };
      
    } catch (error) {
      console.error('Error validating balance continuity:', error);
      throw new Error(`Failed to validate balance continuity: ${error.message}`);
    }
  }

  /**
   * Validate transition between two consecutive dates
   */
  async validateDayTransition(date1, date2) {
    try {
      // Get closing balance for date1
      const date1Balances = await OpeningBalance.findAll({
        where: { date: date1 },
        include: [{
          model: Ledger,
          as: 'ledger',
          attributes: ['id', 'name', 'ledgerType']
        }]
      });
      
      const date1Closing = date1Balances.reduce((sum, balance) => {
        return sum + parseFloat(balance.closingAmount || 0);
      }, 0);
      
      // Get opening balance for date2
      const date2Balances = await OpeningBalance.findAll({
        where: { date: date2 },
        include: [{
          model: Ledger,
          as: 'ledger',
          attributes: ['id', 'name', 'ledgerType']
        }]
      });
      
      const date2Opening = date2Balances.reduce((sum, balance) => {
        return sum + parseFloat(balance.openingAmount || 0);
      }, 0);
      
      const difference = Math.abs(date1Closing - date2Opening);
      const isValid = difference <= 0.01; // Allow for floating point precision
      
      return {
        isValid,
        previousDate: date1,
        currentDate: date2,
        previousClosing: date1Closing,
        currentOpening: date2Opening,
        difference,
        severity: this.getSeverityLevel(difference),
        message: isValid ? 
          `Balance continuity valid: ${date1} → ${date2}` : 
          `Balance continuity broken: ${date1} closing (₹${date1Closing}) ≠ ${date2} opening (₹${date2Opening}), difference: ₹${difference}`,
        ledgerDetails: {
          date1Ledgers: date1Balances.length,
          date2Ledgers: date2Balances.length,
          date1Balances: date1Balances.map(b => ({
            ledgerName: b.ledger?.name,
            closing: parseFloat(b.closingAmount)
          })),
          date2Balances: date2Balances.map(b => ({
            ledgerName: b.ledger?.name,
            opening: parseFloat(b.openingAmount)
          }))
        }
      };
      
    } catch (error) {
      console.error(`Error validating day transition ${date1} → ${date2}:`, error);
      return {
        isValid: false,
        previousDate: date1,
        currentDate: date2,
        error: error.message,
        severity: 'CRITICAL',
        message: `Error validating transition: ${error.message}`
      };
    }
  }

  /**
   * Fix balance continuity discrepancies
   */
  async fixDiscrepancies(startDate, endDate, options = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        autoFixThreshold = 10, // Auto-fix discrepancies under ₹10
        dryRun = false,
        userId = null 
      } = options;
      
      console.log(`${dryRun ? 'Simulating' : 'Executing'} balance continuity fixes from ${startDate} to ${endDate}`);
      
      const validation = await this.validateContinuity(startDate, endDate);
      
      if (validation.isValid) {
        await transaction.commit();
        return {
          success: true,
          message: 'No balance continuity issues found to fix',
          fixedIssues: 0,
          totalIssues: 0
        };
      }
      
      const fixableIssues = validation.issues.filter(issue => 
        issue.difference <= autoFixThreshold && issue.severity !== 'CRITICAL'
      );
      
      const unfixableIssues = validation.issues.filter(issue => 
        issue.difference > autoFixThreshold || issue.severity === 'CRITICAL'
      );
      
      let fixedCount = 0;
      const fixDetails = [];
      
      for (const issue of fixableIssues) {
        const fixDetail = {
          date: issue.currentDate,
          previousClosing: issue.previousClosing,
          currentOpening: issue.currentOpening,
          difference: issue.difference,
          action: 'UPDATE_OPENING_BALANCE'
        };
        
        if (!dryRun) {
          // Update the current date's opening balances to match previous day's closing
          await this.updateOpeningBalancesToMatch(
            issue.currentDate, 
            issue.previousClosing, 
            transaction,
            userId
          );
          fixedCount++;
        }
        
        fixDetails.push(fixDetail);
      }
      
      if (!dryRun) {
        await transaction.commit();
      } else {
        await transaction.rollback();
      }
      
      return {
        success: true,
        dryRun,
        message: `${dryRun ? 'Would fix' : 'Fixed'} ${fixableIssues.length} out of ${validation.issues.length} issues`,
        fixedIssues: dryRun ? 0 : fixedCount,
        totalIssues: validation.issues.length,
        fixableIssues: fixableIssues.length,
        unfixableIssues: unfixableIssues.length,
        autoFixThreshold,
        fixDetails,
        unfixableDetails: unfixableIssues.map(issue => ({
          date: issue.currentDate,
          difference: issue.difference,
          severity: issue.severity,
          reason: issue.difference > autoFixThreshold ? 'EXCEEDS_THRESHOLD' : 'CRITICAL_ERROR'
        }))
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error fixing balance continuity discrepancies:', error);
      throw new Error(`Failed to fix discrepancies: ${error.message}`);
    }
  }

  /**
   * Update opening balances for a date to match a target total
   */
  async updateOpeningBalancesToMatch(date, targetTotal, transaction, userId = null) {
    // Get all opening balance records for the date
    const balanceRecords = await OpeningBalance.findAll({
      where: { date },
      transaction
    });
    
    if (balanceRecords.length === 0) {
      throw new Error(`No opening balance records found for date ${date}`);
    }
    
    // Calculate current total
    const currentTotal = balanceRecords.reduce((sum, record) => {
      return sum + parseFloat(record.openingAmount || 0);
    }, 0);
    
    const adjustment = targetTotal - currentTotal;
    
    // Distribute the adjustment proportionally across all ledgers
    for (const record of balanceRecords) {
      const currentAmount = parseFloat(record.openingAmount || 0);
      const proportion = currentTotal > 0 ? currentAmount / currentTotal : 1 / balanceRecords.length;
      const adjustmentForLedger = adjustment * proportion;
      const newAmount = currentAmount + adjustmentForLedger;
      
      await record.update({
        openingAmount: newAmount,
        updatedAt: new Date()
      }, { transaction });
    }
    
    console.log(`Updated opening balances for ${date}: ${currentTotal} → ${targetTotal} (adjustment: ${adjustment})`);
  }

  /**
   * Generate comprehensive continuity report
   */
  async generateContinuityReport(startDate, endDate) {
    try {
      console.log(`Generating balance continuity report from ${startDate} to ${endDate}`);
      
      const validation = await this.validateContinuity(startDate, endDate);
      const dates = this.getDateRange(startDate, endDate);
      
      // Get detailed balance information for each date
      const dailyBalances = [];
      
      for (const date of dates) {
        const balances = await OpeningBalance.findAll({
          where: { date },
          include: [{
            model: Ledger,
            as: 'ledger',
            attributes: ['id', 'name', 'ledgerType']
          }]
        });
        
        const totalOpening = balances.reduce((sum, b) => sum + parseFloat(b.openingAmount || 0), 0);
        const totalClosing = balances.reduce((sum, b) => sum + parseFloat(b.closingAmount || 0), 0);
        const totalCredits = balances.reduce((sum, b) => sum + parseFloat(b.totalCredits || 0), 0);
        const totalDebits = balances.reduce((sum, b) => sum + parseFloat(b.totalDebits || 0), 0);
        
        dailyBalances.push({
          date,
          ledgerCount: balances.length,
          totalOpening,
          totalClosing,
          totalCredits,
          totalDebits,
          netChange: totalCredits - totalDebits,
          balances: balances.map(b => ({
            ledgerId: b.ledgerId,
            ledgerName: b.ledger?.name,
            ledgerType: b.ledger?.ledgerType,
            opening: parseFloat(b.openingAmount || 0),
            closing: parseFloat(b.closingAmount || 0),
            credits: parseFloat(b.totalCredits || 0),
            debits: parseFloat(b.totalDebits || 0)
          }))
        });
      }
      
      return {
        success: true,
        reportDate: new Date().toISOString(),
        period: { startDate, endDate },
        summary: validation.summary,
        continuityStatus: validation.isValid ? 'VALID' : 'BROKEN',
        totalIssues: validation.failedChecks,
        dailyBalances,
        issues: validation.issues,
        recommendations: this.generateRecommendations(validation.issues)
      };
      
    } catch (error) {
      console.error('Error generating continuity report:', error);
      throw new Error(`Failed to generate continuity report: ${error.message}`);
    }
  }

  /**
   * Generate recommendations based on continuity issues
   */
  generateRecommendations(issues) {
    const recommendations = [];
    
    if (issues.length === 0) {
      recommendations.push({
        type: 'SUCCESS',
        message: 'Balance continuity is maintained across all dates',
        action: 'No action required'
      });
      return recommendations;
    }
    
    const smallIssues = issues.filter(i => i.difference <= 10);
    const largeIssues = issues.filter(i => i.difference > 10);
    
    if (smallIssues.length > 0) {
      recommendations.push({
        type: 'AUTO_FIX',
        message: `${smallIssues.length} small discrepancies (≤₹10) can be automatically fixed`,
        action: 'Run automatic balance continuity fix',
        affectedDates: smallIssues.map(i => i.currentDate)
      });
    }
    
    if (largeIssues.length > 0) {
      recommendations.push({
        type: 'MANUAL_REVIEW',
        message: `${largeIssues.length} large discrepancies (>₹10) require manual review`,
        action: 'Review transaction history and manually correct balances',
        affectedDates: largeIssues.map(i => i.currentDate)
      });
    }
    
    return recommendations;
  }

  /**
   * Get severity level based on difference amount
   */
  getSeverityLevel(difference) {
    if (difference <= 0.01) return 'NONE';
    if (difference <= 1) return 'LOW';
    if (difference <= 10) return 'MEDIUM';
    if (difference <= 100) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get array of dates between start and end
   */
  getDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  }
}

module.exports = new BalanceContinuityValidator();