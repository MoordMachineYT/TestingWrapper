"use strict";

const Collection = require("./Collection.js");

class Permissions extends Collection {
  constructor(num) {
    super();
    if(num >= (1 << 30)) {
      this.set("manageEmojis", true);
      num -= (1 << 30);
    }
    if(num >= (1 << 29)) {
      this.set("manageWebhooks", true);
      num -= (1 << 29);
    }
    if(num >= (1 << 28)) {
      this.set("manageRoles", true);
      num -= (1 << 28);
    }
    if(num >= (1 << 27)) {
      this.set("manageNicknames", true);
      num -= (1 << 27);
    }
    if(num >= (1 << 26)) {
      this.set("changeNickname", true);
      num -= (1 << 26);
    }
    if(num >= (1 << 25)) {
      this.set("voiceUseVAD", true);
      num -= (1 << 25);
    }
    if(num >= (1 << 24)) {
      this.set("voiceMoveMembers", true);
      num -= (1 << 24);
    }
    if(num >= (1 << 23)) {
      this.set("voiceDeafenMembers", true);
      num -= (1 << 23);
    }
    if(num >= (1 << 22)) {
      this.set("voiceMuteMembers", true);
      num -= (1 << 22);
    }
    if(num >= (1 << 21)) {
      this.set("voiceSpeak", true);
      num -= (1 << 21);
    }
    if(num >= (1 << 20)) {
      this.set("voiceConnect", true);
      num -= (1 << 20);
    }
    if(num >= (1 << 18)) {
      this.set("externalEmojis", true);
      num -= (1 << 18);
    }
    if(num >= (1 << 17)) {
      this.set("mentionEveryone", true);
      num -= (1 << 17);
    }
    if(num >= (1 << 16)) {
      this.set("readMessageHistory", true);
      num -= (1 << 16);
    }
    if(num >= (1 << 15)) {
      this.set("attachFiles", true);
      num -= (1 << 15);
    }
    if(num >= (1 << 14)) {
      this.set("embedLinks", true);
      num -= (1 << 14);
    }
    if(num >= (1 << 13)) {
      this.set("manageMessages", true);
      num -= (1 << 13);
    }
    if(num >= (1 << 12)) {
      this.set("sendTTSMessages", true);
      num -= (1 << 12);
    }
    if(num >= (1 << 11)) {
      this.set("sendMessages", true);
      num -= (1 << 11);
    }
    if(num >= (1 << 10)) {
      this.set("readMessages", true);
      num -= (1 << 10);
    }
    if(num >= (1 << 7)) {
      this.set("viewAuditLogs", true);
      num -= (1 << 7);
    }
    if(num >= (1 << 6)) {
      this.set("addReactions", true);
      num -= (1 << 6);
    }
    if(num >= (1 << 5)) {
      this.set("manageGuild", true);
      num -= (1 << 5);
    }
    if(num >= (1 << 4)) {
      this.set("manageChannels", true);
      num -= (1 << 4);
    }
    if(num >= (1 << 3)) {
      this.set("administrator", true);
      num -= (1 << 3);
    }
    if(num >= (1 << 2)) {
      this.set("banMembers", true);
      num -= (1 << 2);
    }
    if(num >= (1 << 1)) {
      this.set("kickMembers", true);
      num -= (1 << 1);
    }
    if(num >= (1 << 0)) {
      this.set("createInstantInvite", true);
      num -= (1 << 0);
    }
  }
}

module.exports = Permissions;