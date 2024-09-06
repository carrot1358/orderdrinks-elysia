import { Context } from "elysia";
import { Client, middleware, WebhookEvent, TextMessage } from "@line/bot-sdk";
import { sendTextMessage, sendFlexMessage } from "../utils/lineMessaging";

const config = {
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: Bun.env.LINE_CHANNEL_SECRET || "",
};

const client = new Client(config);

export const handleWebhook = async (c: Context) => {
  try {
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
            const { text } = event.message;
            const userId = event.source.userId as string;

            console.log(
              `Received message - User ID: ${userId}, Message: ${text}`
            );

            // ตัวอย่างการใช้ sendTextMessage
            await sendTextMessage(userId, `คุณส่งข้อความ: ${text}`);

            // ตัวอย่างการใช้ sendFlexMessage
            if (text.toLowerCase() === "flex") {
              const flexContent = {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "นี่คือ Flex Message",
                      weight: "bold",
                      size: "xl",
                    },
                  ],
                },
              };
              await sendFlexMessage(userId, flexContent);
            }
          }
        })
      );
    } else {
      throw new Error("Invalid webhook payload");
    }

    return { status: 200, body: "OK" };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการประมวลผล webhook:", error);
    // ส่งคืนสถานะ 200 แม้ว่าจะมีข้อผิดพลาด
    return { status: 200, body: "OK" };
  }
};

export const lineMiddleware = middleware(config);
