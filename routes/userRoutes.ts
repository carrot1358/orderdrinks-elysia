import { Elysia, t } from "elysia";
import {
  createUser,
  deleteUser,
  getUser,
  getUserProfile,
  getUsers,
  loginUser,
  updateUser,
  confirmExistedUser,
} from "~/controllers";
import { admin, auth, driver } from "~/middlewares";

const userRoutes = (app: Elysia) => {
  app.group("/api/v1/users", (app) =>
    app

      .post("/", createUser, {
        body: t.Object({
          name: t.String(),
          phone: t.String(),
          password: t.String(),
          isAdmin: t.Optional(t.String()),
          role: t.Optional(t.String()),
          passwordConfirmExisted: t.String(),
          lat: t.Optional(t.String()),
          lng: t.Optional(t.String()),
        }),
        type: "formdata",
        detail: {
          tags: ["User"],
          summary: "สร้างผู้ใช้ใหม่",
          description: "สร้างผู้ใช้ใหม่ในระบบ",
          security: [{ bearerAuth: [] }],
        },
      })

      .post("/login", loginUser, {
        body: t.Object({
          phone: t.String(),
          password: t.String(),
        }),
        type: "formdata",
        detail: {
          tags: ["User"],
          summary: "เข้าสู่ระบบ",
          description: "เข้าสู่ระบบสำหรับผู้ใช้ที่มีอยู่แล้ว",
        },
      })

      .post("/confirm-existed-user", confirmExistedUser, {
        body: t.Object({
          phone: t.String(),
          passwordConfirmExisted: t.String(),
          lineId: t.String(),
        }),
        type: "formdata",
        detail: {
          tags: ["User"],
          summary: "ยืนยันผู้ใช้เดียวกันจากระบบอื่น",
          description: "ยืนยันผู้ใช้เดียวกันจากระบบอื่น",
        },
      })

      .get("/", getUsers, {
        beforeHandle: (c) => driver(c),
        detail: {
          tags: ["User"],
          summary: "ดึงข้อมูลผู้ใช้ทั้งหมด",
          description: "ดึงข้อมูลผู้ใช้ทั้งหมดในระบบ (เฉพาะผู้ดูแลระบบ)",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/:id", getUser, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ["User"],
          summary: "ดึงข้อมูลผู้ใช้ตาม ID",
          description: "ดึงข้อมูลผู้ใช้ตาม ID ที่ระบุ",
          security: [{ bearerAuth: [] }],
        },
      })

      .get("/profile", getUserProfile, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ["User"],
          summary: "ดึงข้อมูลโปรไฟล์ผู้ใช้",
          description: "ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ",
          security: [{ bearerAuth: [] }],
        },
      })

      .put("/:id", updateUser, {
        beforeHandle: (c) => auth(c),
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          password: t.Optional(t.String()),
          isAdmin: t.Optional(t.String()),
          role: t.Optional(
            t.Union([
              t.Literal("admin"),
              t.Literal("driver"),
              t.Literal("manager"),
              t.Literal("user"),
            ])
          ),
          phone: t.Optional(t.String()),
          address: t.Optional(t.String()),
          avatar: t.Optional(t.File()),
          lng: t.Optional(t.String()),
          lat: t.Optional(t.String()),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ["User"],
          summary: "อัปเดตข้อมูลผู้ใช้",
          description: "อัปเดตข้อมูลผู้ใช้ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)",
          security: [{ bearerAuth: [] }],
        },
      })

      .delete("/:id", deleteUser, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ["User"],
          summary: "ลบผู้ใช้",
          description: "ลบผู้ใช้ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)",
          security: [{ bearerAuth: [] }],
        },
      })
  );
};

export default userRoutes as any;
