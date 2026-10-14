import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const suffix = randomUUID().slice(0, 8);
const alice = {
  name: 'Taylor Brooks',
  username: `taylor_${suffix}`,
  email: `taylor_${suffix}@example.com`,
  password: 'BrowserTest123!',
};
const bob = {
  name: 'Jordan Ellis',
  username: `jordan_${suffix}`,
  email: `jordan_${suffix}@example.com`,
  password: 'BrowserTest123!',
};

test('desktop: signup, requests, live chat, attachment, groups, profile and dark mode', async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in to Gather' })).toBeVisible();
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByLabel('Full name').fill(alice.name);
  await page.getByLabel('Username', { exact: true }).fill(alice.username);
  await page.getByLabel('Email address').fill(alice.email);
  await page.getByLabel('Password', { exact: true }).fill(alice.password);
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();

  const second = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const response = await second.request.post('/api/auth/register', { data: bob });
  expect(response.status()).toBe(201);
  const other = await second.newPage();
  await other.goto('/');
  await expect(other.getByRole('navigation')).toBeVisible();

  await page.getByRole('button', { name: 'Friends', exact: true }).click();
  await page.getByRole('button', { name: 'Find people', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Search people' }).fill(bob.username);
  await page
    .locator('.person-card')
    .filter({ hasText: bob.name })
    .getByRole('button', { name: 'Add friend' })
    .click();
  await expect(page.getByText('Request sent', { exact: true })).toBeVisible();
  await other.getByRole('button', { name: 'Friends', exact: true }).click();
  await other.getByRole('button', { name: /Requests/ }).click();
  await other.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.getByRole('button', { name: 'Messages', exact: true }).click();
  await page.getByRole('button', { name: 'New conversation', exact: true }).click();
  await page.locator('.choose-person').filter({ hasText: bob.name }).click();
  await expect(page.getByRole('heading', { name: bob.name, exact: true })).toBeVisible();
  await other.getByRole('button', { name: 'Messages', exact: true }).click();
  await other.locator('.conversation-row').filter({ hasText: alice.name }).click();
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Good coffee, good company. Saturday? ☕');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(
    other
      .getByLabel('Conversation messages')
      .getByText('Good coffee, good company. Saturday? ☕', { exact: true }),
  ).toBeVisible();
  await other
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Wouldn’t miss it. See you there!');
  await other.getByRole('button', { name: 'Send message' }).click();
  await expect(
    page
      .getByLabel('Conversation messages')
      .getByText('Wouldn’t miss it. See you there!', { exact: true }),
  ).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({
    name: 'weekend-plan.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Saturday: café at 10am.'),
  });
  await expect(page.locator('.attachment-preview')).toContainText('weekend-plan.txt');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(other.locator('.file-message')).toContainText('weekend-plan.txt');
  await page.screenshot({ path: 'test-results/chat-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
  await expect(page.locator('.details-person')).toContainText(bob.name);
  await expect(page.locator('.shared-file-row')).toContainText('weekend-plan.txt');
  await page
    .locator('.details-panel')
    .getByRole('button', { name: 'Mute conversation', exact: true })
    .click();
  await expect(
    page
      .locator('.details-panel')
      .getByRole('button', { name: 'Unmute conversation', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'Groups', exact: true }).click();
  await page.getByRole('button', { name: 'Create a group', exact: true }).click();
  await page.getByLabel('Group name').fill('The weekend crew');
  await page.locator('.choose-person').filter({ hasText: bob.name }).click();
  await page.getByRole('button', { name: 'Create group · 2 people' }).click();
  await expect(page.getByRole('heading', { name: 'The weekend crew', exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Let’s make a little plan 🌿');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.message-bubble')).toContainText('Let’s make a little plan 🌿');
  await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
  await page.getByRole('button', { name: 'Manage group', exact: true }).click();
  await page.getByLabel('Group name').fill('Our weekend circle');
  await page.getByLabel('Group description').fill('Coffee, walks, and a little connection.');
  await page.getByRole('button', { name: 'Save group details' }).click();
  await expect(page.getByText('Group details saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Members · 2', exact: true }).click();
  await expect(page.locator('.group-member-manager')).toContainText(bob.name);
  await page.screenshot({ path: 'test-results/group-management.png', fullPage: true });
  await page.getByRole('button', { name: `Make ${bob.name} group owner` }).click();
  await page.getByRole('button', { name: 'Transfer ownership', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'View group members', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Bio', { exact: true }).fill('Taking the scenic route.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('.workspace')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'test-results/settings-dark.png', fullPage: true });
  await page.reload();
  await expect(page.locator('.workspace')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
  await second.close();
});

test('mobile: responsive chat, back navigation, settings and logout', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const mobileUser = {
    ...alice,
    username: `mobile_${suffix}`,
    email: `mobile_${suffix}@example.com`,
  };
  const contactUser = {
    ...bob,
    username: `contact_${suffix}`,
    email: `contact_${suffix}@example.com`,
  };
  const contactContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const registration = await context.request.post('/api/auth/register', { data: mobileUser });
  expect(registration.status()).toBe(201);
  const contactRegistration = await contactContext.request.post('/api/auth/register', {
    data: contactUser,
  });
  expect(contactRegistration.status()).toBe(201);
  const contact = (await contactRegistration.json()).user;
  const friendship = await context.request.post('/api/friends', { data: { userId: contact.id } });
  const friendshipId = (await friendship.json()).id;
  await contactContext.request.patch(`/api/friends/${friendshipId}`, {
    data: { action: 'accept' },
  });
  const chat = await context.request.post('/api/conversations', {
    data: { kind: 'direct', userId: contact.id },
  });
  const chatId = (await chat.json()).id;
  await contactContext.request.post(`/api/conversations/${chatId}/messages`, {
    data: { text: 'A little hello from your circle 🌿', clientId: randomUUID() },
  });
  await context.request.post('/api/auth/logout', { data: {} });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
  await page.getByLabel('Email or username').fill(mobileUser.username);
  await page.getByLabel('Password', { exact: true }).fill(alice.password);
  await page.getByRole('button', { name: 'Sign in to Gather' }).click();
  await expect(page.locator('.conversation-sidebar')).toBeVisible();
  await page.locator('.conversation-row').filter({ hasText: bob.name }).click();
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible();
  await expect(
    page
      .getByLabel('Conversation messages')
      .getByText('A little hello from your circle 🌿', { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/chat-mobile.png', fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await expect(page.locator('.conversation-sidebar')).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out of Gather', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in to Gather' })).toBeVisible();
  await context.close();
  await contactContext.close();
});
