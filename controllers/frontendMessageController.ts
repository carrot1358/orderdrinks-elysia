import { getDeviceConnections } from "~/utils/websocket";

export function handleFrontendMessage(userid: string, message: unknown) {
  console.log(`Frontend message from user ${userid}:`, message);

  if (typeof message === "object" && message !== null) {
    try {
      const data = message as Record<string, unknown>;
      if (data.sendto === "device" && typeof data.body === "object") {
        const deviceConnections = getDeviceConnections();
        deviceConnections.forEach((deviceWs) => {
          deviceWs.send(JSON.stringify(message));
        });
        console.log(`ส่งข้อความไปยังอุปกรณ์ทั้งหมด:`, message);
      }
    } catch (error) {
      console.error("Error handling frontend message:", error);
    }
  }
}
