import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('reconnecting after more than one page of messages leaves no history gap', async ({
  browser,
}) => {
  const suffix = randomUUID().slice(0, 8);
  const owner = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const contact = await browser.newContext({ baseURL: 'http://localhost:3000' });
  try {
    const register = async (context, prefix) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          name: prefix,
          username: `${prefix}_${suffix}`,
          email: `${prefix}_${suffix}@example.com`,
          password: 'Reconnect123!',
        },
      });
      expect(response.status()).toBe(201);
      return (await response.json()).user;
    };
    const user = await register(owner, 'reconnectowner');
    const peer = await register(contact, 'reconnectpeer');
    const friend = await owner.request.post('/api/friends', { data: { userId: peer.id } });
    await contact.request.patch(`/api/friends/${(await friend.json()).id}`, {
      data: { action: 'accept' },
    });
    const creation = await owner.request.post('/api/conversations', {
      data: { kind: 'direct', userId: peer.id },
    });
    const id = (await creation.json()).id;
    const send = async (text) => {
      const response = await contact.request.post(`/api/conversations/${id}/messages`, {
        data: { text, clientId: randomUUID() },
      });
      expect(response.status()).toBe(201);
    };
    await send('Before going offline');
    const page = await owner.newPage();
    await page.addInitScript(() => {
      const Native = window.WebSocket;
      window.WebSocket = class extends Native {
        constructor(...args) {
          super(...args);
          if (String(args[0]).includes('/socket.io/')) window.__gatherSocket = this;
        }
      };
    });
    await page.goto('/');
    await page.locator('.conversation-row').filter({ hasText: peer.name }).click();
    await expect(
      page.getByLabel('Conversation messages').getByText('Before going offline', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('.sidebar-footer')).toContainText('Connected.');
    await owner.setOffline(true);
    await page.evaluate(() => window.__gatherSocket.close());
    await expect(page.locator('.sidebar-footer')).toContainText('Reconnecting');
    for (let index = 0; index < 51; index++) await send(`Offline message ${index}`);
    await owner.setOffline(false);
    await expect(
      page.getByLabel('Conversation messages').getByText('Offline message 50', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('.message-row')).toHaveCount(50);
    await page.locator('.message-scroll').evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event('scroll'));
    });
    await page.getByRole('button', { name: 'Load earlier messages', exact: true }).click();
    await expect(page.locator('.message-row')).toHaveCount(52);
    await expect(
      page.getByLabel('Conversation messages').getByText('Offline message 0', { exact: true }),
    ).toHaveCount(1);
    expect((await owner.request.get('/api/me')).status()).toBe(200);
  } finally {
    await owner.close();
    await contact.close();
  }
});
