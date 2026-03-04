// utils/balanceLogger.js
const fs = require('fs').promises;
const path = require('path');

class BalanceLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log balance recalculation events
   */
  async logBalanceRecalculation(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      level: 'INFO'
    };

    await this.writeLog('balance-recalculation', logEntry);
    console.log(`[BALANCE_RECALC] ${event}:`, data);
  }

  /**
   * Log balance continuity issues
   */
  async logContinuityIssue(issue, severity = 'WARN') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'CONTINUITY_ISSUE',
      severity,
      issue,
      level: severity
    };

    await this.writeLog('balance-continuity', logEntry);
    console.warn(`[BALANCE_CONTINUITY] ${severity}:`, issue);
  }

  /**
   * Log balance calculation errors
   */
  async logBalanceError(operation, error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'BALANCE_ERROR',
      operation,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      level: 'ERROR'
    };

    await this.writeLog('balance-errors', logEntry);
    console.error(`[BALANCE_ERROR] ${operation}:`, error.message, context);
  }

  /**
   * Log successful balance operations
   */
  async logBalanceSuccess(operation, result, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'BALANCE_SUCCESS',
      operation,
      result,
      context,
      level: 'INFO'
    };

    await this.writeLog('balance-operations', logEntry);
    console.log(`[BALANCE_SUCCESS] ${operation}:`, result);
  }

  /**
   * Log transaction edit impacts on balance
   */
  async logTransactionEditImpact(transactionId, oldData, newData, balanceImpact) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'TRANSACTION_EDIT_IMPACT',
      transactionId,
      changes: {
        old: oldData,
        new: newData
      },
      balanceImpact,
      level: 'INFO'
    };

    await this.writeLog('transaction-edits', logEntry);
    console.log(`[TRANSACTION_EDIT] ${transactionId}:`, balanceImpact);
  }

  /**
   * Write log entry to file
   */
  async writeLog(logType, logEntry) {
    try {
      const logFile = path.join(this.logDir, `${logType}-${this.getDateString()}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Get current date string for log file naming
   */
  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Clean up old log files (keep last 30 days)
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < thirtyDaysAgo) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

module.exports = new BalanceLogger();