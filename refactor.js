const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'app', 'admin');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace import AdminLayout
  if (content.includes("import AdminLayout from '@/components/admin/AdminLayout'")) {
    content = content.replace(
      "import AdminLayout from '@/components/admin/AdminLayout'",
      "import AdminPageHeader from '@/components/admin/AdminPageHeader'"
    );
  } else if (content.includes('AdminLayout') && !content.includes('AdminPageHeader')) {
      // It might be imported differently, let's try regex
      content = content.replace(
        /import AdminLayout from ['"](.*?)['"]/,
        "import AdminPageHeader from '@/components/admin/AdminPageHeader'"
      );
  }

  // 2. Replace <AdminLayout title="X" subtitle="Y"> with <>\n<AdminPageHeader title="X" subtitle="Y" />
  // We need to capture title and subtitle props. They could be multiline or have different order.
  const layoutRegex = /<AdminLayout([^>]*)>/g;
  content = content.replace(layoutRegex, (match, props) => {
    // If it's a self closing tag (rare but possible), skip or handle
    if (match.endsWith('/>')) return `<AdminPageHeader${props} />`;
    return `<>\n            <AdminPageHeader${props}/>`;
  });

  // 3. Replace </AdminLayout> with </>
  content = content.replace(/<\/AdminLayout>/g, '</>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${filePath}`);
  }
}

walkDir(adminDir, processFile);
console.log('Done refactoring AdminLayout wrappers.');
