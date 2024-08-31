import { Elysia } from "elysia";
import { handleWebhook, lineMiddleware } from "~/controllers/lineWebhook";

const lineWebhookRoutes = (app: Elysia) => {
  app.post("/webhook", handleWebhook, {
    beforeHandle: async ({ request, set }) => {
      const lineCompatibleRequest = {
        headers: request.headers,
        body: await request.text(),
      };
      const result = await lineMiddleware(
        lineCompatibleRequest as any,
        set as any,
        set as any
      );
      if (
        typeof result === "object" &&
        result !== null &&
        "message" in result
      ) {
        set.status = 400;
        return { error: (result as { message: string }).message };
      }
    },
    detail: {
      tags: ["LINE Webhook"],
      summary: "รับ webhook จาก LINE",
      description: "จัดการข้อความและเหตุการณ์จาก LINE Messaging API",
    },
  });
};

export default lineWebhookRoutes as any;
