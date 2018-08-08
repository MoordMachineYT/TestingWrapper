const Channel = require("./Channel.js");
const User = require("./User.js");

class GroupChannel extends Channel {
  constructor(data, client) {
    super(data, client);
    this.ownerID = data.owner_id;
    this.lastPinTimestamp = data.last_pin_timestamp;
    this.recipients = data.recipients.map(user => this._client.users.get(user.id) || this._client.users.set(user.id, new User(user, this._client)));
  }
}

module.exports = GroupChannel;