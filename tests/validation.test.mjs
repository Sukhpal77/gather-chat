import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accountInput,
  objectId,
  pairKey,
  passwordInput,
  sameOrigin,
} from '../src/lib/validation.mjs';
import { cookieToken } from '../src/lib/auth.mjs';

test('accounts normalize identifiers and reject invalid data', () => {
  assert.equal(
    accountInput({
      name: ' Jamie ',
      username: 'JaMie',
      email: 'JAMIE@EXAMPLE.COM',
      password: 'password123',
    }).email,
    'jamie@example.com',
  );
  assert.throws(() =>
    accountInput({ name: 'Jamie', username: '$where', email: 'invalid', password: 'short' }),
  );
  assert.throws(() => passwordInput('🙂'.repeat(19)), /UTF-8/);
  assert.equal(passwordInput('🙂'.repeat(18)), '🙂'.repeat(18));
});
test('IDs and cookie parsing cannot select unexpected records', () => {
  assert.throws(() => objectId({ $ne: null }));
  assert.throws(() => objectId('not-an-id'));
  assert.equal(pairKey('b', 'a'), pairKey('a', 'b'));
  assert.equal(cookieToken('other=1; gather_session=abc; more=2'), 'abc');
  assert.equal(cookieToken('fake_gather_session=abc'), undefined);
});
test('cross-origin writes are rejected', () => {
  assert.throws(
    () =>
      sameOrigin(
        new Request('http://localhost:3000/api/me', {
          headers: { origin: 'https://evil.example' },
        }),
      ),
    /origin/,
  );
  assert.doesNotThrow(() =>
    sameOrigin(
      new Request('http://localhost:3000/api/me', { headers: { origin: 'http://localhost:3000' } }),
    ),
  );
});
