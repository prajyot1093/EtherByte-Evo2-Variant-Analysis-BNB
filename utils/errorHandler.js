/**
 * Enhanced Error Handler Utility
 * Provides better error handling and logging for blockchain interactions
 * Added for improved debugging and user experience
 */

class ErrorHandler {
    static logError(error, context = '') {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ${context}:`, error);
    }

    static formatWeb3Error(error) {
        if (error.code === 4001) {
            return "Transaction rejected by user";
        }
        if (error.code === -32603) {
            return "Internal JSON-RPC error. Please try again.";
        }
        if (error.message.includes("insufficient funds")) {
            return "Insufficient funds for transaction";
        }
        return error.message || "Unknown error occurred";
    }

    static async handleAsyncError(asyncFn, context = '') {
        try {
            return await asyncFn();
        } catch (error) {
            this.logError(error, context);
            throw new Error(this.formatWeb3Error(error));
        }
    }
}

module.exports = ErrorHandler;