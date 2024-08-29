import { Elysia } from "elysia";
import { getPayment, updatePayment } from "~/controllers/paymentController";

const paymentRoutes = (app: Elysia) => {
  app.group("/api/v1/payments", (app) =>
    app
      .get("/", getPayment, {
        detail: {
          tags: ["Payment"],
          summary: "ดึงข้อมูลการชำระเงินทั้งหมด",
          description: "ดึงข้อมูลการชำระเงินทั้งหมดในระบบ",
        },
      })
      .put("/", updatePayment, {
        detail: {
          tags: ["Payment"],
          summary: "อัปเดตข้อมูลการชำระเงิน",
          description: "อัปเดตข้อมูลการชำระเงินในระบบ",
        },
      })
  );
};

export default paymentRoutes as any;
