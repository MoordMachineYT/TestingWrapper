module.exports = {
  /* Gateway */
  GATEWAY_URL: "wss://gateway.discord.gg/",
  GATEWAY_VERSION: "6",

  /* OPcodes */
  OPCodes: {
    DISPATCH: 0,
    HEARTBEAT: 1,
    IDENTIFY: 2,
    STATUS_UPDATE: 3,
    VOICE_STATUS_UPDATE: 4,
    VOICE_SERVER_PING: 5,
    RESUME: 6,
    RECONNECT: 7,
    REQUEST_GUILD_MEMBERS: 8,
    INVALID_SESSION: 9,
    HELLO: 10,
    HEARTBEAT_ACK: 11
  },

  /* Gateway close event codes */
  GatewayClose: {
    UNKNOWN_ERROR: 4000,
    UNKNOWN_OP_CODE: 4001,
    DECODE_ERROR: 4002,
    NOT_AUTHENTICATED: 4003,
    AUTHENTICATION_FAILED: 4004,
    ALREADY_AUTHENTICATED: 4005,
    INVALID_SEQ: 4007,
    RATE_LIMITED: 4008,
    SESSION_TIMEOUT: 4009,
    INVALID_SHARD: 4010,
    SHARDING_REQUIRED: 4011
  },

  /* Shard error responses */
  WSError: {
    EXISTS: "WebSocket is already connected",
    DOESNT_EXIST: "WebSocket doesn't exist",
    CLOSED: "WebSocket hang up",
    READY: "WebSocket hang up before firing ready"
  },
  /* Channel types */
  ChannelType: {
    GUILD_TEXT: 0,
    DM: 1,
    GUILD_VOICE: 2,
    GROUP_DM: 3,
    GUILD_CATEGORY: 4
  },

  /* User constants */
  DefaultAvatarHashes: [
    "6debd47ed13483642cf09e832ed0bc1b",
    "322c936a8c8be1b803cd94861bdfa868",
    "dd4dbc0016779df1378e7812eabaa04d",
    "0e291f67c9274a1abdddeb3fd919cbaa",
    "1cbd08c76f8af6dddce02c5138971129"
  ]
};