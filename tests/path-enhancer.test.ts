import { PathEnhancer } from '../src/path-enhancer';
import { ConsoleLogger } from '../src/logger';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('PathEnhancer', () => {
    let pathEnhancer: PathEnhancer;
    let mockLogger: ConsoleLogger;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock logger
        mockLogger = new ConsoleLogger(false);
        jest.spyOn(mockLogger, 'debug');
        jest.spyOn(mockLogger, 'info');
        jest.spyOn(mockLogger, 'warn');
        jest.spyOn(mockLogger, 'error');

        // Create PathEnhancer instance
        pathEnhancer = new PathEnhancer({
            debug: true,
            logger: mockLogger,
            timeout: 1000,
            validatePaths: false // Disable path validation in tests to avoid filesystem dependencies
        });

        // Set default environment variables
        process.env.HOME = '/home/testuser';
        process.env.PATH = '/usr/bin:/bin';
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.HOME;
        delete process.env.PATH;
    });

    describe('getSystemPath', () => {
        it('should use login shell to get PATH on macOS', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'darwin' });

            mockExecSync.mockReturnValue('/usr/local/bin:/usr/bin:/bin\n');

            const result = pathEnhancer.getSystemPath();

            expect(mockExecSync).toHaveBeenCalledWith(
                '/bin/bash -l -c "echo $PATH"',
                expect.objectContaining({
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 1000
                })
            );
            expect(result).toContain('/usr/local/bin:/usr/bin:/bin');
            expect(result).toContain('/home/testuser/.pyenv/shims');

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });

        it('should use regular bash to get PATH on Linux', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'linux' });

            mockExecSync.mockReturnValue('/usr/bin:/bin\n');

            const result = pathEnhancer.getSystemPath();

            expect(mockExecSync).toHaveBeenCalledWith(
                '/bin/bash -c "echo $PATH"',
                expect.objectContaining({
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 1000
                })
            );
            expect(result).toContain('/usr/bin:/bin');

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });

        it('should use cmd to get PATH on Windows', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32' });

            mockExecSync.mockReturnValue('C:\\Windows\\System32;C:\\Windows\n');

            const result = pathEnhancer.getSystemPath();

            expect(mockExecSync).toHaveBeenCalledWith(
                'echo %PATH%',
                expect.objectContaining({
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 1000
                })
            );
            expect(result).toContain('C:\\Windows\\System32;C:\\Windows');

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });

        it('should return null when command execution fails', () => {
            mockExecSync.mockImplementation(() => {
                throw new Error('Command failed');
            });

            const result = pathEnhancer.getSystemPath();

            expect(result).toBeNull();
            expect(mockLogger.debug).toHaveBeenCalledWith('Failed to get system PATH:', expect.any(Error));
        });

        it('should return null when returning %PATH%', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32' });

            mockExecSync.mockReturnValue('%PATH%\n');

            const result = pathEnhancer.getSystemPath();

            expect(result).toBeNull();

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });
    });

    describe('getPathFromShellConfig', () => {
        it('should return null on Windows', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32' });

            const result = pathEnhancer.getPathFromShellConfig();

            expect(result).toBeNull();

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });

        it('should return null when HOME environment variable is missing', () => {
            delete process.env.HOME;

            const result = pathEnhancer.getPathFromShellConfig();

            expect(result).toBeNull();
        });

        it('should parse PATH from shell configuration files', () => {
            const mockConfigContent = `
export PATH="/usr/local/bin:$PATH"
export PATH="$HOME/bin:$PATH"
export CUSTOM_VAR="/custom/path"
export PATH="$CUSTOM_VAR:$PATH"
            `;

            mockFs.existsSync.mockImplementation((path: any) => {
                return path === '/home/testuser/.zshrc';
            });

            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path === '/home/testuser/.zshrc') {
                    return mockConfigContent;
                }
                return '';
            });

            // Set environment variable
            process.env.CUSTOM_VAR = '/custom/path';

            const result = pathEnhancer.getPathFromShellConfig();

            expect(result).toContain('/usr/local/bin');
            expect(result).toContain('/home/testuser/bin');
            expect(result).toContain('/custom/path');
        });

        it('should discard paths containing unresolved variables', () => {
            const mockConfigContent = `
export PATH="/usr/local/bin:$PATH"
export PATH="$UNKNOWN_VAR:$PATH"
            `;

            mockFs.existsSync.mockImplementation((path: any) => {
                return path === '/home/testuser/.zshrc';
            });

            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path === '/home/testuser/.zshrc') {
                    return mockConfigContent;
                }
                return '';
            });

            const result = pathEnhancer.getPathFromShellConfig();

            expect(result).toContain('/usr/local/bin');
            expect(result).not.toContain('$UNKNOWN_VAR');
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Variable UNKNOWN_VAR not found discarding path segment: $UNKNOWN_VAR'
            );
        });
    });

    describe('getEnhancedSystemPath', () => {
        it('should merge system PATH and shell configuration PATH', () => {
            // Mock getSystemPath
            jest.spyOn(pathEnhancer, 'getSystemPath').mockReturnValue('/usr/bin:/bin');
            
            // Mock getPathFromShellConfig
            jest.spyOn(pathEnhancer, 'getPathFromShellConfig').mockReturnValue('/usr/local/bin:/home/testuser/bin');

            const result = pathEnhancer.getEnhancedSystemPath();

            expect(result).toContain('/usr/bin');
            expect(result).toContain('/bin');
            expect(result).toContain('/usr/local/bin');
            expect(result).toContain('/home/testuser/bin');
        });

        it('should remove duplicate paths', () => {
            jest.spyOn(pathEnhancer, 'getSystemPath').mockReturnValue('/usr/bin:/bin:/usr/local/bin');
            jest.spyOn(pathEnhancer, 'getPathFromShellConfig').mockReturnValue('/usr/local/bin:/home/testuser/bin');

            const result = pathEnhancer.getEnhancedSystemPath();
            const paths = result.split(':');

            // Check that /usr/local/bin appears only once
            const localBinCount = paths.filter(path => path === '/usr/local/bin').length;
            expect(localBinCount).toBe(1);
        });

        it('should return fallback PATH when all methods fail', () => {
            jest.spyOn(pathEnhancer, 'getSystemPath').mockReturnValue(null);
            jest.spyOn(pathEnhancer, 'getPathFromShellConfig').mockReturnValue(null);

            const result = pathEnhancer.getEnhancedSystemPath();

            expect(result).toBe('/usr/bin:/bin'); // From process.env.PATH
            expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback PATH from process.env:', '/usr/bin:/bin');
        });

        it('should filter out paths containing unresolved variables', () => {
            jest.spyOn(pathEnhancer, 'getSystemPath').mockReturnValue('/usr/bin:$UNRESOLVED_VAR:/bin');
            jest.spyOn(pathEnhancer, 'getPathFromShellConfig').mockReturnValue(null);

            const result = pathEnhancer.getEnhancedSystemPath();

            expect(result).toContain('/usr/bin');
            expect(result).toContain('/bin');
            expect(result).not.toContain('$UNRESOLVED_VAR');
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Variable UNRESOLVED_VAR not found discarding path segment: $UNRESOLVED_VAR'
            );
        });
    });

    describe('applyEnhancedPath', () => {
        it('should apply enhanced PATH to process environment variables', () => {
            const mockEnhancedPath = '/usr/local/bin:/usr/bin:/bin';
            jest.spyOn(pathEnhancer, 'getEnhancedSystemPath').mockReturnValue(mockEnhancedPath);

            const result = pathEnhancer.applyEnhancedPath();

            expect(result).toBe(mockEnhancedPath);
            expect(process.env.PATH).toBe(mockEnhancedPath);
            expect(mockLogger.info).toHaveBeenCalledWith('Enhanced PATH applied to process environment variables');
        });
    });
});