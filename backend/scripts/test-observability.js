'use strict';
// Run: node scripts/test-observability.js
const mongoose = require('mongoose');
const http = require('http');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shree_yantra';
const BASE = 'http://localhost:4000/api';

function req(method, path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const r = http.request(
      url,
      { method, headers: token ? { Authorization: `Bearer ${token}` } : {} },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
          } catch {
            resolve({ status: res.statusCode, body: body.slice(0, 500) });
          }
        });
      },
    );
    r.on('error', reject);
    r.end();
  });
}

async function main() {
  await mongoose.connect(MONGO);
  const User = require('../src/models/User');
  const { signToken } = require('../src/services/auth.service');
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user in DB');
    process.exit(1);
  }
  const token = signToken(admin);
  console.log('Admin:', admin.email);

  for (const path of [
    '/admin/observability/overview',
    '/admin/observability/errors?page=1&limit=5',
    '/admin/observability/api-stats?hours=24',
    '/admin/observability/logs?page=1&limit=5',
  ]) {
    const r = await req('GET', path, token);
    console.log(path, '→', r.status, typeof r.body === 'string' ? r.body : JSON.stringify(r.body).slice(0, 300));
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
