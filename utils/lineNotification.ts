import { Client } from "@line/bot-sdk";

// ยังไม่ทดสอบ
const client = new Client({
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export async function sendLineNotification(lineId: string, message: string) {
  try {
    await client.pushMessage(lineId, { type: "text", text: message });
    console.log(`ส่งการแจ้งเตือนไปยัง LINE ID: ${lineId} สำเร็จ`);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งการแจ้งเตือน LINE:", error);
  }
}
