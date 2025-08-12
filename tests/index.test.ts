import {
    PathEnhancer,
    getEnhancedPath,
    applyEnhancedPath,
    getSystemPath,
    getShellConfigPath,
    defaultLogger,
    ConsoleLogger
} from '../src/index';

// Mock PathEnhancer
jest.mock('../src/path-enhancer');

const MockedPathEnhancer = PathEnhancer as jest.MockedClass<typeof PathEnhancer>;

describe('Main entry file exports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Class and interface exports', () => {
        it('should export PathEnhancer class', () => {
            expect(PathEnhancer).toBeDefined();
        });

        it('should export ConsoleLogger class', () => {
            expect(ConsoleLogger).toBeDefined();
        });

        it('should export defaultLogger instance', () => {
            expect(defaultLogger).toBeDefined();
        });
    });

    describe('Convenience functions', () => {
        let mockEnhancerInstance: jest.Mocked<PathEnhancer>;

        beforeEach(() => {
            mockEnhancerInstance = {
                getEnhancedSystemPath: jest.fn(),
                applyEnhancedPath: jest.fn(),
                getSystemPath: jest.fn(),
                getPathFromShellConfig: jest.fn(),
            } as any;

            MockedPathEnhancer.mockImplementation(() => mockEnhancerInstance);
        });

        describe('getEnhancedPath', () => {
            it('should create PathEnhancer instance and call getEnhancedSystemPath', () => {
                const mockPath = '/usr/local/bin:/usr/bin:/bin';
                mockEnhancerInstance.getEnhancedSystemPath.mockReturnValue(mockPath);

                const options = { debug: true };
                const result = getEnhancedPath(options);

                expect(MockedPathEnhancer).toHaveBeenCalledWith(options);
                expect(mockEnhancerInstance.getEnhancedSystemPath).toHaveBeenCalled();
                expect(result).toBe(mockPath);
            });

            it('should use default configuration when no options provided', () => {
                const mockPath = '/usr/bin:/bin';
                mockEnhancerInstance.getEnhancedSystemPath.mockReturnValue(mockPath);

                const result = getEnhancedPath();

                expect(MockedPathEnhancer).toHaveBeenCalledWith(undefined);
                expect(result).toBe(mockPath);
            });
        });

        describe('applyEnhancedPath', () => {
            it('should create PathEnhancer instance and call applyEnhancedPath', () => {
                const mockPath = '/usr/local/bin:/usr/bin:/bin';
                mockEnhancerInstance.applyEnhancedPath.mockReturnValue(mockPath);

                const options = { debug: true, timeout: 3000 };
                const result = applyEnhancedPath(options);

                expect(MockedPathEnhancer).toHaveBeenCalledWith(options);
                expect(mockEnhancerInstance.applyEnhancedPath).toHaveBeenCalled();
                expect(result).toBe(mockPath);
            });
        });

        describe('getSystemPath', () => {
            it('should create PathEnhancer instance and call getSystemPath', () => {
                const mockPath = '/usr/bin:/bin';
                mockEnhancerInstance.getSystemPath.mockReturnValue(mockPath);

                const options = { validatePaths: false };
                const result = getSystemPath(options);

                expect(MockedPathEnhancer).toHaveBeenCalledWith(options);
                expect(mockEnhancerInstance.getSystemPath).toHaveBeenCalled();
                expect(result).toBe(mockPath);
            });

            it('should be able to return null', () => {
                mockEnhancerInstance.getSystemPath.mockReturnValue(null);

                const result = getSystemPath();

                expect(result).toBeNull();
            });
        });

        describe('getShellConfigPath', () => {
            it('should create PathEnhancer instance and call getPathFromShellConfig', () => {
                const mockPath = '/home/user/bin:/usr/local/bin';
                mockEnhancerInstance.getPathFromShellConfig.mockReturnValue(mockPath);

                const options = { debug: false };
                const result = getShellConfigPath(options);

                expect(MockedPathEnhancer).toHaveBeenCalledWith(options);
                expect(mockEnhancerInstance.getPathFromShellConfig).toHaveBeenCalled();
                expect(result).toBe(mockPath);
            });

            it('should be able to return null', () => {
                mockEnhancerInstance.getPathFromShellConfig.mockReturnValue(null);

                const result = getShellConfigPath();

                expect(result).toBeNull();
            });
        });
    });

    describe('Default export', () => {
        it('should export PathEnhancer class as default', async () => {
            const defaultExport = (await import('../src/index')).default;
            expect(defaultExport).toBe(PathEnhancer);
        });
    });
});