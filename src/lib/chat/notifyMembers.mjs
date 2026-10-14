export function notifyMembers(members, event, payload) {
  const io = globalThis.gatherIO;
  if (io) io.to(members.map((id) => `user:${id}`)).emit(event, payload);
}
