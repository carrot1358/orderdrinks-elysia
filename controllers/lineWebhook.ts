import { Context } from "elysia";
import { Client, middleware, WebhookEvent } from "@line/bot-sdk";
import { sendTextMessage, sendFlexMessage } from "../utils/lineMessaging";

const config = {
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: Bun.env.LINE_CHANNEL_SECRET || "",
};

const client = new Client(config);

export const handleWebhook = async (c: Context) => {
  try {
    console.log("Received webhook payload:", c.body);

    // ตรวจสอบว่า c.body เป็น object และมี property 'events'
    if (
      typeof c.body === "object" &&
      c.body &&
      "events" in c.body &&
      Array.isArray(c.body.events)
    ) {
      const events: WebhookEvent[] = c.body.events;

      await Promise.all(
        events.map(async (event) => {
          if (event.type === "message" && event.message.type === "text") {
            const { replyToken } = event;
            const { text } = event.message;
            const userId = event.source.userId;

            console.log(
              `Received message - User ID: ${userId}, Message: ${text}`
            );

            await client.replyMessage(replyToken, {
              type: "text",
              text: `คุณส่งข้อความ: ${text}`,
            });
          }
        })
      );
    } else {
      console.log("Invalid webhook payload structure");
    }

    return { status: 200, body: "OK" };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการประมวลผล webhook:", error);
    // ส่งคืนสถานะ 200 แม้ว่าจะมีข้อผิดพลาด
    return { status: 200, body: "OK" };
  }
};

export const lineMiddleware = middleware(config);
