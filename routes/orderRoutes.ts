import { Elysia, t } from 'elysia'
import {
  createOrder,
  getOrders,
  getOrderById,
  checkSlip,
  cancelOrder,
  completeOrder
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const orderRoutes = (app: Elysia) => {
  app.group('/api/v1/orders', (app) =>
    app
      .post('/', createOrder, {
        beforeHandle: (c) => auth(c),
        body: t.Object({
          products: t.String(),
          methodPaid: t.Union([t.Literal('cash'), t.Literal('promptpay')]),
          imageSlipPaid: t.Optional(t.File()),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ['Order'],
          summary: 'สร้างคำสั่งซื้อใหม่',
          description: 'สร้างคำสั่งซื้อใหม่ในระบบ',
          security: [{ bearerAuth: [] }]
        }
      })

      .post('/check_slip', checkSlip, {
        beforeHandle: (c) => auth(c),
        body: t.Object({
          orderId: t.String(),
          slip: t.File(),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ['Order'],
          summary: 'ตรวจสอบสลิปการชำระเงิน',
          description: 'ตรวจสอบสลิปการชำระเงิน',
          security: [{ bearerAuth: [] }]
        }
      })

      .get('/', getOrders, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Order'],
          summary: 'ดึงข้อมูลคำสั่งซื้อทั้งหมด',
          description: 'ดึงข้อมูลคำสั่งซื้อทั้งหมดในระบบ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })

      .get('/:id', getOrderById, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Order'],
          summary: 'ดึงข้อมูลคำสั่งซื้อตาม ID',
          description: 'ดึงข้อมูลคำสั่งซื้อตาม ID ที่ระบุ',
          security: [{ bearerAuth: [] }]
        }
      })

      .put('/cancel/:id', cancelOrder, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Order'],
          summary: 'ยกเลิกคำสั่งซื้อ',
          description: 'ยกเลิกคำสั่งซื้อตาม ID ที่ระบุ',
          security: [{ bearerAuth: [] }]
        }
      })

      .put('/complete/:id', completeOrder, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Order'],
          summary: 'สำเร็จคำสั่งซื้อ',
          description: 'สำเร็จคำสั่งซื้อตาม ID ที่ระบุ',
          security: [{ bearerAuth: [] }]
        }
      })
  )
}

export default orderRoutes as any
