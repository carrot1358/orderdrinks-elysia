import { Elysia, t } from "elysia";
import { getPayment, updatePayment } from "~/controllers/paymentController";
import { admin, auth } from "~/middlewares";

const paymentRoutes = (app: Elysia) => {
  app.group("/api/v1/payments", (app) =>
    app
      .get("/", getPayment, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ["Payment"],
          summary: "ดึงข้อมูลการชำระเงินทั้งหมด",
          description: "ดึงข้อมูลการชำระเงินทั้งหมดในระบบ",
          security: [{ bearerAuth: [] }],
        },
      })
      .put("/", updatePayment, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          typePromtpay: t.String(),
          numberPromtpay: t.String(),
        }),
        type: "formdata",
        detail: {
          tags: ["Payment"],
          summary: "อัปเดตข้อมูลการชำระเงิน",
          description: "อัปเดตข้อมูลการชำระเงินในระบบ",
          security: [{ bearerAuth: [] }],
        },
      })
  );
};

export default paymentRoutes as any;
