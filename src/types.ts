/**
 * Platform type definition
 */
export type Platform = 'win32' | 'darwin' | 'linux';

/**
 * Shell type definition
 */
export type ShellType = 'bash' | 'zsh' | 'fish' | 'cmd' | 'powershell';

/**
 * PATH source type
 */
export type PathSource = 'system' | 'shell-config' | 'environment' | 'fallback';

/**
 * PATH information interface
 */
export interface PathInfo {
    /** PATH value */
    value: string;
    /** PATH source */
    source: PathSource;
    /** Path array */
    paths: string[];
    /** Valid path count */
    validPathCount: number;
    /** Invalid path array */
    invalidPaths: string[];
}

/**
 * Enhancement result interface
 */
export interface EnhanceResult {
    /** Whether successful */
    success: boolean;
    /** Original PATH */
    originalPath: string;
    /** Enhanced PATH */
    enhancedPath: string;
    /** Number of added paths */
    addedPathCount: number;
    /** Error message (if any) */
    error?: string;
}

/**
 * Shell configuration file information
 */
export interface ShellConfigInfo {
    /** Configuration file path */
    filePath: string;
    /** Whether exists */
    exists: boolean;
    /** Shell type */
    shellType: ShellType;
    /** Number of PATH definitions found */
    pathDefinitions: number;
}
