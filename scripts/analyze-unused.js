#!/usr/bin/env node

/**
 * Codebase Analysis Script
 * Analyzes React/Next.js codebase to identify unused files, components, and exports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'build',
  'dist',
  'out',
  'coverage',
  '*.test.*',
  '*.spec.*',
  '*.config.*',
  '*.d.ts',
  'next-env.d.ts'
];

// Entry points that should not be considered unused
const ENTRY_POINTS = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/(global)/layout.tsx',
  'src/middleware.ts',
  'src/lib/db/schema.ts',
  'src/lib/db/index.ts',
  'next.config.mjs',
  'tailwind.config.mjs',
  'postcss.config.mjs',
  'drizzle.config.ts'
];

// Function to get all Next.js entry points
function getNextJsEntryPoints() {
  const entryPoints = [...ENTRY_POINTS];
  const appDir = path.join(PROJECT_ROOT, 'src', 'app');
  
  if (fs.existsSync(appDir)) {
    const findPages = (dir, relativeDir = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          // Check for page.tsx and layout.tsx in this directory
          const pagePath = path.join(fullPath, 'page.tsx');
          const layoutPath = path.join(fullPath, 'layout.tsx');
          
          if (fs.existsSync(pagePath)) {
            entryPoints.push(path.relative(PROJECT_ROOT, pagePath));
          }
          if (fs.existsSync(layoutPath)) {
            entryPoints.push(path.relative(PROJECT_ROOT, layoutPath));
          }
          
          // Recurse into subdirectories
          findPages(fullPath, path.join(relativeDir, item));
        }
      }
    };
    
    findPages(appDir);
  }
  
  return entryPoints;
}

// Utility functions
function shouldIgnoreFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldIgnoreFile(fullPath)) {
        findFiles(fullPath, files);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      if (EXTENSIONS.includes(ext) && !shouldIgnoreFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function parseFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    return {
      path: relativePath,
      content,
      exports: [],
      imports: [],
      dynamicImports: []
    };
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return null;
  }
}

function extractExports(content, filePath) {
  const exports = [];

  // Named exports: export const/function/class/interface
  const namedExportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Default export: export default
  const defaultExportRegex = /export\s+default\s+(?:\w+|\{|\(|\[)/g;
  if (defaultExportRegex.test(content)) {
    exports.push({
      name: 'default',
      type: 'default',
      line: content.substring(0, content.match(defaultExportRegex).index).split('\n').length
    });
  }

  // Export statements: export { ... }
  const exportStatementRegex = /export\s*\{\s*([^}]+)\s*\}/g;
  while ((match = exportStatementRegex.exec(content)) !== null) {
    const exportNames = match[1].split(',').map(name => name.trim().split(' as ')[0]);
    exportNames.forEach(name => {
      if (name && name !== 'default') {
        exports.push({
          name: name,
          type: 'named',
          line: content.substring(0, match.index).split('\n').length
        });
      }
    });
  }

  return exports;
}

function extractImports(content, filePath) {
  const imports = [];
  const dynamicImports = [];

  // Static imports: import ... from '...'
  const staticImportRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedPath = resolveImportPath(importPath, filePath);
    if (resolvedPath) {
      imports.push({
        path: resolvedPath,
        type: 'static',
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  // Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedPath = resolveImportPath(importPath, filePath);
    if (resolvedPath) {
      dynamicImports.push({
        path: resolvedPath,
        type: 'dynamic',
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  return { imports, dynamicImports };
}

function resolveImportPath(importPath, fromFile) {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    let resolvedPath = path.resolve(fromDir, importPath);

    // Try different extensions
    for (const ext of EXTENSIONS) {
      if (fs.existsSync(resolvedPath + ext)) {
        return path.relative(PROJECT_ROOT, resolvedPath + ext);
      }
      // Check for index files in directories
      if (fs.existsSync(path.join(resolvedPath, 'index' + ext))) {
        return path.relative(PROJECT_ROOT, path.join(resolvedPath, 'index' + ext));
      }
    }

    // Check if it's a directory with index file
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      for (const ext of EXTENSIONS) {
        const indexPath = path.join(resolvedPath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return path.relative(PROJECT_ROOT, indexPath);
        }
      }
    }
  }

  // Handle absolute imports from src
  if (importPath.startsWith('@/') || importPath.startsWith('src/')) {
    const relativePath = importPath.replace(/^@\/?/, '').replace(/^src\/?/, '');
    let resolvedPath = path.resolve(SRC_DIR, relativePath);

    for (const ext of EXTENSIONS) {
      if (fs.existsSync(resolvedPath + ext)) {
        return path.relative(PROJECT_ROOT, resolvedPath + ext);
      }
      if (fs.existsSync(path.join(resolvedPath, 'index' + ext))) {
        return path.relative(PROJECT_ROOT, path.join(resolvedPath, 'index' + ext));
      }
    }
  }

  return null;
}

function analyzeCodebase() {
  console.log('🔍 Analyzing codebase for unused files and exports...\n');

  // Get all entry points including Next.js pages
  const allEntryPoints = getNextJsEntryPoints();
  console.log(`Found ${allEntryPoints.length} entry points (including Next.js pages/layouts)\n`);

  // Find all relevant files
  const files = findFiles(SRC_DIR);
  console.log(`Found ${files.length} files to analyze\n`);

  // Parse all files
  const fileData = {};
  for (const filePath of files) {
    const data = parseFile(filePath);
    if (data) {
      data.exports = extractExports(data.content, filePath);
      const { imports, dynamicImports } = extractImports(data.content, filePath);
      data.imports = imports;
      data.dynamicImports = dynamicImports;
      fileData[data.path] = data;
    }
  }

  // Build usage maps
  const fileUsage = new Map();
  const exportUsage = new Map();

  // Initialize usage tracking
  Object.keys(fileData).forEach(filePath => {
    fileUsage.set(filePath, new Set());
    fileData[filePath].exports.forEach(exp => {
      exportUsage.set(`${filePath}:${exp.name}`, new Set());
    });
  });

  // Track imports
  Object.keys(fileData).forEach(filePath => {
    const data = fileData[filePath];

    // Track static imports
    data.imports.forEach(imp => {
      if (fileUsage.has(imp.path)) {
        fileUsage.get(imp.path).add(filePath);
      }
    });

    // Track dynamic imports
    data.dynamicImports.forEach(imp => {
      if (fileUsage.has(imp.path)) {
        fileUsage.get(imp.path).add(filePath);
      }
    });
  });

  // Generate report
  const report = {
    unusedFiles: [],
    unusedExports: [],
    summary: {
      totalFiles: files.length,
      analyzedFiles: Object.keys(fileData).length,
      unusedFiles: 0,
      unusedExports: 0
    }
  };

  // Find unused files
  Object.keys(fileData).forEach(filePath => {
    const isEntryPoint = allEntryPoints.some(entry => filePath === entry || filePath.includes(entry));
    const isUsed = fileUsage.get(filePath).size > 0;

    if (!isEntryPoint && !isUsed) {
      report.unusedFiles.push({
        filePath,
        reason: 'File is not imported or referenced anywhere in the codebase'
      });
    }
  });

  // Find unused exports
  Object.keys(fileData).forEach(filePath => {
    const data = fileData[filePath];
    data.exports.forEach(exp => {
      const exportKey = `${filePath}:${exp.name}`;
      const isUsed = exportUsage.has(exportKey) && exportUsage.get(exportKey).size > 0;

      if (!isUsed) {
        report.unusedExports.push({
          filePath,
          exportName: exp.name,
          exportType: exp.type,
          line: exp.line,
          reason: `${exp.type} export '${exp.name}' is not imported anywhere`
        });
      }
    });
  });

  report.summary.unusedFiles = report.unusedFiles.length;
  report.summary.unusedExports = report.unusedExports.length;

  return report;
}

function generateReport(report) {
  console.log('📊 Analysis Complete\n');

  console.log('SUMMARY:');
  console.log(`- Total files analyzed: ${report.summary.analyzedFiles}`);
  console.log(`- Unused files: ${report.summary.unusedFiles}`);
  console.log(`- Unused exports: ${report.summary.unusedExports}\n`);

  if (report.unusedFiles.length > 0) {
    console.log('🚨 UNUSED FILES:');
    report.unusedFiles.forEach(item => {
      console.log(`  ❌ ${item.filePath}`);
      console.log(`     Reason: ${item.reason}\n`);
    });
  }

  if (report.unusedExports.length > 0) {
    console.log('⚠️  UNUSED EXPORTS:');
    report.unusedExports.forEach(item => {
      console.log(`  ⚠️  ${item.filePath}:${item.line} - ${item.exportType} export '${item.exportName}'`);
      console.log(`     Reason: ${item.reason}\n`);
    });
  }

  if (report.unusedFiles.length === 0 && report.unusedExports.length === 0) {
    console.log('✅ No unused files or exports found!');
  }

  console.log('\n🔧 REMOVAL SUGGESTIONS:');
  console.log('1. For unused files: Delete the files directly (check for any indirect usage first)');
  console.log('2. For unused exports: Remove the export statements from the files');
  console.log('3. Always run tests and build after removal to ensure nothing breaks');
  console.log('4. Consider keeping files that might be used for future features');

  console.log('\n🔄 TO RE-RUN ANALYSIS:');
  console.log('  node scripts/analyze-unused.js');
}

// Main execution
const report = analyzeCodebase();
generateReport(report);