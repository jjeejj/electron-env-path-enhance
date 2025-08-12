# electron-env-path-enhance

[![npm version](https://badge.fury.io/js/electron-env-path-enhance.svg)](https://badge.fury.io/js/electron-env-path-enhance)
[![Build Status](https://travis-ci.org/wenjunjiang/electron-env-path-enhance.svg?branch=master)](https://travis-ci.org/wenjunjiang/electron-env-path-enhance)
[![Coverage Status](https://coveralls.io/repos/github/wenjunjiang/electron-env-path-enhance/badge.svg?branch=master)](https://coveralls.io/github/wenjunjiang/electron-env-path-enhance?branch=master)

## Introduction

`electron-env-path-enhance` is a utility library for enhancing the PATH environment variable in Electron applications. It solves the problem where Electron apps may not correctly inherit the system PATH environment variable on different operating systems, especially for applications launched via Finder on macOS.

## Features

- Automatically detects and enhances the PATH environment variable for Electron applications
- Supports macOS, Windows, and Linux platforms
- Provides flexible configuration options
- Includes detailed logging functionality for debugging
- Supports TypeScript with complete type definitions

## Installation

```bash
npm install electron-env-path-enhance --save
```

Or using yarn:

```bash
yarn add electron-env-path-enhance
```

## Usage

Import and initialize in your Electron app's main process:

```javascript
const { app } = require('electron');
const { enhancePath } = require('electron-env-path-enhance');

app.whenReady().then(() => {
  // Enhance PATH with default configuration
  enhancePath();
  
  // Or use custom configuration
  enhancePath({
    additionalPaths: ['/usr/local/bin', '/opt/homebrew/bin'],
    logLevel: 'info',
    // Other options...
  });
});
```

Using TypeScript:

```typescript
import { app } from 'electron';
import { enhancePath, EnhancePathOptions } from 'electron-env-path-enhance';

app.whenReady().then(() => {
  const options: EnhancePathOptions = {
    additionalPaths: ['/usr/local/bin', '/opt/homebrew/bin'],
    logLevel: 'info',
    // Other options...
  };
  
  enhancePath(options);
});
```

## Configuration Options

The `enhancePath` function accepts an optional configuration object with the following options:

| Option | Type | Default | Description |
|------|------|--------|------|
| `additionalPaths` | `string[]` | `[]` | Additional paths to add to PATH |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error' \| 'silent'` | `'info'` | Log level |
| `customShellPaths` | `string[]` | Platform-specific | Custom shell executable paths |
| `skipSystemPath` | `boolean` | `false` | Whether to skip getting system PATH |
| `onlyIfMissing` | `boolean` | `true` | Only enhance if PATH is missing or incomplete |
| `deduplicate` | `boolean` | `true` | Whether to remove duplicate entries in PATH |

## Platform-Specific Behavior

### macOS

On macOS, the library attempts to get the complete PATH environment variable from:

1. The current process's PATH
2. PATH obtained by executing shell commands
3. Common default paths

### Windows

On Windows, the library merges:

1. The current process's PATH
2. PATH from user and system environment variables
3. Common default Windows paths

### Linux

On Linux, the library primarily relies on the current process's PATH and adds some common Linux binary paths.

## Logging

The library uses built-in logging functionality that can be controlled via the `logLevel` option:

```javascript
enhancePath({
  logLevel: 'debug' // Show all logs, including detailed debug information
});
```

## Advanced Usage

### Get Enhanced PATH Without Applying

```javascript
const { getEnhancedPath } = require('electron-env-path-enhance');

const enhancedPath = getEnhancedPath({
  additionalPaths: ['/custom/path']
});

console.log(enhancedPath);
```

### Check if a Specific Executable is in PATH

```javascript
const { findExecutableInPath } = require('electron-env-path-enhance');

const nodePath = findExecutableInPath('node');
if (nodePath) {
  console.log(`Node.js executable is located at: ${nodePath}`);
} else {
  console.log('Node.js executable not found');
}
```

## License

MIT

## Contributing

Issues and pull requests are welcome!

## Author

Wenjun Jiang

## Related Projects

- [electron-fix-path](https://github.com/sindresorhus/electron-fix-path) - A similar library with simpler functionality
- [fix-path](https://github.com/sindresorhus/fix-path) - The base library for fixing PATH on macOS

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed update history.

## FAQ

### Why can't my Electron app find certain command-line tools?

This is typically because applications launched via GUI (like through Finder or Dock) don't inherit the complete shell environment variables. This library is designed to solve exactly this problem.

### How do I debug PATH-related issues?

Set `logLevel` to `'debug'` and check the console output to understand how PATH is being processed:

```javascript
enhancePath({
  logLevel: 'debug'
});
```

### Does it support Electron's renderer process?

The library is primarily designed for the main process, as environment variables are typically handled there. If you need to use the enhanced PATH in a renderer process, you can get it from the main process via IPC.

### How do I handle application-specific paths?

Use the `additionalPaths` option to add application-specific paths:

```javascript
enhancePath({
  additionalPaths: [
    path.join(app.getAppPath(), 'bin'),
    // Other app-specific paths...
  ]
});
```

## Support

If you find any issues or have suggestions for improvements, please submit an issue on GitHub.

---

We hope this library helps you solve PATH environment variable issues in your Electron applications!