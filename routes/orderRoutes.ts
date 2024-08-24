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
          tags: ['Order']
        }
      })
      .get('/', getOrders, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Order']
        }
      })
      .get('/:id', getOrderById, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Order']
        }
      })
      .put('/:id/status', updateOrderStatus, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          statusPaid: t.Union([t.Literal('paid'), t.Literal('not_paid')]),
        }),
        detail: {
          tags: ['Order']
        }
      })
  )
}

export default orderRoutes as any
