const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectName: 'Penacle Path',
  outputFile: 'code-export.md',
  foldersToExport: [
    'supabase/functions',
    'supabase/migrations',
    'src/supabase'
  ],
  excludePatterns: [
    /node_modules/,
    /\.env/,
    /\.git/,
    /\.DS_Store/
  ]
};

function shouldIncludeFile(filePath) {
  return !config.excludePatterns.some(pattern => pattern.test(filePath));
}

function getFilesRecursively(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (shouldIncludeFile(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function generateMarkdown() {
  let markdown = `# ${config.projectName} - Code Export\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;

  for (const folder of config.foldersToExport) {
    const folderPath = path.join(process.cwd(), folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Skipping non-existent folder: ${folder}`);
      continue;
    }

    markdown += `## ${folder}\n\n`;
    const files = getFilesRecursively(folderPath);

    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);
      const content = fs.readFileSync(file, 'utf8');

      markdown += `### ${relativePath}\n\n`;
      markdown += '```' + path.extname(file).slice(1) + '\n';
      markdown += content;
      markdown += '\n```\n\n';
    }
  }

  return markdown;
}

// Create the export
try {
  const markdown = generateMarkdown();
  fs.writeFileSync(config.outputFile, markdown);
  console.log(`Code export successful! Check ${config.outputFile}`);
} catch (error) {
  console.error('Error exporting code:', error);
}