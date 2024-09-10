import { Elysia, t } from "elysia";
import { Device, Order, User } from "~/models";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { sendLineNotification } from "~/utils/lineNotification";
import { handleDeviceMessage } from "~/controllers/deviceMessageController";
import { handleFrontendMessage } from "~/controllers/frontendMessageController";

// WebSocket connections
const frontendConnections = new Map();
const deviceConnections = new Map();

export const getDeviceConnections = () => deviceConnections;

export function setupWebSocket(app: Elysia) {
  // WebSocket for frontend
  app.ws("/ws/frontend/:userid", {
    open(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.set(userid, ws);
      console.log(`Frontend connection opened for user: ${userid}`);
    },
    message(ws, message) {
      const userid = ws.data.params.userid;
      handleFrontendMessage(userid, message);
    },
    close(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.delete(userid);
      console.log(`Frontend connection closed for user: ${userid}`);
    },
  });

  // WebSocket for devices
  app.ws("/ws/device/:deviceid", {
    open(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.set(deviceid, ws);
      console.log(`Device connection opened for device: ${deviceid}`);
    },
    message(ws, message) {
      const deviceid = ws.data.params.deviceid;
      handleDeviceMessage(deviceid, message);
    },
    close(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.delete(deviceid);
      console.log(`Device connection closed for device: ${deviceid}`);
    },
  });

  return app;
}

// ย้ายฟังก์ชัน sendMessage มาไว้นอก setupWebSocket
export function sendMessage(target: "frontend" | "device", message: string) {
  const connections =
    target === "frontend" ? frontendConnections : deviceConnections;
  connections.forEach((ws) => {
    ws.send(JSON.stringify({ message }));
  });
}
