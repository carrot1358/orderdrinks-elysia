import { Elysia } from "elysia";
import { handleWebhook, lineMiddleware } from "~/controllers/lineWebhook";
import { sendTextMessage, sendFlexMessage } from "~/utils/lineMessaging";

const lineWebhookRoutes = (app: Elysia) => {
  app.post(
    "/webhook",
    async ({ request, set }) => {
      try {
        const lineCompatibleRequest = {
          headers: request.headers,
          body: await request.text(),
        };

        await lineMiddleware(
          lineCompatibleRequest as any,
          set as any,
          () => {}
        );

        return handleWebhook({ request, set } as any);
      } catch (error) {
        set.status = 400;
        return { error: (error as Error).message };
      }
    },
    {
      detail: {
        tags: ["LINE Webhook"],
        summary: "รับ webhook จาก LINE",
        description: "จัดการข้อความและเหตุการณ์จาก LINE Messaging API",
      },
    }
  );

  app.post("/send-message", async ({ body }) => {
    const { userId, message, isFlexMessage } = body as {
      userId: string;
      message: string | any;
      isFlexMessage?: boolean;
    };

    if (isFlexMessage) {
      await sendFlexMessage(userId, message);
    } else {
      await sendTextMessage(userId, message);
    }

    return { status: 200, body: "Message sent successfully" };
  });
};

export default lineWebhookRoutes as any;
