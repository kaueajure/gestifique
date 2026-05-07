import fs from 'fs';
import path from 'path';

function fixImports(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will match string literals starting with '.' inside imports/exports
      content = content.replace(/(from\s+|import\s+)['"](\.[^'"]+)['"]/g, (match, prefix, p1) => {
         // remove .js if it is already there
         let modulePath = p1;
         if (modulePath.endsWith('.js')) {
            modulePath = modulePath.slice(0, -3);
         }
         
         const resolvedPath = path.resolve(dir, modulePath);
         
         // check if there's a file named modulePath.ts
         if (fs.existsSync(resolvedPath + '.ts')) {
             return `${prefix}'${modulePath}.js'`;
         } else if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
             // check if there's an index.ts inside
             if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) {
                 return `${prefix}'${modulePath}/index.js'`;
             }
         }
         
         // default fallback
         return match;
      });

      if (content !== fs.readFileSync(fullPath, 'utf8')) {
         fs.writeFileSync(fullPath, content, 'utf8');
         console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImports('./server');
