import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.DEMO_BASE_URL || 'http://localhost:3000';
const report = { checkedAt: new Date().toISOString(), service: 'Amazon S3', checks: {} };
try {
  const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'demo@eprproof.ai', password: 'EPRProof@2026' }) });
  if (!login.ok) throw new Error('Demo login failed');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const status = await fetch(`${base}/api/aws/s3`, { headers: { cookie } });
  const connection = await status.json();
  if (!status.ok || !connection.connected) throw new Error(connection.error || 'S3 disconnected');
  report.bucket = connection.bucket;
  report.region = connection.region;
  report.checks.connection = 'PASS';
  const bytes = await readFile(new URL('../submission/sample-evidence.txt', import.meta.url));
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'text/plain' }), 'sample-evidence.txt');
  const upload = await fetch(`${base}/api/aws/s3`, { method: 'POST', headers: { cookie }, body: form });
  const receipt = await upload.json();
  if (!upload.ok) throw new Error(receipt.error || 'Upload failed');
  report.checks.upload = 'PASS';
  report.objectKey = receipt.key;
  const download = await fetch(receipt.downloadUrl);
  if (!download.ok) throw new Error(`Download failed: ${download.status}`);
  const received = Buffer.from(await download.arrayBuffer());
  if (!bytes.equals(received)) throw new Error('Downloaded content differs from uploaded evidence');
  report.checks.signedDownload = 'PASS';
  report.sha256 = createHash('sha256').update(received).digest('hex');
  report.success = true;
} catch (error) {
  report.success = false;
  report.error = error.message;
  process.exitCode = 1;
}
await writeFile(new URL('../submission/aws-validation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
