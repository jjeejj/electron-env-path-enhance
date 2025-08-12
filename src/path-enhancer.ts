import { execSync } from 'child_process';
import * as fs from 'fs';
import { Logger, defaultLogger } from './logger';

/**
 * PATH enhancer configuration options
 */
export interface PathEnhancerOptions {
    /** Enable debug logging */
    debug?: boolean;
    /** Custom logger */
    logger?: Logger;
    /** Command execution timeout in milliseconds */
    timeout?: number;
    /** Whether to validate path existence */
    validatePaths?: boolean;
}

/**
 * PATH enhancer class
 * Used to solve PATH environment variable loss issues in Electron applications
 */
export class PathEnhancer {
    private logger: Logger;
    private options: Required<PathEnhancerOptions>;

    constructor(options: PathEnhancerOptions = {}) {
        this.options = {
            debug: options.debug ?? false,
            logger: options.logger ?? defaultLogger,
            timeout: options.timeout ?? 5000,
            validatePaths: options.validatePaths ?? true,
        };

        this.logger = this.options.logger;
        if (this.options.debug && this.logger === defaultLogger) {
            (this.logger as any).setEnabled?.(true);
        }
    }

    /**
     * Parse variable values from shell configuration files
     */
    private resolveVariableFromShellConfig(
        variableName: string,
        shellConfigContent: string
    ): string | undefined {
        // Match variable definitions, supporting multiple formats:
        // export VAR=value
        // VAR=value
        // export VAR="value"
        // export VAR='value'
        const patterns = [
            // Match quoted variable definitions
            new RegExp(`export\\s+${variableName}=["']([^"']*?)["']`, 'g'),
            new RegExp(`^${variableName}=["']([^"']*?)["']`, 'gm'),
            // Match unquoted variable definitions (to end of line or space)
            new RegExp(`export\\s+${variableName}=([^\\s\\n]+)`, 'g'),
            new RegExp(`^${variableName}=([^\\s\\n]+)`, 'gm'),
        ];

        for (const pattern of patterns) {
            const matches = [...shellConfigContent.matchAll(pattern)];
            if (matches.length > 0) {
                // Take the last match (latest definition)
                const lastMatch = matches[matches.length - 1];
                const value = lastMatch[1];
                if (value && value.trim()) {
                    return value.trim();
                }
            }
        }
        return undefined;
    }

    /**
     * Get the real system PATH environment variable
     * Obtain complete PATH by executing system commands to avoid incomplete environment variables in Electron applications
     */
    public getSystemPath(): string | null {
        try {
            let command: string;

            if (process.platform === 'win32') {
                // Windows: Use cmd to get PATH
                command = 'echo %PATH%';
            } else {
                // macOS/Linux: Use shell to get PATH
                // Use login shell to ensure complete environment variables
                command =
                    process.platform === 'darwin'
                        ? '/bin/bash -l -c "echo $PATH"' // macOS uses login shell
                        : '/bin/bash -c "echo $PATH"'; // Linux
            }

            let systemPath = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: this.options.timeout,
            }).trim();

