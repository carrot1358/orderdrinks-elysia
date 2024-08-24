import { Elysia, t } from 'elysia'
import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const productRoutes = (app: Elysia) => {
  app.group('/api/v1/products', (app) =>
    app
      .post('/', addProduct, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          name: t.String(),
          description: t.String(),
          price: t.Number(),
          stock: t.Number(),
          image: t.File(),
          isAvailable: t.Optional(t.Boolean()),
        }),
        type: 'multipart',
        detail: {
          tags: ['Product'],
          summary: 'เพิ่มสินค้าใหม่',
          description: 'เพิ่มสินค้าใหม่เข้าสู่ระบบ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .get('/', getAllProducts, {
        detail: {
          tags: ['Product'],
          summary: 'ดึงข้อมูลสินค้าทั้งหมด',
          description: 'ดึงข้อมูลสินค้าทั้งหมดในระบบ'
        }
      })
      .get('/:id', getProductById, {
        detail: {
          tags: ['Product'],
          summary: 'ดึงข้อมูลสินค้าตาม ID',
          description: 'ดึงข้อมูลสินค้าตาม ID ที่ระบุ'
        }
      })
      .put('/:id', updateProduct, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          name: t.Optional(t.String()),
          description: t.Optional(t.String()),
          price: t.Optional(t.Number()),
          stock: t.Optional(t.Number()),
          image: t.Optional(t.File()),
          isAvailable: t.Optional(t.Boolean()),
        }),
        type: 'multipart',
        detail: {
          tags: ['Product'],
          summary: 'อัปเดตข้อมูลสินค้า',
          description: 'อัปเดตข้อมูลสินค้าตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
      .delete('/:id', deleteProduct, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Product'],
          summary: 'ลบสินค้า',
          description: 'ลบสินค้าตาม ID ที่ระบุ (เฉพาะผู้ดูแลระบบ)',
          security: [{ bearerAuth: [] }]
        }
      })
  )
}

export default productRoutes as any
