import aedes, { AuthErrorCode } from "aedes";
import server from "net";
import { Command } from "./command";
import { controlLightByTemperature } from "./handler";
import { State } from "./state";

const port = process.env.PORT || 1883;
const userNameEnv = "hoanglong";
const passwordEnv = "123";

export const aedesServer = new aedes();

const initServer = server.createServer(aedesServer.handle as any);

const listTopics = [
  Command.LightBrightness,
  Command.LightColor,
  Command.Temperature,

  State.LightBrightness,
  State.LightColor,
  State.Temperature,
] as string[];

initServer.listen(port, function () {
  console.log(`MQTT Broker running on port: ${port}`);
});

// authenticate the connecting client
aedesServer.authenticate = (client, username, password, callback) => {
  const passwordParsed = Buffer.from(password as any, "base64").toString();
  if (username === userNameEnv && passwordParsed === passwordEnv) {
    return callback(null, true);
  }
  const error = new Error("Authentication Failed!! Invalid user credentials.");
  console.log("Error!!! Authentication failed.");
  return callback({ ...error, returnCode: AuthErrorCode.NOT_AUTHORIZED }, false);
};

// authorizing client to publish on a message topic
aedesServer.authorizePublish = (client, packet, callback) => {
  console.log(packet.topic + "\t" + listTopics.includes(packet.topic));
  if (listTopics.includes(packet.topic)) {
    return callback(null);
  }
  console.log("Error!!! Unauthorized publish to a topic.");
  return callback(new Error("You are not authorized to publish on this message topic."));
};

// emitted when a client connects to the broker
aedesServer.on("client", (client) => {
  console.log(`[CLIENT_CONNECTED] ${client ? client.id : client} connected`);
});

// emitted when a client disconnects from the broker
aedesServer.on("clientDisconnect", (client) => {
  console.log(`[CLIENT_DISCONNECTED] ${client ? client.id : client} disconnected`);
});

// emitted when a client subscribes to a message topic
aedesServer.on("subscribe", (subscriptions, client) => {
  console.log(
    `[TOPIC_SUBSCRIBED] ${client ? client.id : client} subscribed to topics: ${subscriptions
      .map((s) => s.topic)
      .join(",")} `,
  );
});

// emitted when a client unsubscribes from a message topic
aedesServer.on("unsubscribe", (subscriptions, client) => {
  console.log(
    `[TOPIC_UNSUBSCRIBED] ${client ? client.id : client} unsubscribed to topics: ${subscriptions.join(",")} `,
  );
});

// emitted when a client publishes a message packet on the topic
aedesServer.on("publish", (packet, client) => {
  if (client) {
    console.log(
      `[MESSAGE_PUBLISHED] ${client ? client.id : "BROKER_" + aedesServer.id} has published message on ${
        packet.topic
      } with payload:\n ${packet.payload.toString()}`,
    );

    switch (packet.topic) {
      case Command.Temperature:
        controlLightByTemperature(packet);
        break;
      default:
        break;
    }
  }
});
