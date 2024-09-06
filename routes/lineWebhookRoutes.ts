import { Elysia } from "elysia";
import { handleWebhook, lineMiddleware } from "~/controllers/lineWebhook";

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
};

export default lineWebhookRoutes as any;
