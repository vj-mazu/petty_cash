// utils/balanceErrorHandler.js
const balanceLogger = require('./balanceLogger');

class BalanceErrorHandler {
  /**
   * Handle balance recalculation errors with proper rollback
   */
  async handleRecalculationError(error, context, transaction = null) {
    try {
      // Log the error with full context
      await balanceLogger.logBalanceError('RECALCULATION_FAILED', error, {
        ...context,
        timestamp: new Date().toISOString(),
        hasTransaction: !!transaction
      });

      // Rollback database transaction if provided
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('Database transaction rolled back successfully');
        } catch (rollbackError) {
          await balanceLogger.logBalanceError('ROLLBACK_FAILED', rollbackError, context);
          throw new Error(`Recalculation failed and rollback also failed: ${rollbackError.message}`);
        }
      }

      // Create user-friendly error message
      const userMessage = this.createUserFriendlyMessage(error, 'recalculation');
      
      return {
        success: false,
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        context: process.env.NODE_ENV === 'development' ? context : undefined,
        timestamp: new Date().toISOString()
      };

    } catch (handlingError) {
      console.error('Error in balance error handler:', handlingError);
      return {
        success: false,
        error: 'A critical error occurred during balance recalculation',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle balance continuity validation errors
   */
  async handleContinuityError(error, context) {
    try {
      await balanceLogger.logBalanceError('CONTINUITY_VALIDATION_FAILED', error, context);

      const userMessage = this.createUserFriendlyMessage(error, 'continuity_validation');
      
      return {
        success: false,
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      };

    } catch (handlingError) {
      console.error('Error in continuity error handler:', handlingError);
      return {
        success: false,
        error: 'Failed to validate balance continuity',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle transaction edit errors that affect balances
   */
  async handleTransactionEditError(error, transactionId, context, transaction = null) {
    try {
      await balanceLogger.logBalanceError('TRANSACTION_EDIT_FAILED', error, {
        transactionId,
        ...context,
        timestamp: new Date().toISOString()
      });

      // Rollback if transaction provided
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('Transaction edit rolled back successfully');
        } catch (rollbackError) {
          await balanceLogger.logBalanceError('TRANSACTION_ROLLBACK_FAILED', rollbackError, {
            transactionId,
            originalError: error.message
          });
        }
      }

      const userMessage = this.createUserFriendlyMessage(error, 'transaction_edit');
      
      return {
        success: false,
        error: userMessage,
        transactionId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      };

    } catch (handlingError) {
      console.error('Error in transaction edit error handler:', handlingErr