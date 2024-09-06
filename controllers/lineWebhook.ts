import { WebhookEvent, Client, middleware } from "@line/bot-sdk";

const config = {
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: Bun.env.LINE_CHANNEL_SECRET || "",
};

const client = new Client(config);

export const handleWebhook = async (body: any) => {
  try {
    console.log("Received webhook payload:", body);

    if (body && "events" in body && Array.isArray(body.events)) {
      const events: WebhookEvent[] = body.events;

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
    return { status: 200, body: "OK" };
  }
};

export const lineMiddleware = middleware(config);
