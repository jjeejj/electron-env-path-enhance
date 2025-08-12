import { ConsoleLogger, defaultLogger } from '../src/logger';

describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;
    let consoleSpy: {
        debug: jest.SpyInstance;
        info: jest.SpyInstance;
        warn: jest.SpyInstance;
        error: jest.SpyInstance;
    };

    beforeEach(() => {
        // 创建控制台方法的 spy
        consoleSpy = {
            debug: jest.spyOn(console, 'debug').mockImplementation(),
            info: jest.spyOn(console, 'info').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
        };

        logger = new ConsoleLogger(true);
    });

    afterEach(() => {
        // 恢复控制台方法
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('when logging is enabled', () => {
        it('should output debug messages', () => {
            logger.debug('test debug message', { data: 'test' });

            expect(consoleSpy.debug).toHaveBeenCalledWith(
                '[DEBUG] test debug message',
                { data: 'test' }
            );
        });

        it('should output info messages', () => {
            logger.info('test info message', 'extra');

            expect(consoleSpy.info).toHaveBeenCalledWith(
                '[INFO] test info message',
                'extra'
            );
        });

        it('should output warn messages', () => {
            logger.warn('test warning message');

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                '[WARN] test warning message'
            );
        });

        it('should output error messages', () => {
            logger.error('test error message', new Error('test error'));

            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[ERROR] test error message',
                new Error('test error')
            );
        });
    });

    describe('when logging is disabled', () => {
        beforeEach(() => {
            logger = new ConsoleLogger(false);
        });

        it('should not output debug messages', () => {
            logger.debug('test debug message');

            expect(consoleSpy.debug).not.toHaveBeenCalled();
        });

        it('should not output info messages', () => {
            logger.info('test info message');

            expect(consoleSpy.info).not.toHaveBeenCalled();
        });

        it('should not output warn messages', () => {
            logger.warn('test warning message');

            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });

        it('should not output error messages', () => {
            logger.error('test error message');

            expect(consoleSpy.error).not.toHaveBeenCalled();
        });
    });

    describe('setEnabled method', () => {
        it('should be able to dynamically enable logging', () => {
            logger = new ConsoleLogger(false);
            logger.setEnabled(true);

            logger.info('test message');

            expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] test message');
        });

        it('should be able to dynamically disable logging', () => {
            logger = new ConsoleLogger(true);
            logger.setEnabled(false);

            logger.info('test message');

            expect(consoleSpy.info).not.toHaveBeenCalled();
        });
    });
});

describe('defaultLogger', () => {
    it('should be an instance of ConsoleLogger', () => {
        expect(defaultLogger).toBeInstanceOf(ConsoleLogger);
    });

    it('should be disabled by default', () => {
        const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

        defaultLogger.info('test message');

        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});