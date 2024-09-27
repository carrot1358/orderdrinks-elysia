import { Elysia, t } from "elysia";
import {
  getDistanceNotifications,
  createDistanceNotification,
  updateDistanceNotification,
  deleteDistanceNotification,
} from "~/controllers/distanceNotificationController";
import { driver } from "~/middlewares";

const distanceNotificationRoutes = (app: Elysia) => {
  app.group("/api/v1/distance-notifications", (app) =>
    app
      .get("/distance-notifications", getDistanceNotifications, {
        beforeHandle: (c) => driver(c),
        detail: {
          tags: ["DistanceNotification"],
          summary: "ดึงข้อมูลการแจ้งเตือนระยะทางทั้งหมด",
          security: [{ bearerAuth: [] }],
        },
      })
      .post("/distance-notifications", createDistanceNotification, {
        beforeHandle: (c) => driver(c),
        body: t.Object({
          distance: t.Number(),
        }),
        detail: {
          tags: ["DistanceNotification"],
          summary: "สร้างการแจ้งเตือนระยะทางใหม่",
          security: [{ bearerAuth: [] }],
        },
      })
      .put("/distance-notifications/:id", updateDistanceNotification, {
        beforeHandle: (c) => driver(c),
        body: t.Object({
          distance: t.Number(),
        }),
        detail: {
          tags: ["DistanceNotification"],
          summary: "อัปเดตการแจ้งเตือนระยะทาง",
          security: [{ bearerAuth: [] }],
        },
      })
      .delete("/distance-notifications/:id", deleteDistanceNotification, {
        beforeHandle: (c) => driver(c),
        detail: {
          tags: ["DistanceNotification"],
          summary: "ลบการแจ้งเตือนระยะทาง",
          security: [{ bearerAuth: [] }],
        },
      })
  );

  return app;
};

export default distanceNotificationRoutes;
