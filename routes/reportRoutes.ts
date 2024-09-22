import { Elysia, t } from "elysia";
import {
  generatePDFReport_Refill,
  generatePDFReport_Change,
  generatePDFReport_Cleaning,
  getSalesStats,
  getUserStats,
  getFilterStats,
  getOrderStats,
  getRevenueStats,
} from "~/controllers/reportController";
import { admin, auth } from "~/middlewares";

const reportRoutes = (app: Elysia) => {
  app.group("/api/v1/reports", (app) =>
    app

      .get("/generate-pdf-refill", generatePDFReport_Refill, {
        detail: {
          tags: ["Report"],
          summary: "สร้างรายงาน PDF",
          description: "สร้างรายงาน PDF สำหรับการบำรุงรักษาเครื่องกรองน้ำ",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/generate-pdf-change", generatePDFReport_Change, {
        detail: {
          tags: ["Report"],
          summary: "สร้างรายงาน PDF",
          description: "สร้างรายงาน PDF สำหรับการเปลี่ยนไส้กรอง",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/generate-pdf-cleaning", generatePDFReport_Cleaning, {
        detail: {
          tags: ["Report"],
          summary: "สร้างรายงาน PDF",
          description: "สร้างรายงาน PDF สำหรับการล้างไส้กรอง",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/sales-stats", getSalesStats, {
        beforeHandle: (c) => admin(c),
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Dashboard"],
          summary: "ดึงสถิติยอดขาย",
          description: "ดึงสถิติยอดขายรายปี รายเดือน และรายวัน",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/user-stats", getUserStats, {
        beforeHandle: (c) => admin(c),
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Dashboard"],
          summary: "ดึงสถิติผู้ใช้",
          description: "ดึงสถิติการเพิ่มและลดของผู้ใช้",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/filter-stats", getFilterStats, {
        beforeHandle: (c) => admin(c),
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Dashboard"],
          summary: "ดึงสถิติการเปลี่ยนไส้กรอง",
          description: "ดึงสถิติการเปลี่ยนสารกรองและไส้กรอง",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/order-stats", getOrderStats, {
        beforeHandle: (c) => admin(c),
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Dashboard"],
          summary: "ดึงสถิติคำสั่งซื้อ",
          description: "ดึงสถิติจำนวนคำสั่งซื้อและสถานะ",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/revenue-stats", getRevenueStats, {
        beforeHandle: (c) => admin(c),
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Dashboard"],
          summary: "ดึงสถิติรายได้",
          description: "ดึงสถิติรายได้รายวัน รายเดือน และรายปี",
          security: [{ bearerAuth: [] }],
        },
      })
  );
};

export default reportRoutes as any;