            if (systemPath && systemPath !== '%PATH%') {
                const home = process.env.HOME || process.env.USERPROFILE;
                if (home) {
                    systemPath =
                        systemPath +
                        `:${home}/.pyenv/shims:${home}/.local/bin:${home}/bin:${home}/.pub-cache/bin:/opt/homebrew/sbin:/opt/homebrew/bin`;
                }
                return systemPath;
            }
        } catch (error) {
            this.logger.debug('Failed to get system PATH:', error);
        }

        return null;
    }

    /**
     * Get PATH from shell configuration files
     * As a fallback solution for getting system PATH
     */
    public getPathFromShellConfig(): string | null {
        if (process.platform === 'win32') {
            return null; // Not applicable for Windows
        }

        const home = process.env.HOME;
        if (!home) return null;

        // Common shell configuration files
        const configFiles = [
            `${home}/.zshrc`,
            `${home}/.bashrc`,
            `${home}/.bash_profile`,
            `${home}/.profile`,
        ];

        const allPaths: string[] = [];

        try {
            for (const configFile of configFiles) {
                if (fs.existsSync(configFile)) {
                    const content = fs.readFileSync(configFile, 'utf8');

                    // Find all PATH export statements
                    const pathMatches = content.match(/export\s+PATH=["']?([^"'\n]+)["']?/g);
                    if (pathMatches && pathMatches.length > 0) {
                        for (const pathMatch of pathMatches) {
                            const pathValue = pathMatch.match(
                                /export\s+PATH=["']?([^"'\n]+)["']?/
                            )?.[1];
                            if (pathValue) {
                                // Parse all paths in PATH definition
                                const extractedPaths = this.extractPathsFromDefinition(
                                    pathValue,
                                    content
                                );
                                allPaths.push(...extractedPaths);
                            }
                        }
                    }
                }
            }

            if (allPaths.length > 0) {
                // Remove duplicates while maintaining order
                const uniquePaths = [...new Set(allPaths)];

                // Perform final variable substitution for each path, discard unresolvable paths
                const resolvedPaths = uniquePaths
                    .map((path) => {
                        let resolvedPath = path;

                        // Replace HOME variable
                        resolvedPath = resolvedPath
                            .replace(/\$HOME/g, home)
                            .replace(/\$\{HOME\}/g, home);

                        // If path still contains unresolved variables, try to resolve from environment variables
                        if (resolvedPath.includes('$')) {
                            const variablePattern = /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g;
                            let hasUnresolvedVars = false;

                            resolvedPath = resolvedPath.replace(
                                variablePattern,
                                (match, varName) => {
                                    const envValue = process.env[varName];
                                    if (envValue) {
                                        return envValue;
                                    }
                                    // If unable to resolve, mark as having unresolved variables
                                    this.logger.debug(
                                        `Unable to resolve variable ${varName}, discarding path: ${path}`
                                    );
                                    hasUnresolvedVars = true;
                                    return match;
                                }
                            );

                            // If there are unresolved variables, return null to discard
                            if (hasUnresolvedVars) {
                                return null;
                            }
                        }

                        return resolvedPath;
                    })
                    .filter((path): path is string => path !== null); // Filter out null values

                if (resolvedPaths.length > 0) {
                    return resolvedPaths.join(':');
                }
            }
        } catch (error) {
            this.logger.debug('Failed to read shell configuration files:', error);
        }
        return null;
    }

    /**
     * Extract all paths from PATH definition, excluding $PATH and ${PATH}, resolving other variables
     */
    private extractPathsFromDefinition(pathValue: string, shellConfigContent: string): string[] {
        const paths: string[] = [];

        // Split paths by colon
        const pathSegments = pathValue.split(':');

        for (const segment of pathSegments) {
            const trimmedSegment = segment.trim();
            if (!trimmedSegment) continue;

            // Skip $PATH and ${PATH}
            if (trimmedSegment === '$PATH' || trimmedSegment === '${PATH}') {
                continue;
            }

            // If contains variables, try to resolve
            if (trimmedSegment.includes('$')) {
                const resolvedPath = this.resolvePathSegment(trimmedSegment, shellConfigContent);
                if (resolvedPath) {
                    paths.push(resolvedPath);
                }
            } else {
                // Direct path
                paths.push(trimmedSegment);
            }
        }

        return paths;
    }

    /**
     * Resolve variables in a single path segment
     */
    private resolvePathSegment(
        pathSegment: string,
        shellConfigContent: string
    ): string | null {
        const variablePattern = /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g;
        let resolvedSegment = pathSegment;
        let hasUnresolvedVars = false;

        resolvedSegment = resolvedSegment.replace(variablePattern, (match, varName) => {
            // First try to get from current environment variables
            let varValue = process.env[varName];

            // If not in environment variables, look in shell configuration files
            if (!varValue) {
                varValue = this.resolveVariableFromShellConfig(varName, shellConfigContent);
            }

            if (varValue) {
                return varValue;
            } else {
                this.logger.debug(`Variable ${varName} not found, discarding path segment: ${pathSegment}`);
                hasUnresolvedVars = true;
                return match; // Keep as is, but will be discarded
            }
        });

        // If there are unresolved variables, discard this path segment
        if (hasUnresolvedVars) {
            return null;
        }

        return resolvedSegment;
    }

    /**
     * Get enhanced system PATH, combining system PATH and shell configuration PATH
     * First get system PATH, then read PATH definitions from shell configuration files and merge
     */
    public getEnhancedSystemPath(): string {
        const pathParts: string[] = [];

        // 1. First get system PATH
        const systemPath = this.getSystemPath();
        if (systemPath) {
            pathParts.push(systemPath);
            this.logger.info('System PATH obtained:', systemPath);
        }

        // 2. Get PATH from shell configuration
        const shellPath = this.getPathFromShellConfig();
        if (shellPath) {
            pathParts.push(shellPath);
            this.logger.info('Shell configuration PATH obtained:', shellPath);
        }

        // 3. Merge PATH and remove duplicates
        if (pathParts.length > 0) {
            const combinedPath = pathParts.join(':');
            const pathArray = combinedPath.split(':');

            // Remove duplicates while maintaining order
            const uniquePaths = [...new Set(pathArray)];

            // Filter out empty strings and paths containing unresolved variables
            const validPaths = uniquePaths.filter((path) => {
                if (!path || path.trim() === '') return false;

                // Discard paths containing unresolved variables
                if (path.includes('$')) {
                    this.logger.debug(`Discarding path with unresolved variables: ${path}`);
                    return false;
                }

                if (this.options.validatePaths) {
                    try {
                        return fs.existsSync(path);
                    } catch {
                        return false;
                    }
                }

                return true;
            });

            const finalPath = validPaths.join(':');
            this.logger.info('Enhanced PATH created:', finalPath);
            return finalPath;
        }

        // 4. If all methods fail, return current environment variable PATH
        const fallbackPath = process.env.PATH || '';
        this.logger.warn('Using fallback PATH from process.env:', fallbackPath);
        return fallbackPath;
    }

    /**
     * Apply enhanced PATH to current process environment variables
     */
    public applyEnhancedPath(): string {
        const enhancedPath = this.getEnhancedSystemPath();
        process.env.PATH = enhancedPath;
        this.logger.info('Enhanced PATH applied to process environment variables');
        return enhancedPath;
    }
}