#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mappings de remplacement pour la migration
const replacements = [
  // Import Dimensions
  {
    from: /import\s*{\s*([^}]*\s*)?Dimensions(\s*[^}]*)?\s*}\s*from\s*['"]react-native['"]/g,
    to: (match, before = '', after = '') => {
      const otherImports = (before + after).split(',').filter(i => i.trim() && i.trim() !== 'Dimensions').join(', ');
      return otherImports ? `import { ${otherImports} } from 'react-native'` : '';
    }
  },
  // Dimensions.get
  {
    from: /const\s*{\s*width[^}]*}\s*=\s*Dimensions\.get\(['"]window['"]\)/g,
    to: ''
  },
  // Add useResponsive import
  {
    from: /(import\s+.*from\s+['"]react-native['"];?)/,
    to: `$1\nimport { useResponsive } from '@/hooks/useResponsive';`
  },
  // Replace width/height usage
  {
    from: /width\s*\*\s*([\d.]+)/g,
    to: 'wp($1)'
  },
  {
    from: /height\s*\*\s*([\d.]+)/g,
    to: 'hp($1)'
  },
  // Fixed dimensions
  {
    from: /width:\s*(\d+)([,\s}])/g,
    to: 'width: moderateScale($1)$2'
  },
  {
    from: /height:\s*(\d+)([,\s}])/g,
    to: 'height: moderateScale($1)$2'
  },
  {
    from: /fontSize:\s*(\d+)([,\s}])/g,
    to: 'fontSize: responsiveFontSize($1)$2'
  },
  {
    from: /padding:\s*(\d+)([,\s}])/g,
    to: 'padding: moderateScale($1)$2'
  },
  {
    from: /margin:\s*(\d+)([,\s}])/g,
    to: 'margin: moderateScale($1)$2'
  },
  // Replace Text with ResponsiveText
  {
    from: /<Text\s+/g,
    to: '<ResponsiveText '
  },
  {
    from: /<\/Text>/g,
    to: '</ResponsiveText>'
  },
  // Replace TouchableOpacity buttons
  {
    from: /<TouchableOpacity([^>]*?)>\s*<Text([^>]*?)>([^<]+)<\/Text>\s*<\/TouchableOpacity>/g,
    to: '<ResponsiveButton$1 title="$3" />'
  }
];

// Function to check if file should be migrated
function shouldMigrateFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip already migrated files
  if (fileName.includes('Responsive') || fileName.includes('responsive')) {
    return false;
  }
  
  // Skip test files
  if (fileName.includes('.test.') || fileName.includes('.spec.')) {
    return false;
  }
  
  return true;
}

// Function to migrate a single file
function migrateFile(filePath) {
  if (!shouldMigrateFile(filePath)) {
    return { skipped: true };
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let changes = [];
  
  // Check if file uses Dimensions
  if (!content.includes('Dimensions')) {
    return { skipped: true, reason: 'No Dimensions usage found' };
  }
  
  // Add useResponsive hook in component
  if (content.includes('export default function') || content.includes('const') && content.includes('= () =>')) {
    const componentMatch = content.match(/(export\s+default\s+function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/);
    if (componentMatch) {
      const insertPoint = componentMatch.index + componentMatch[0].length;
      const hookDeclaration = '\n  const { wp, hp, moderateScale, responsiveFontSize } = useResponsive();';
      content = content.slice(0, insertPoint) + hookDeclaration + content.slice(insertPoint);
      changes.push('Added useResponsive hook');
    }
  }
  
  // Apply replacements
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changes.push(`Applied replacement: ${from.toString().slice(0, 50)}...`);
    }
  });
  
  // Add responsive component imports if needed
  if (content.includes('ResponsiveText') || content.includes('ResponsiveButton')) {
    const hasResponsiveImport = content.includes("from '@/components/common'");
    if (!hasResponsiveImport) {
      const reactNativeImport = content.match(/import.*from\s+['"]react-native['"];?/);
      if (reactNativeImport) {
        const insertPoint = reactNativeImport.index + reactNativeImport[0].length;
        const responsiveImport = "\nimport { ResponsiveText, ResponsiveButton } from '@/components/common';";
        content = content.slice(0, insertPoint) + responsiveImport + content.slice(insertPoint);
        changes.push('Added responsive component imports');
      }
    }
  }
  
  // Only write if changes were made
  if (content !== originalContent) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    
    // Write migrated content
    fs.writeFileSync(filePath, content);
    
    return {
      migrated: true,
      changes,
      backupPath
    };
  }
  
  return { skipped: true, reason: 'No changes needed' };
}

// Function to scan and migrate directory
function migrateDirectory(dir) {
  const results = {
    migrated: [],
    skipped: [],
    errors: []
  };
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.git', 'build'].includes(file)) {
      const subResults = migrateDirectory(filePath);
      results.migrated.push(...subResults.migrated);
      results.skipped.push(...subResults.skipped);
      results.errors.push(...subResults.errors);
    } else if (stat.isFile() && ['.tsx', '.jsx'].includes(path.extname(file))) {
      try {
        const result = migrateFile(filePath);
        if (result.migrated) {
          results.migrated.push({
            file: filePath,
            changes: result.changes,
            backup: result.backupPath
          });
        } else if (result.skipped) {
          results.skipped.push({
            file: filePath,
            reason: result.reason || 'Skipped'
          });
        }
      } catch (error) {
        results.errors.push({
          file: filePath,
          error: error.message
        });
      }
    }
  });
  
  return results;
}

// Main execution
console.log('🚀 Starting Responsive Migration...\n');

const targetDir = process.argv[2] || path.join(__dirname, '../../screens');
console.log(`Target directory: ${targetDir}\n`);

if (!fs.existsSync(targetDir)) {
  console.error('❌ Target directory does not exist!');
  process.exit(1);
}

const results = migrateDirectory(targetDir);

// Display results
console.log('\n📊 Migration Results:');
console.log('====================\n');

if (results.migrated.length > 0) {
  console.log(`✅ Migrated ${results.migrated.length} files:`);
  results.migrated.forEach(({ file, changes, backup }) => {
    console.log(`\n  📄 ${file}`);
    console.log(`     Backup: ${backup}`);
    changes.forEach(change => console.log(`     - ${change}`));
  });
}

if (results.skipped.length > 0) {
  console.log(`\n⏭️  Skipped ${results.skipped.length} files`);
  if (process.argv.includes('--verbose')) {
    results.skipped.forEach(({ file, reason }) => {
      console.log(`  - ${file}: ${reason}`);
    });
  }
}

if (results.errors.length > 0) {
  console.log(`\n❌ Errors in ${results.errors.length} files:`);
  results.errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

console.log('\n✨ Migration complete!');
console.log('\nNext steps:');
console.log('1. Review the migrated files');
console.log('2. Test the application on different screen sizes');
console.log('3. Delete backup files once verified: find . -name "*.backup" -delete');
console.log('4. Run the responsive issues detector: node detectResponsiveIssues.js');
