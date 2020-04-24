const PubNub = require("pubnub");
const Transaction = require("../transaction");

const CHANNELS_MAP = {
  TEST: "TEST",
  BLOCK: "BLOCK",
  TRANSACTION: "TRANSACTION",
};

class PubSub {
  constructor({ blockchain, transactionQueue, credentials }) {
    //console.log(credentials);
    this.credentials = JSON.parse(credentials);
    this.pubnub = new PubNub(this.credentials);
    this.blockchain = blockchain;
    this.transactionQueue = transactionQueue;
    this.subscribeToChannels();
    this.listen();
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: Object.values(CHANNELS_MAP),
    });
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  listen() {
    this.pubnub.addListener({
      message: (messageObject) => {
        const { channel, message } = messageObject;
        const parsedMessage = JSON.parse(message);

        console.log("Message received. Channel:", channel);

        switch (channel) {
          case CHANNELS_MAP.BLOCK:
            console.log("block message", message);

            this.blockchain
              .addBlock({
                block: parsedMessage,
                transactionQueue: this.transactionQueue,
              })
              .then(() => console.log("New block accepted", parsedMessage))
              .catch((error) =>
                console.error("New block rejected:", error.message)
              );
            break;
          case CHANNELS_MAP.TRANSACTION:
            console.log(`Received transaction: ${parsedMessage.id}`);

            this.transactionQueue.add(new Transaction(parsedMessage));

            break;
          default:
            return;
        }
      },
    });
  }

  broadcastBlock(block) {
    // console.log("pubsub");
    // console.log(this.blockchain);
    this.publish({
      channel: CHANNELS_MAP.BLOCK,
      message: JSON.stringify(block),
    });
  }

  broadcastTransaction(transaction) {
    //console.log("pubsub");
    //console.log(this.blockchain);
    this.publish({
      channel: CHANNELS_MAP.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
