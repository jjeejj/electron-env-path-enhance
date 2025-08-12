/**
 * Electron ENV PATH Enhance
 * A TypeScript library to fix PATH environment variable issues in Electron applications
 */

export { PathEnhancer, PathEnhancerOptions } from './path-enhancer';
export { Logger, ConsoleLogger, defaultLogger } from './logger';

// Convenience function exports
import { PathEnhancer } from './path-enhancer';

/**
 * Quickly get enhanced system PATH
 * @param options Configuration options
 * @returns Enhanced PATH string
 */
export function getEnhancedPath(options?: import('./path-enhancer').PathEnhancerOptions): string {
    const enhancer = new PathEnhancer(options);
    return enhancer.getEnhancedSystemPath();
}

/**
 * Quickly apply enhanced PATH to current process
 * @param options Configuration options
 * @returns Applied PATH string
 */
export function applyEnhancedPath(options?: import('./path-enhancer').PathEnhancerOptions): string {
    const enhancer = new PathEnhancer(options);
    return enhancer.applyEnhancedPath();
}

/**
 * Get system original PATH (via command execution)
 * @param options Configuration options
 * @returns System PATH string or null
 */
export function getSystemPath(options?: import('./path-enhancer').PathEnhancerOptions): string | null {
    const enhancer = new PathEnhancer(options);
    return enhancer.getSystemPath();
}

/**
 * Get PATH from Shell configuration files
 * @param options Configuration options
 * @returns Shell configuration PATH string or null
 */
export function getShellConfigPath(options?: import('./path-enhancer').PathEnhancerOptions): string | null {
    const enhancer = new PathEnhancer(options);
    return enhancer.getPathFromShellConfig();
}

// Default export
export default PathEnhancer;