import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');
const backupDir = path.join(root, 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = [
  now.getFullYear(),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
].join('') + '-' + [
  pad(now.getHours()),
  pad(now.getMinutes()),
  pad(now.getSeconds()),
].join('');

const destination = path.join(backupDir, `mill-${stamp}.db`);

try {
  await db.backup(destination);
  console.log('');
  console.log('Backup completed successfully:');
  console.log(destination);
  console.log('');
} finally {
  db.close();
}
