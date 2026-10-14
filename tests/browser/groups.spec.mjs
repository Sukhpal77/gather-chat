import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('group owners, admins and invited members complete the management flow', async ({
  browser,
}) => {
  const suffix = randomUUID().slice(0, 8);
  const contexts = [];
  const actors = [];
  for (const [username, name] of [
    ['owner', 'Group Owner'],
    ['admin', 'Group Admin'],
    ['invitee', 'Invited Friend'],
  ]) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
    contexts.push(context);
    const response = await context.request.post('/api/auth/register', {
      data: {
        name,
        username: `${username}_${suffix}`,
        email: `${username}_${suffix}@example.com`,
        password: 'GroupTest123!',
      },
    });
    expect(response.status()).toBe(201);
    actors.push({ context, user: (await response.json()).user });
  }
  try {
    const [owner, admin, invitee] = actors;
    for (const actor of [admin, invitee]) {
      const request = await owner.context.request.post('/api/friends', {
        data: { userId: actor.user.id },
      });
      const id = (await request.json()).id;
      await actor.context.request.patch(`/api/friends/${id}`, { data: { action: 'accept' } });
    }
    const creation = await owner.context.request.post('/api/conversations', {
      data: { kind: 'group', name: 'Our shared circle', memberIds: [admin.user.id] },
    });
    expect(creation.status()).toBe(201);
    const page = await owner.context.newPage();
    await page.goto('/');
    await page.locator('.conversation-row').filter({ hasText: 'Our shared circle' }).click();
    await page.getByRole('button', { name: 'Conversation details', exact: true }).click();
    await page.getByRole('button', { name: 'Manage group', exact: true }).click();
    await page.getByRole('button', { name: 'Members · 2', exact: true }).click();
    await page.getByRole('button', { name: 'Make admin Group Admin', exact: true }).click();
    await page.getByRole('button', { name: 'Make admin', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Remove admin role from Group Admin', exact: true }),
    ).toBeVisible();
    await page.locator('.choose-person').filter({ hasText: 'Invited Friend' }).click();
    await page
      .getByRole('button', { name: 'Invite selected friends instead', exact: true })
      .click();
    await expect(
      page.getByText('Invitations sent. Your friends can accept from Groups.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Invitations', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Invited Friend');

    const invitedPage = await invitee.context.newPage();
    await invitedPage.goto('/');
    await invitedPage.getByRole('button', { name: 'Groups', exact: true }).click();
    await expect(invitedPage.locator('.group-incoming-invitations')).toContainText(
      'Our shared circle',
    );
    await invitedPage.screenshot({ path: 'test-results/group-invitation.png', fullPage: true });
    await invitedPage.getByRole('button', { name: 'Accept invitation', exact: true }).click();
    await expect(
      invitedPage.getByRole('heading', { name: 'Our shared circle', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('No pending invitations.');

    const adminPage = await admin.context.newPage();
    await adminPage.goto('/');
    await adminPage.locator('.conversation-row').filter({ hasText: 'Our shared circle' }).click();
    await adminPage.getByRole('button', { name: 'Conversation details', exact: true }).click();
    await adminPage.getByRole('button', { name: 'Manage group', exact: true }).click();
    await adminPage.getByLabel('Group name').fill('Admin updated circle');
    await adminPage.getByRole('button', { name: 'Save group details' }).click();
    await expect(
      invitedPage.getByRole('heading', { name: 'Admin updated circle', exact: true }),
    ).toBeVisible();
    await adminPage.getByRole('button', { name: 'Members · 3', exact: true }).click();
    await expect(adminPage.getByRole('button', { name: /Make .* group owner/ })).toHaveCount(0);
    await adminPage
      .getByRole('button', { name: 'Remove Invited Friend from group', exact: true })
      .click();
    await adminPage.getByRole('button', { name: 'Remove member', exact: true }).click();
    await expect(
      invitedPage.locator('.conversation-row').filter({ hasText: 'Admin updated circle' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Members · 2', exact: true }).click();
    await page
      .getByRole('button', { name: 'Remove admin role from Group Admin', exact: true })
      .click();
    await page.getByRole('button', { name: 'Remove admin role', exact: true }).click();
    await expect(adminPage.getByRole('dialog')).toContainText('Only owners and admins');
    await expect(adminPage.getByRole('button', { name: 'Save group details' })).toHaveCount(0);
  } finally {
    for (const context of contexts) await context.close();
  }
});
