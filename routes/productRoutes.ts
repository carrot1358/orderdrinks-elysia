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
          tags: ['Product']
        }
      })
      .get('/', getAllProducts, {
        detail: {
          tags: ['Product']
        }
      })
      .get('/:id', getProductById, {
        detail: {
          tags: ['Product']
        }
      })
      .put('/:id', updateProduct, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Product']
        }
      })
      .delete('/:id', deleteProduct, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Product']
        }
      })
  )
}

export default productRoutes as any
