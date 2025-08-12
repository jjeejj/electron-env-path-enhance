import { PathEnhancer, getEnhancedPath, applyEnhancedPath } from '../src/index';

describe('Integration tests', () => {
    let originalPath: string | undefined;

    beforeEach(() => {
        // Save original PATH
        originalPath = process.env.PATH;
    });

    afterEach(() => {
        // Restore original PATH
        if (originalPath !== undefined) {
            process.env.PATH = originalPath;
        }
    });

    describe('PathEnhancer integration', () => {
        it('should be able to create instance and get enhanced PATH', () => {
            const enhancer = new PathEnhancer({
                debug: false,
                validatePaths: false // Disable path validation to avoid filesystem dependencies
            });

            const enhancedPath = enhancer.getEnhancedSystemPath();

            expect(typeof enhancedPath).toBe('string');
            expect(enhancedPath.length).toBeGreaterThan(0);
        });

        it('should be able to apply enhanced PATH to process environment', () => {
            const enhancer = new PathEnhancer({
                debug: false,
                validatePaths: false
            });

            const appliedPath = enhancer.applyEnhancedPath();

            expect(process.env.PATH).toBe(appliedPath);
            expect(process.env.PATH).toBeDefined();
        });
    });

    describe('Convenience function integration', () => {
        it('getEnhancedPath should return valid PATH string', () => {
            const path = getEnhancedPath({
                debug: false,
                validatePaths: false
            });

            expect(typeof path).toBe('string');
            expect(path.length).toBeGreaterThan(0);
        });

        it('applyEnhancedPath should modify process environment variables', () => {
            const appliedPath = applyEnhancedPath({
                debug: false,
                validatePaths: false
            });

            expect(process.env.PATH).toBe(appliedPath);
            expect(typeof appliedPath).toBe('string');
        });
    });

    describe('Cross-platform compatibility', () => {
        it('should work normally on current platform', () => {
            const enhancer = new PathEnhancer({
                debug: false,
                validatePaths: false
            });

            // These methods should not throw exceptions
            expect(() => {
                enhancer.getSystemPath();
            }).not.toThrow();

            expect(() => {
                enhancer.getPathFromShellConfig();
            }).not.toThrow();

            expect(() => {
                enhancer.getEnhancedSystemPath();
            }).not.toThrow();
        });
    });

    describe('Error handling', () => {
        it('should handle timeout situations gracefully', () => {
            const enhancer = new PathEnhancer({
                debug: false,
                timeout: 1, // Set very short timeout
                validatePaths: false
            });

            // Even with timeout, should return valid result (fallback to environment variables)
            const result = enhancer.getEnhancedSystemPath();
            expect(typeof result).toBe('string');
        });

        it('should work normally when HOME environment variable is missing', () => {
            const originalHome = process.env.HOME;
            delete process.env.HOME;

            const enhancer = new PathEnhancer({
                debug: false,
                validatePaths: false
            });

            expect(() => {
                enhancer.getPathFromShellConfig();
            }).not.toThrow();

            expect(() => {
                enhancer.getEnhancedSystemPath();
            }).not.toThrow();

            // Restore HOME environment variable
            if (originalHome) {
                process.env.HOME = originalHome;
            }
        });
    });
});