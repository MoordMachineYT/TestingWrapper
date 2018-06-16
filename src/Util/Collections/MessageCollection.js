const Collection = require("../Collection.js");
const Endpoints = require("../../Rest/Endpoints.js");
const Message = require("../../Structures/Message.js");

class MessageCollection extends Collection {
  constructor(client, channelID, base, limit) {
    super(base, limit);
    this._client = client;
    this.channelID = channelID;
  }
  set(key, val) {
    if(this.size >= this.limit) {
      this.delete(this.firstKey);
    }
    return super.set(key, val);
  }
  fetch(id) {
    return new Promise((res, rej) => {
      if(!Array.isArray(id)) {
        if(this.has(id)) {
          res(this.get(id));
        }
        this._client.RequestHandler.request("get", Endpoints.CHANNEL_MESSAGE, {
          auth: true,
          data: id
        }).then(msg => {
          res(new Message(msg));
        }).catch(err => {
          rej(err);
        });
      } else {
        if(!id.every(val => this.has(val))) {
          this._client.RequestHandler.request("get", Endpoints.CHANNEL_MESSAGES, {
            auth: true,
            data: id
          }).then(msgs => {
            return res(msgs.map(msg => new Message(msg, this._client)));
          }).catch(err => {
            rej(err);
          });
        } else {
          res(id.map(val => this.get(val)));
        }
      }
    });
  }
  send(data) {
    return this._client.send(this.channelID, data);
  }
  sendMessage(content) {
    return this._client.send(this.channelID, { content });
  }
  sendEmbed(embed) {
    return this._client.send(this.channelID, { embed });
  }
  sendCodeBlock(content, language) {
    return this._client.sendCodeBlock(this.channelID, content, language);
  }
  delete(resolvable) {
    if(resolvable instanceof Message) {
      resolvable = resolvable.id;
    }
    
  }
  get channel() {
    return this._client.channels.get(this.channelID);
  }
}

module.exports = MessageCollection;