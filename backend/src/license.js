import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const licensePath = path.join(dataDir, 'license.json');

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAFIvhs3ugy0fClRrh2uvYYp+aUfeTsf5WNcT6q7Vp4EQ=
-----END PUBLIC KEY-----`;

const normalizeInstallationId = (value) => String(value || '').trim().toUpperCase();

const getMachineSource = () => {
  if (process.platform === 'win32') {
    try {
      const output = execFileSync(
        'reg.exe',
        ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
        { encoding: 'utf8', windowsHide: true }
      );
      const match = output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
      if (match?.[1]) return `windows:${match[1].trim()}`;
    } catch {}
  }

  return `fallback:${os.hostname()}:${process.env.COMPUTERNAME || ''}`;
};

export const getInstallationId = () => {
  const digest = crypto
    .createHash('sha256')
    .update(`mill-manager-v1|${getMachineSource()}`)
    .digest('hex')
    .toUpperCase()
    .slice(0, 20);

  return digest.match(/.{1,4}/g).join('-');
};

const decodeActivationCode = (activationCode) => {
  const [payloadPart, signaturePart] = String(activationCode || '').trim().split('.');
  if (!payloadPart || !signaturePart) throw new Error('Invalid activation code');

  const payloadBytes = Buffer.from(payloadPart, 'base64url');
  const signature = Buffer.from(signaturePart, 'base64url');

  const validSignature = crypto.verify(
    null,
    payloadBytes,
    PUBLIC_KEY,
    signature
  );

  if (!validSignature) throw new Error('Activation code signature is invalid');

  const payload = JSON.parse(payloadBytes.toString('utf8'));
  if (Number(payload.version) !== 1) throw new Error('Unsupported license version');

  const installationId = getInstallationId();
  if (normalizeInstallationId(payload.installation_id) !== installationId) {
    throw new Error('This license belongs to a different computer');
  }

  return {
    version: 1,
    installation_id: installationId,
    client_name: String(payload.client_name || '').trim() || 'Licensed Client',
    issued_at: payload.issued_at || null,
  };
};

export const getLicenseStatus = () => {
  const installationId = getInstallationId();

  try {
    if (!fs.existsSync(licensePath)) {
      return { licensed: false, installation_id: installationId };
    }

    const saved = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const license = decodeActivationCode(saved.activation_code);

    return {
      licensed: true,
      installation_id: installationId,
      client_name: license.client_name,
      issued_at: license.issued_at,
      activated_at: saved.activated_at || null,
    };
  } catch (error) {
    return {
      licensed: false,
      installation_id: installationId,
      error: error.message,
    };
  }
};

export const activateLicense = (activationCode) => {
  const license = decodeActivationCode(activationCode);
  fs.mkdirSync(dataDir, { recursive: true });

  const saved = {
    activation_code: String(activationCode).trim(),
    activated_at: new Date().toISOString(),
  };

  fs.writeFileSync(licensePath, JSON.stringify(saved, null, 2), 'utf8');

  return {
    licensed: true,
    installation_id: license.installation_id,
    client_name: license.client_name,
    issued_at: license.issued_at,
    activated_at: saved.activated_at,
  };
};
