import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateKeyPath = path.join(__dirname, 'license-private.pem');

const installationId = String(process.argv[2] || '').trim().toUpperCase();
const clientName = String(process.argv.slice(3).join(' ') || '').trim();

if (!installationId || !clientName) {
  console.error('Usage: node developer/GenerateLicense.mjs INSTALLATION-ID "Client / Mill Name"');
  process.exit(1);
}

if (!fs.existsSync(privateKeyPath)) {
  console.error('Missing developer/license-private.pem');
  console.error('Keep the private key on the developer computer only.');
  process.exit(1);
}

const payload = {
  version: 1,
  installation_id: installationId,
  client_name: clientName,
  issued_at: new Date().toISOString().slice(0, 10),
};

const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const signature = crypto.sign(null, payloadBytes, privateKey);

const activationCode =
  payloadBytes.toString('base64url') + '.' + signature.toString('base64url');

console.log('');
console.log('Mill Management Activation Code');
console.log('================================');
console.log('Client:          ' + clientName);
console.log('Installation ID: ' + installationId);
console.log('');
console.log(activationCode);
console.log('');
