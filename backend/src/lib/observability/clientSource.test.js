'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveClientSource, sourceFilter } = require('./clientSource');

describe('clientSource', () => {
  it('detects mobile from platform', () => {
    assert.equal(resolveClientSource({ platform: 'android' }), 'mobile');
    assert.equal(resolveClientSource({ platform: 'ios' }), 'mobile');
  });

  it('detects website from platform or request id', () => {
    assert.equal(resolveClientSource({ platform: 'web' }), 'website');
    assert.equal(resolveClientSource({ request_id: 'w-abc-123' }), 'website');
  });

  it('detects admin from platform or route', () => {
    assert.equal(resolveClientSource({ platform: 'admin' }), 'admin');
    assert.equal(resolveClientSource({ route: '/api/admin/observability/logs' }), 'admin');
  });

  it('detects mobile from request id prefix', () => {
    assert.equal(resolveClientSource({ request_id: 'm-123-456' }), 'mobile');
  });

  it('builds mongo filter for source', () => {
    const f = sourceFilter('mobile');
    assert.ok(f.$or);
  });
});
