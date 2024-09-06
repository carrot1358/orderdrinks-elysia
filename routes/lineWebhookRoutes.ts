import { Elysia } from "elysia";
import { handleWebhook } from "~/controllers/lineWebhook";

const lineWebhookRoutes = (app: Elysia) => {
  app.post("/webhook", async ({ request }) => {
    const body = await request.json();
    return handleWebhook(body);
  });
};

export default lineWebhookRoutes as any;
