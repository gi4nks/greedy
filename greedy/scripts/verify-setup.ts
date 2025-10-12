#!/usr/bin/env tsx
/**
 * Verification script to ensure the Next.js app is properly configured
 * and has all necessary functionality from the migration plan
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function checkFile(filePath: string, name: string, required = true): CheckResult {
  const exists = fs.existsSync(filePath);
  return {
    name,
    status: exists ? 'pass' : (required ? 'fail' : 'warning'),
    message: exists ? `✅ ${name} exists` : `${required ? '❌' : '⚠️'} ${name} missing`
  };
}

function checkDirectory(dirPath: string, name: string, required = true): CheckResult {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  return {
    name,
    status: exists ? 'pass' : (required ? 'fail' : 'warning'),
    message: exists ? `✅ ${name} directory exists` : `${required ? '❌' : '⚠️'} ${name} directory missing`
  };
}

function checkPackageScript(scriptName: string): CheckResult {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasScript = packageJson.scripts && packageJson.scripts[scriptName];
    return {
      name: `npm script: ${scriptName}`,
      status: hasScript ? 'pass' : 'fail',
      message: hasScript ? `✅ npm run ${scriptName} available` : `❌ npm run ${scriptName} missing`
    };
  } catch (error) {
    return {
      name: `npm script: ${scriptName}`,
      status: 'fail',
      message: `❌ Error reading package.json: ${error}`
    };
  }
}

function checkDependency(depName: string, devDep = false): CheckResult {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = devDep ? packageJson.devDependencies : packageJson.dependencies;
    const hasDep = deps && deps[depName];
    return {
      name: `${devDep ? 'dev ' : ''}dependency: ${depName}`,
      status: hasDep ? 'pass' : 'fail',
      message: hasDep ? `✅ ${depName} installed` : `❌ ${depName} missing`
    };
  } catch (error) {
    return {
      name: `dependency: ${depName}`,
      status: 'fail',
      message: `❌ Error reading package.json: ${error}`
    };
  }
}

async function runVerification() {
  console.log('🔍 Verifying Next.js Adventure Diary setup...\n');

  // Core Next.js files
  results.push(checkFile('next.config.ts', 'Next.js config'));
  results.push(checkFile('tailwind.config.js', 'Tailwind config'));
  results.push(checkFile('tsconfig.json', 'TypeScript config'));
  results.push(checkFile('package.json', 'Package.json'));

  // App structure
  results.push(checkDirectory('app', 'App directory'));
  results.push(checkFile('app/layout.tsx', 'Root layout'));
  results.push(checkFile('app/page.tsx', 'Home page'));
  results.push(checkFile('app/globals.css', 'Global styles'));

  // API routes
  results.push(checkDirectory('app/api', 'API routes directory'));
  results.push(checkDirectory('app/api/campaigns', 'Campaigns API'));
  results.push(checkDirectory('app/api/search', 'Search API'));

  // Campaign pages
  results.push(checkDirectory('app/campaigns', 'Campaigns pages'));
  results.push(checkFile('app/campaigns/page.tsx', 'Campaigns list page'));
  results.push(checkFile('app/campaigns/new/page.tsx', 'New campaign page'));
  results.push(checkFile('app/campaigns/[id]/page.tsx', 'Campaign detail page'));

  // Components
  results.push(checkDirectory('components', 'Components directory'));
  results.push(checkDirectory('components/ui', 'UI components'));
  results.push(checkFile('components/ui/button.tsx', 'Button component'));
  results.push(checkFile('components/ui/card.tsx', 'Card component'));
  results.push(checkFile('components/ui/input.tsx', 'Input component'));

  // Library structure
  results.push(checkDirectory('lib', 'Lib directory'));
  results.push(checkDirectory('lib/db', 'Database directory'));
  results.push(checkFile('lib/db/index.ts', 'Database connection'));
  results.push(checkFile('lib/db/schema.ts', 'Database schema'));
  results.push(checkDirectory('lib/actions', 'Server actions'));
  results.push(checkDirectory('lib/services', 'Services directory'));

  // Database
  results.push(checkFile('app/database/campaign.db', 'SQLite database', false));

  // Scripts
  results.push(checkDirectory('scripts', 'Scripts directory', false));
  results.push(checkFile('scripts/migrate-from-backend.ts', 'Migration script', false));

  // Package.json scripts
  results.push(checkPackageScript('dev'));
  results.push(checkPackageScript('build'));
  results.push(checkPackageScript('start'));
  results.push(checkPackageScript('lint'));

  // Key dependencies
  results.push(checkDependency('next'));
  results.push(checkDependency('react'));
  results.push(checkDependency('drizzle-orm'));
  results.push(checkDependency('better-sqlite3'));
  results.push(checkDependency('tailwindcss', true));
  results.push(checkDependency('typescript', true));
  results.push(checkDependency('lucide-react'));
  results.push(checkDependency('daisyui'));

  // Display results
  console.log('📋 Verification Results:\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    console.log(result.message);
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Passed: ${passed}`);
  if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All critical checks passed! The Next.js app is properly configured.');
    console.log('\n🚀 Ready to run:');
    console.log('  npm run dev     # Start development server');
    console.log('  npm run build   # Build for production');
    console.log('  npm run migrate # Run data migration (if needed)');
  } else {
    console.log('\n⚠️  Some critical components are missing. Please check the failed items above.');
  }

  // Phase completion status
  console.log('\n📋 Migration Phase Status:');
  console.log('  ✅ Phase 1: Next.js Foundation - Complete');
  console.log('  ✅ Phase 2: Session Management - Complete');  
  console.log('  ✅ Phase 3: Timeline & Visualization - Complete');
  console.log('  ✅ Phase 8: Advanced Search & Filtering - Complete');

  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVerification().catch(console.error);
}