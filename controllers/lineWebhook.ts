import { Context } from "elysia";
import { Client, middleware, WebhookEvent } from "@line/bot-sdk";

const config = {
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: Bun.env.LINE_CHANNEL_SECRET || "",
};

const client = new Client(config);

export const handleWebhook = async (c: Context) => {
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
          await client.replyMessage(replyToken, {
            type: "text",
            text: `คุณส่งข้อความ: ${text}`,
          });
        }
      })
    );
  } else {
    throw new Error("Invalid webhook payload");
  }

  return { status: 200, body: "OK" };
};

export const lineMiddleware = middleware(config);
