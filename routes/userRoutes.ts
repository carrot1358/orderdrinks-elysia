import { Elysia, t } from 'elysia'
import {
  createUser,
  deleteUser,
  getUser,
  getUserProfile,
  getUsers,
  loginUser,
  updateUser,
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const userRoutes = (app: Elysia) => {
  app.group('/api/v1/users', (app) =>
    app
      .post('/', createUser, {
        body: t.Object({
          name: t.String(),
          email: t.String(),
          password: t.String(),
          isAdmin: t.Optional(t.Boolean()),
          role: t.Optional(t.String()),
        }),
        type: 'json',
        detail: {
          tags: ['User'],
          summary: 'สร้างผู้ใช้ใหม่',
          description: 'สร้างผู้ใช้ใหม่ในระบบ',
          security: [{ bearerAuth: [] }]
        }
      })
      .post('/login', loginUser, {
        body: t.Object({
          email: t.String(),
          password: t.String(),
        }),
        type: 'json',
        detail: {
          tags: ['User'],
          summary: 'เข้าสู่ระบบ',
          description: 'เข้าสู่ระบบสำหรับผู้ใช้ที่มีอยู่แล้ว'
        }
      })
      .get('/', getUsers, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['User'],
          summary: 'ดึงข้อมูลผู้ใช้ทั้งหมด',
          description: 'ดึงข้อมูลผู้ใช้ทั้งหมดในระบบ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .get('/:id', getUser, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['User'],
          summary: 'ดึงข้อมูลผู้ใช้ตาม ID',
          description: 'ดึงข้อมูลผู้ใช้ตาม ID ที่ระบุ',
          security: [{ bearerAuth: [] }]
        }
      })
      .get('/profile', getUserProfile, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['User'],
          summary: 'ดึงข้อมูลโปรไฟล์ผู้ใช้',
          description: 'ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ',
          security: [{ bearerAuth: [] }]
        }
      })
      .put('/:id', updateUser, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          password: t.Optional(t.String()),
          isAdmin: t.Optional(t.Boolean()),
          role: t.Optional(t.String()),
        }),
        detail: {
          tags: ['User'],
          summary: 'อัปเดตข้อมูลผู้ใช้',
          description: 'อัปเดตข้อมูลผู้ใช้ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .delete('/:id', deleteUser, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['User'],
          summary: 'ลบผู้ใช้',
          description: 'ลบผู้ใช้ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
  )
}

export default userRoutes as any