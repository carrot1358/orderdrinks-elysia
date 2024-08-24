import { Elysia, t } from 'elysia'
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const orderRoutes = (app: Elysia) => {
  app.group('/api/v1/orders', (app) =>
    app
  
      .post('/', createOrder, {
        beforeHandle: (c) => auth(c),
        body: t.Object({
          userId: t.String(),
          products: t.Array(
            t.Object({
              productId: t.String(),
              quantity: t.Number(),
            })
          ),
          methodPaid: t.Union([t.Literal('cash'), t.Literal('promptpay')]),
          imageSlipPaid: t.Optional(t.File()),
        }),
        type: 'multipart',
        detail: {
          tags: ['Order'],
          summary: 'สร้างคำสั่งซื้อใหม่',
          description: 'สร้างคำสั่งซื้อใหม่ในระบบ',
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

      .put('/:id/status', updateOrderStatus, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          statusPaid: t.Union([t.Literal('paid'), t.Literal('not_paid')]),
        }),
        detail: {
          tags: ['Order'],
          summary: 'อัปเดตสถานะการชำระเงินของคำสั่งซื้อ',
          description: 'อัปเดตสถานะการชำระเงินของคำสั่งซื้อตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
  )
}

export default orderRoutes as any
