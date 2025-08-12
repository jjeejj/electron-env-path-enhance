#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 发布前检查...');

// 检查必要文件是否存在
const requiredFiles = [
    'dist/index.js',
    'dist/index.d.ts',
    'README.md',
    'LICENSE',
    'package.json'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ 缺少必要文件: ${file}`);
        allFilesExist = false;
    } else {
        console.log(`✅ ${file}`);
    }
});

// 检查 package.json 配置
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['name', 'version', 'description', 'main', 'types'];
requiredFields.forEach(field => {
    if (!packageJson[field]) {
        console.error(`❌ package.json 缺少字段: ${field}`);
        allFilesExist = false;
    } else {
        console.log(`✅ package.json.${field}: ${packageJson[field]}`);
    }
});

// 检查构建输出
try {
    const indexJs = fs.readFileSync('dist/index.js', 'utf8');
    if (indexJs.includes('PathEnhancer')) {
        console.log('✅ 构建输出包含主要导出');
    } else {
        console.error('❌ 构建输出不完整');
        allFilesExist = false;
    }
} catch (error) {
    console.error('❌ 无法读取构建输出:', error.message);
    allFilesExist = false;
}

if (allFilesExist) {
    console.log('\n🎉 所有检查通过，可以发布！');
    process.exit(0);
} else {
    console.log('\n❌ 发布前检查失败，请修复上述问题');
    process.exit(1);
}