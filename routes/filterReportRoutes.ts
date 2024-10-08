import { Elysia, t } from "elysia";
import {
  addFilterRefill,
  getFilterRefills,
  deleteFilterRefill,
} from "~/controllers/filterRefillController";
import {
  addFilterChange,
  getFilterChanges,
  deleteFilterChange,
} from "~/controllers/filterChangeController";
import {
  addFilterCleaning,
  getFilterCleanings,
  deleteFilterCleaning,
} from "~/controllers/filterCleaningController";
import { admin, auth } from "~/middlewares";

const filterReportRoutes = (app: Elysia) => {
  app.group("/api/v1/filter-reports", (app) =>
    app
      .post("/refill", addFilterRefill, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          iodine: t.Optional(t.String()),
          carbon: t.Optional(t.String()),
          resin: t.Optional(t.String()),
          manganese: t.Optional(t.String()),
          sodaAsh: t.Optional(t.String()),
          other: t.Optional(t.String()),
          date: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Filter Report"],
          summary: "บันทึกการเติมสารกรอง",
          description: "บันทึกข้อมูลการเติมสารกรองน้ำ",
          security: [{ bearerAuth: [] }],
        },
      })
      .get("/refill", getFilterRefills, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ดึงข้อมูลการเติมสารกรอง",
          description: "ดึงข้อมูลการเติมสารกรองน้ำทั้งหมด",
          security: [{ bearerAuth: [] }],
        },
      })
      .delete("/refill/:id", deleteFilterRefill, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ลบข้อมูลการเติมสารกรอง",
          description: "ลบข้อมูลการเติมสารกรองน้ำตามไอดี",
          security: [{ bearerAuth: [] }],
        },
      })
      .post("/change", addFilterChange, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          smallFilter: t.String(),
          membraneFilter: t.String(),
          other: t.Optional(t.String()),
          date: t.String(),
        }),
        detail: {
          tags: ["Filter Report"],
          summary: "บันทึกการเปลี่ยนไส้กรอง",
          description: "บันทึกข้อมูลการเปลี่ยนไส้กรองน้ำ",
          security: [{ bearerAuth: [] }],
        },
      })
      .get("/change", getFilterChanges, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ดึงข้อมูลการเปลี่ยนไส้กรอง",
          description: "ดึงข้อมูลการเปลี่ยนไส้กรองน้ำทั้งหมด",
          security: [{ bearerAuth: [] }],
        },
      })
      .delete("/change/:id", deleteFilterChange, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ลบข้อมูลการเปลี่ยนไส้กรอง",
          description: "ลบข้อมูลการเปลี่ยนไส้กรองน้ำตามไอดี",
          security: [{ bearerAuth: [] }],
        },
      })
      .post("/cleaning", addFilterCleaning, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          cleaned: t.String(),
          date: t.String(),
        }),
        detail: {
          tags: ["Filter Report"],
          summary: "บันทึกการทำความสะอาดเครื่องกรอง",
          description: "บันทึกข้อมูลการทำความสะอาดเครื่องกรองน้ำ",
          security: [{ bearerAuth: [] }],
        },
      })
      .get("/cleaning", getFilterCleanings, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ดึงข้อมูลการทำความสะอาดเครื่องกรอง",
          description: "ดึงข้อมูลการทำความสะอาดเครื่องกรองน้ำทั้งหมด",
          security: [{ bearerAuth: [] }],
        },
      })
      .delete("/cleaning/:id", deleteFilterCleaning, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["Filter Report"],
          summary: "ลบข้อมูลการทำความสะอาดเครื่องกรอง",
          description: "ลบข้อมูลการทำความสะอาดเครื่องกรองน้ำตามไอดี",
          security: [{ bearerAuth: [] }],
        },
      })
  );

  return app;
};

export default filterReportRoutes as any;
