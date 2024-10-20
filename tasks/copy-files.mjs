import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDirs = [path.resolve(__dirname, '../dist'), path.resolve(__dirname, '../scripts')];
const destDirs = [path.resolve('C:/Users/taylo/AppData/Local/FoundryVTT/Data/modules/pf2e-automated-gm/dist'), path.resolve('C:/Users/taylo/AppData/Local/FoundryVTT/Data/modules/pf2e-automated-gm/scripts')];

function copyFiles(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (let i = 0; i < srcDirs.length; i++) {
  const srcDir = srcDirs[i];
  const destDir = destDirs[i];
  copyFiles(srcDir, destDir);
  console.log(`Copied files from ${srcDir} to ${destDir}`);
}