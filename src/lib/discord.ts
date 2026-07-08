export const PERMISSIONS: { bit: number; name: string }[] = [
  { bit: 0, name: "Create Instant Invite" },
  { bit: 1, name: "Kick Members" },
  { bit: 2, name: "Ban Members" },
  { bit: 3, name: "Administrator" },
  { bit: 4, name: "Manage Channels" },
  { bit: 5, name: "Manage Guild" },
  { bit: 6, name: "Add Reactions" },
  { bit: 7, name: "View Audit Log" },
  { bit: 8, name: "Priority Speaker" },
  { bit: 9, name: "Stream" },
  { bit: 10, name: "View Channel" },
  { bit: 11, name: "Send Messages" },
  { bit: 12, name: "Send TTS Messages" },
  { bit: 13, name: "Manage Messages" },
  { bit: 14, name: "Embed Links" },
  { bit: 15, name: "Attach Files" },
  { bit: 16, name: "Read Message History" },
  { bit: 17, name: "Mention Everyone" },
  { bit: 18, name: "Use External Emojis" },
  { bit: 19, name: "View Guild Insights" },
  { bit: 20, name: "Connect" },
  { bit: 21, name: "Speak" },
  { bit: 22, name: "Mute Members" },
  { bit: 23, name: "Deafen Members" },
  { bit: 24, name: "Move Members" },
  { bit: 25, name: "Use Voice Activity" },
  { bit: 26, name: "Change Nickname" },
  { bit: 27, name: "Manage Nicknames" },
  { bit: 28, name: "Manage Roles" },
  { bit: 29, name: "Manage Webhooks" },
  { bit: 30, name: "Manage Guild Expressions" },
  { bit: 31, name: "Use Application Commands" },
  { bit: 32, name: "Request To Speak" },
  { bit: 33, name: "Manage Events" },
  { bit: 34, name: "Manage Threads" },
  { bit: 35, name: "Create Public Threads" },
  { bit: 36, name: "Create Private Threads" },
  { bit: 37, name: "Use External Stickers" },
  { bit: 38, name: "Send Messages In Threads" },
  { bit: 39, name: "Use Embedded Activities" },
  { bit: 40, name: "Moderate Members" },
  { bit: 41, name: "View Creator Monetization Analytics" },
  { bit: 42, name: "Use Soundboard" },
  { bit: 43, name: "Create Guild Expressions" },
  { bit: 44, name: "Create Events" },
  { bit: 45, name: "Use External Sounds" },
  { bit: 46, name: "Send Voice Messages" },
];

export const DISCORD_EPOCH = 1420070400000n;

export function decodeSnowflake(id: string) {
  if (!/^\d{15,21}$/.test(id.trim())) {
    throw new Error("A Discord ID is 15–21 digits. Paste just the numeric ID.");
  }
  const n = BigInt(id.trim());
  return {
    timestampMs: Number((n >> 22n) + DISCORD_EPOCH),
    workerId: Number((n >> 17n) & 0x1fn),
    processId: Number((n >> 12n) & 0x1fn),
    increment: Number(n & 0xfffn),
  };
}
