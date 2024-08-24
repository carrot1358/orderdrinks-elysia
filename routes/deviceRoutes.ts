import { Elysia, t } from 'elysia'
import {
  addDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const deviceRoutes = (app: Elysia) => {
  app.group('/api/v1/devices', (app) =>
    app
      .post('/', addDevice, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          deviceId: t.String(),
          deviceName: t.String(),
          status: t.Optional(t.Union([t.Literal('connected'), t.Literal('disconnected')])),
          gpsStatus: t.Optional(t.Union([t.Literal('ready'), t.Literal('not_ready')])),
        }),
        detail: {
          tags: ['Device'],
          summary: 'เพิ่มอุปกรณ์ใหม่',
          description: 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .get('/', getAllDevices, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Device'],
          summary: 'ดึงข้อมูลอุปกรณ์ทั้งหมด',
          description: 'ดึงข้อมูลอุปกรณ์ทั้งหมดในระบบ',
          security: [{ bearerAuth: [] }]
        }
      })
      .get('/:id', getDeviceById, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Device'],
          summary: 'ดึงข้อมูลอุปกรณ์ตาม ID',
          description: 'ดึงข้อมูลอุปกรณ์ตาม ID ที่ระบุ',
          security: [{ bearerAuth: [] }]
        }
      })
      .put('/:id', updateDevice, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          deviceName: t.Optional(t.String()),
          status: t.Optional(t.Union([t.Literal('connected'), t.Literal('disconnected')])),
          gpsStatus: t.Optional(t.Union([t.Literal('ready'), t.Literal('not_ready')])),
        }),
        detail: {
          tags: ['Device'],
          summary: 'อัปเดตข้อมูลอุปกรณ์',
          description: 'อัปเดตข้อมูลอุปกรณ์ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .delete('/:id', deleteDevice, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Device'],
          summary: 'ลบอุปกรณ์',
          description: 'ลบอุปกรณ์ตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
  )
}

export default deviceRoutes as any
