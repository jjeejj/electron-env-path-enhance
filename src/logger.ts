/**
 * Simple logging utility
 */
export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
    private enabled: boolean;

    constructor(enabled: boolean = false) {
        this.enabled = enabled;
    }

    debug(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}

// Default logger instance
export const defaultLogger = new ConsoleLogger();