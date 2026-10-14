import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function fixture(browser, history = 1) {
  const suffix = randomUUID().slice(0, 8);
  const owner = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const contact = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const register = async (context, prefix, name) => {
    const response = await context.request.post('/api/auth/register', {
      data: {
        name,
        username: `${prefix}_${suffix}`,
        email: `${prefix}_${suffix}@example.com`,
        password: 'ReviewPassword123!',
      },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).user;
  };
  const ownerUser = await register(owner, 'reviewowner', 'Review User');
  const contactUser = await register(contact, 'reviewcontact', 'Review Contact');
  const request = await owner.request.post('/api/friends', { data: { userId: contactUser.id } });
  await contact.request.patch(`/api/friends/${(await request.json()).id}`, {
    data: { action: 'accept' },
  });
  const creation = await owner.request.post('/api/conversations', {
    data: { kind: 'direct', userId: contactUser.id },
  });
  const conversationId = (await creation.json()).id;
  for (let index = 0; index < history; index++) {
    const response = await contact.request.post(`/api/conversations/${conversationId}/messages`, {
      data: { text: `History ${index}`, clientId: randomUUID() },
    });
    expect(response.status()).toBe(201);
  }
  return {
    owner,
    contact,
    ownerUser,
    contactUser,
    conversationId,
    close: async () => {
      await owner.close();
      await contact.close();
    },
  };
}

test('history keeps its scroll position and hidden conversations remain unread', async ({
  browser,
}) => {
  const data = await fixture(browser, 55);
  try {
    const page = await data.owner.newPage();
    await page.goto('/');
    await page.locator('.conversation-row').filter({ hasText: 'Review Contact' }).click();
    await expect(
      page.getByLabel('Conversation messages').getByText('History 54', { exact: true }),
    ).toBeVisible();
    const scroller = page.locator('.message-scroll');
    await scroller.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event('scroll'));
    });
    const anchor = page.getByLabel('Conversation messages').getByText('History 5', { exact: true });
    const before = (await anchor.boundingBox()).y;
    await page.getByRole('button', { name: 'Load earlier messages', exact: true }).click();
    await expect(page.locator('.message-row')).toHaveCount(55);
    const after = (await anchor.boundingBox()).y;
    expect(Math.abs(after - before)).toBeLessThan(6);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const response = await data.contact.request.post(
      `/api/conversations/${data.conversationId}/messages`,
      { data: { text: 'Keep me unread on Settings', clientId: randomUUID() } },
    );
    expect(response.status()).toBe(201);
    const unread = async () => {
      const response = await data.owner.request.get('/api/conversations');
      return (await response.json()).conversations.find((c) => c.id === data.conversationId).unread;
    };
    await expect.poll(unread).toBe(1);
    await page.getByRole('button', { name: 'Messages', exact: true }).click();
    await expect(
      page
        .getByLabel('Conversation messages')
        .getByText('Keep me unread on Settings', { exact: true }),
    ).toBeVisible();
    await expect.poll(unread).toBe(0);
  } finally {
    await data.close();
  }
});

test('phone and tablet layouts support chat, group dialogs, friends and settings', async ({
  browser,
}) => {
  const data = await fixture(browser);
  try {
    const creation = await data.owner.request.post('/api/conversations', {
      data: { kind: 'group', name: 'Mobile review circle', memberIds: [data.contactUser.id] },
    });
    expect(creation.status()).toBe(201);
    const page = await data.owner.newPage();
    for (const [width, height] of [
      [320, 568],
      [360, 740],
      [390, 844],
      [430, 932],
      [768, 1024],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.locator('.conversation-row').filter({ hasText: 'Review Contact' }).click();
      await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
      await expect(
        page.getByLabel('Conversation messages').getByText('History 0', { exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (width <= 760) {
        expect(
          await page
            .getByRole('textbox', { name: 'Message', exact: true })
            .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
        ).toBeGreaterThanOrEqual(16);
        expect(
          (await page.getByRole('button', { name: 'Send message' }).boundingBox()).width,
        ).toBeGreaterThanOrEqual(44);
        await page.setViewportSize({ width, height: 440 });
        const box = await page.getByRole('button', { name: 'Send message' }).boundingBox();
        expect(box.y + box.height).toBeLessThanOrEqual(440);
        await page.setViewportSize({ width, height });
      }
      await page.screenshot({ path: `test-results/mobile-review-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Groups', exact: true }).click();
      await page.locator('.group-card').filter({ hasText: 'Mobile review circle' }).click();
      await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
      await page.getByRole('button', { name: 'Manage group', exact: true }).click();
      await page.getByRole('button', { name: 'Members · 2', exact: true }).click();
      expect(
        await page.getByRole('dialog').evaluate((node) => node.scrollWidth <= node.clientWidth),
      ).toBe(true);
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await page.getByRole('button', { name: 'Close details', exact: true }).click();
      await page.getByRole('button', { name: 'Friends', exact: true }).click();
      await expect(page.locator('.friend-row')).toContainText('Review Contact');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.getByLabel('Full name')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  } finally {
    await data.close();
  }
});

test('a late microphone permission response releases its track after leaving chat', async ({
  browser,
}) => {
  const data = await fixture(browser);
  try {
    const page = await data.owner.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: () =>
          new Promise((resolve) => {
            window.__resolveMedia = resolve;
          }),
      });
    });
    await page.goto('/');
    await page.locator('.conversation-row').filter({ hasText: 'Review Contact' }).click();
    await page.getByRole('button', { name: 'Record a voice message' }).click();
    await expect(page.getByRole('button', { name: 'Record a voice message' })).toBeDisabled();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.evaluate(() => {
      window.__audioContext = new AudioContext();
      const stream = window.__audioContext.createMediaStreamDestination().stream;
      window.__lateTrack = stream.getAudioTracks()[0];
      window.__resolveMedia(stream);
    });
    await expect.poll(() => page.evaluate(() => window.__lateTrack.readyState)).toBe('ended');
    await page.evaluate(() => window.__audioContext.close());
  } finally {
    await data.close();
  }
});
