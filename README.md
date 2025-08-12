# electron-env-path-enhance

[![npm version](https://badge.fury.io/js/electron-env-path-enhance.svg)](https://badge.fury.io/js/electron-env-path-enhance)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

解决 Electron 应用中 PATH 环境变量丢失问题的 TypeScript 库。

## 问题背景

在 Electron 应用中，特别是在 macOS 系统上，应用启动时可能会丢失完整的 PATH 环境变量，导致无法找到系统命令和工具。这个问题通常发生在：

- 从 Finder 或 Dock 启动的 Electron 应用
- 通过 GUI 方式启动的应用无法继承完整的 shell 环境变量
- 需要调用系统命令（如 git、node、python 等）的 Electron 应用

## 解决方案

`electron-env-path-enhance` 通过以下方式解决这个问题：

1. **系统命令获取**：通过执行系统命令获取完整的 PATH
2. **Shell 配置解析**：读取用户的 shell 配置文件（.zshrc、.bashrc 等）
3. **智能合并**：合并多个来源的 PATH 并去重
4. **跨平台支持**：支持 Windows、macOS 和 Linux

## 安装

```bash
npm install electron-env-path-enhance
```

## 快速开始

### 基本使用

```typescript
import { applyEnhancedPath } from 'electron-env-path-enhance';

// 在 Electron 主进程启动时调用
applyEnhancedPath();

// 现在可以正常使用系统命令了
import { execSync } from 'child_process';
const result = execSync('which node', { encoding: 'utf8' });
console.log('Node.js 路径:', result);
```

### 高级使用

```typescript
import { PathEnhancer, getEnhancedPath } from 'electron-env-path-enhance';

// 创建增强器实例
const enhancer = new PathEnhancer({
    debug: true,           // 启用调试日志
    timeout: 5000,         // 命令执行超时时间
    validatePaths: true    // 验证路径是否存在
});

// 获取增强的 PATH（不修改进程环境变量）
const enhancedPath = enhancer.getEnhancedSystemPath();
console.log('增强的 PATH:', enhancedPath);

// 应用到当前进程
const appliedPath = enhancer.applyEnhancedPath();
console.log('已应用 PATH:', appliedPath);
```

### 便捷函数

```typescript
import { 
    getEnhancedPath, 
    getSystemPath, 
    getShellConfigPath 
} from 'electron-env-path-enhance';

// 获取增强的 PATH
const enhancedPath = getEnhancedPath({ debug: true });

// 仅获取系统 PATH
const systemPath = getSystemPath();

// 仅获取 Shell 配置 PATH
const shellPath = getShellConfigPath();
```

## API 文档

### PathEnhancer 类

#### 构造函数

```typescript
new PathEnhancer(options?: PathEnhancerOptions)
```

**选项参数：**

- `debug?: boolean` - 是否启用调试日志（默认：false）
- `logger?: Logger` - 自定义日志器
- `timeout?: number` - 命令执行超时时间，毫秒（默认：5000）
- `validatePaths?: boolean` - 是否验证路径存在性（默认：true）

#### 方法

##### `getSystemPath(): string | null`

通过执行系统命令获取完整的 PATH 环境变量。

```typescript
const systemPath = enhancer.getSystemPath();
if (systemPath) {
    console.log('系统 PATH:', systemPath);
}
```

##### `getPathFromShellConfig(): string | null`

从用户的 shell 配置文件中解析 PATH 定义。

```typescript
const shellPath = enhancer.getPathFromShellConfig();
if (shellPath) {
    console.log('Shell 配置 PATH:', shellPath);
}
```

##### `getEnhancedSystemPath(): string`

获取增强的系统 PATH，合并系统 PATH 和 shell 配置 PATH。

```typescript
const enhancedPath = enhancer.getEnhancedSystemPath();
console.log('增强 PATH:', enhancedPath);
```

##### `applyEnhancedPath(): string`

将增强的 PATH 应用到当前进程的环境变量中。

```typescript
const appliedPath = enhancer.applyEnhancedPath();
console.log('已应用到进程:', appliedPath);
```

### 便捷函数

#### `getEnhancedPath(options?: PathEnhancerOptions): string`

快速获取增强的 PATH。

#### `applyEnhancedPath(options?: PathEnhancerOptions): string`

快速应用增强的 PATH 到当前进程。

#### `getSystemPath(options?: PathEnhancerOptions): string | null`

快速获取系统 PATH。

#### `getShellConfigPath(options?: PathEnhancerOptions): string | null`

快速获取 Shell 配置 PATH。

## 在 Electron 中使用

### 主进程中使用

```typescript
// main.ts
import { app } from 'electron';
import { applyEnhancedPath } from 'electron-env-path-enhance';

app.whenReady().then(() => {
    // 在应用准备就绪时增强 PATH
    applyEnhancedPath({
        debug: process.env.NODE_ENV === 'development'
    });
    
    // 现在可以安全地使用需要 PATH 的功能
    createWindow();
});
```

### 渲染进程中使用

```typescript
// 在渲染进程中，通过 IPC 与主进程通信
import { ipcRenderer } from 'electron';

// 请求主进程增强 PATH
ipcRenderer.invoke('enhance-path').then((enhancedPath) => {
    console.log('PATH 已增强:', enhancedPath);
});
```

```typescript
// 主进程 IPC 处理
import { ipcMain } from 'electron';
import { getEnhancedPath } from 'electron-env-path-enhance';

ipcMain.handle('enhance-path', () => {
    return getEnhancedPath({ debug: true });
});
```

## 支持的平台

- **macOS**: ✅ 完全支持，解析 .zshrc、.bashrc、.bash_profile、.profile
- **Linux**: ✅ 完全支持，解析常见的 shell 配置文件
- **Windows**: ✅ 基础支持，通过 cmd 获取 PATH

## 支持的 Shell

- Bash
- Zsh
- Fish（部分支持）
- CMD（Windows）
- PowerShell（Windows，通过 CMD 兼容）

## 调试

启用调试模式可以查看详细的执行过程：

```typescript
import { PathEnhancer, ConsoleLogger } from 'electron-env-path-enhance';

const logger = new ConsoleLogger(true);
const enhancer = new PathEnhancer({
    debug: true,
    logger: logger
});

enhancer.applyEnhancedPath();
```

## 常见问题

### Q: 为什么我的 Electron 应用找不到系统命令？

A: 这是因为通过 GUI 启动的应用无法继承完整的 shell 环境。使用本库可以解决这个问题。

### Q: 支持自定义 shell 配置文件路径吗？

A: 目前自动检测常见的配置文件。如需自定义，可以通过环境变量或修改配置文件来实现。

### Q: 会影响应用启动性能吗？

A: 影响很小。库会缓存结果，并且有超时保护机制。

### Q: 在 Windows 上效果如何？

A: Windows 上的 PATH 问题较少，但库仍然提供基础支持。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 更新日志

### 1.0.0

- 初始版本发布
- 支持跨平台 PATH 增强
- 完整的 TypeScript 类型定义
- 单元测试覆盖