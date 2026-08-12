'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function sourceFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(?:js|jsx|ts|tsx|json)$/.test(entry.name) ? [full] : [];
  });
}

test('MSG91 server secrets and demo OTP are absent from frontend source', () => {
  const repo = path.resolve(__dirname, '..', '..', '..');
  const files = [
    ...sourceFiles(path.join(repo, 'mobile', 'src')),
    ...sourceFiles(path.join(repo, 'website', 'src')),
    ...sourceFiles(path.join(repo, 'admin', 'src')),
  ];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /MSG91_AUTHKEY|MSG91_OTP_TEMPLATE_ID|MSG91_TEMPLATE_ID/);
    assert.doesNotMatch(content, /devCode/);
  }
});
