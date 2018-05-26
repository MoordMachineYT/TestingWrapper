module.exports = {
  /* Standard shit */
  BASE: "https://discordapp.com/api/v7",
  CDN: "https://cdn.discordapp.com",
  GATEWAY_BOT: "/gateway/bot",

  /* Channel */
  CHANNEL: (channelID) => `/channels/${channelID}`,
  CHANNEL_BULK_DELETE: (channelID) => `/channels/${channelID}/messages/bulk-delete`,
  CHANNEL_MESSAGE: (channelID, messageID) => `/channels/${channelID}/messages/${messageID}`,
  CHANNEL_MESSAGES: (channelID) => `/channels/${channelID}/messages`,
  CHANNEL_MESSAGES_SEARCH: (channelID) => `/channels/${channelID}/messages/search`,
  CHANNEL_MESSAGE_REACTION: (channelID, messageID, reaction) => `/channels/${channelID}/messages/${messageID}/reactions/${reaction}`,
  CHANNEL_MESSAGE_REACTION_USER: (channelID, messageID, reaction, userID) => `/channels/${channelID}/messages/${messageID}/reactions/${reaction}/${userID}`,
  CHANNEL_MESSAGE_REACTIONS: (channelID, messageID) => `/channels/${channelID}/messages/${messageID}/reactions`,
  CHANNEL_PERMISSION: (channelID, overwriteID) => `/channels/${channelID}/permissions/${overwriteID}`,
  CHANNEL_PERMISSIONS: (channelID) => `/channels/${channelID}/permissions`,
  CHANNEL_PIN: (channelID, messageID) => `/channels/${channelID}/pins/${messageID}`,
  CHANNEL_PINS: (channelID) => `/channels/${channelID}/pins`,
  CHANNEL_RECEPIENT: (groupID, userID) => `/channels/${groupID}/recipients/${userID}`,
  CHANNEL_TYPING: (channelID) => `/channels/${channelID}/typing`,
  CHANNELS: "/channels",

  /* Guild */
  GUILD: (guildID) => `/guilds/${guildID}`,
  GUILD_AUDIT_LOGS: (guildID) => `/guilds/${guildID}/audit-logs`,
  GUILD_BAN: (guildID, memberID) => `/guilds/${guildID}/bans/${memberID}`,
  GUILD_BANS: (guildID) => `/guilds/${guildID}/bans`,
  GUILD_CHANNELS: (guildID) => `/guilds/${guildID}/channels`,
  GUILD_EMBED: (guildID) => `/guilds/${guildID}/embed`,
  GUILD_EMOJI: (guildID, emojiID) => `/guilds/${guildID}/emojis/${emojiID}`,
  GUILD_EMOJIS: (guildID) => `/guilds/${guildID}/emojis`,
  GUILD_INTEGRATION: (guildID, intID) => `/guilds/${guildID}/integrations/${intID}`,
  GUILD_INTEGRATION_SYNC: (guildID, intID) => `/guilds/${guildID}/integrations/${intID}/sync`,
  GUILD_INTEGRATIONS: (guildID) => `/guilds/${guildID}/integrations`,
  GUILD_INVITES: (guildID) => `/guilds/${guildID}/invites`,
  GUILD_MEMBER: (guildID, memberID) => `/guilds/${guildID}/members/${memberID}`,
  GUILD_MEMBER_NICK: (guildID, memberID) => `/guilds/${guildID}/members/${memberID}/nick`,
  GUILD_MEMBER_ROLES: (guildID, memberID, roleID) => `/guilds/${guildID}/members/${memberID}/roles/${roleID}`,
  GUILD_MEMBERS: (guildID) => `/guilds/${guildID}/members`,
  GUILD_PRUNE: (guildID) => `/guilds/${guildID}/prune`,
  GUILD_ROLE: (guildID, roleID) => `/guilds/${guildID}/roles/${roleID}`,
  GUILD_ROLES: (guildID) => `/guilds/${guildID}/roles`,
  GUILD_VOICE_REGIONS: (guildID) => `/guilds/${guildID}/regions`,
  GUILD_WEBHOOKS: (guildID) => `/guilds/${guildID}/webhooks`,
  GUILDS: "/guilds",

  /* User */
  USER: (userID) => `/users/${userID}`,
  USER_CHANNELS: (userID) => `/users/${userID}/channels`,
  USER_GUILD: (userID, guildID) => `/users/${userID}/guilds/${guildID}`,
  USER_GUILDS: (userID) => `/users/${userID}/guilds`,
  USERS: "/users",

  /* Webhook */
  WEBHOOK: (hookID) => `/webhooks/${hookID}`,
  WEBHOOK_SLACK: (hookID) => `/webhooks/${hookID}/slack`,
  WEBHOOK_TOKEN: (hookID, token) => `/webhooks/${hookID}/${token}`,
  WEBHOOK_TOKEN_SLACK: (hookID, token) => `/webhooks/${hookID}/${token}/slack`
};
