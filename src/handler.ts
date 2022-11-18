import { PublishPacket } from "packet";
import { aedesServer } from ".";
import { State } from "./state";

const enum LightOnOff {
  On = "100",
  Off = "0",
}

const option: Partial<PublishPacket> = {
  topic: State.LightBrightness,
  qos: 0,
  cmd: "publish",
  dup: false,
  retain: false,
};

export const controlLightByTemperature = (packet: PublishPacket) => {
  const temperature = Number(packet.payload.toString());
  if (temperature < 20) return turnOnLight();
  return turnOffLight();
};

const turnOnLight = () => {
  aedesServer.publish({ ...option, payload: LightOnOff.On } as PublishPacket, (err: Error) => {
    console.log("[PUBLISHED_ERROR] ", err);
  });
};

const turnOffLight = () => {
  aedesServer.publish({ ...option, payload: LightOnOff.Off } as PublishPacket, (err: Error) => {
    console.log("[PUBLISHED_ERROR] ", err);
  });
};
