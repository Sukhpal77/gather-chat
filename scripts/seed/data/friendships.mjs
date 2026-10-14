export const friendships = [
  { from: 'jamie', to: 'alex', status: 'accepted' },
  { from: 'jamie', to: 'sam', status: 'accepted' },
  { from: 'jamie', to: 'priya', status: 'accepted' },
  { from: 'alex', to: 'sam', status: 'accepted' },
  { from: 'alex', to: 'priya', status: 'accepted' },
  { from: 'sam', to: 'priya', status: 'accepted' },
  { from: 'sam', to: 'morgan', status: 'accepted' },
  { from: 'morgan', to: 'jamie', status: 'pending' },
  { from: 'jamie', to: 'casey', status: 'pending' },
  { from: 'alex', to: 'casey', status: 'blocked', blockedBy: 'alex' },
];
