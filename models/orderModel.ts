import { Document, Schema, model } from 'mongoose'

interface OrderProduct {
  productId: Schema.Types.ObjectId
  quantity: number
}

interface Order {
  orderId: string
  userId: Schema.Types.ObjectId
  products: OrderProduct[]
  totalPrice: number
  methodPaid: 'cash' | 'promptpay'
  statusPaid: 'paid' | 'not_paid'
  imageSlipPaid?: string
  cancelOrder?: boolean
  completedOrder?: boolean
}

interface OrderDoc extends Order, Document {}

const orderSchema = new Schema<OrderDoc>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    methodPaid: { type: String, enum: ['cash', 'promptpay'], required: true },
    statusPaid: { type: String, enum: ['paid', 'not_paid'], required: true, default: 'not_paid' },
    imageSlipPaid: { type: String },
    cancelOrder: { type: Boolean, default: false },
    completedOrder: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// สร้าง orderId แบบสุ่ม
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    this.orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  }
  next()
})

const Order = model<OrderDoc>('Order', orderSchema)
export default Order
