// Generate a real, quiet one-second PCM WAV so the seeded audio player works offline.
export function createAudioSample() {
  const rate = 8000;
  const samples = rate;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const envelope = Math.min(index / 400, (samples - index) / 400, 1);
    buffer.writeInt16LE(
      Math.round(900 * envelope * Math.sin((2 * Math.PI * 440 * index) / rate)),
      44 + index * 2,
    );
  }
  return buffer;
}
