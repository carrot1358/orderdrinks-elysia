import { Document, Schema, model } from 'mongoose'

interface OrderProduct {
  productId: string
  quantity: number
}

interface Order {
  orderId: string
  userId: string
  products: OrderProduct[]
  totalPrice: number
  methodPaid: 'cash' | 'promptpay'
  statusPaid: 'paid' | 'not_paid'
  imageSlipPaid?: string
  cancelOrder?: boolean
  completedOrder?: boolean
  bottle_count?: number
  time_completed?: string
  latitude?: number
  longitude?: number
  deviceId?: string
  bottle_image_path?: string
}

interface OrderDoc extends Order, Document {}

const orderSchema = new Schema<OrderDoc>(
  {
    orderId: { type: String, unique: true , default: crypto.randomUUID()},
    userId: { type: String, required: true },
    products: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    methodPaid: { type: String, enum: ['cash', 'promptpay'], required: true },
    statusPaid: { type: String, enum: ['paid', 'not_paid'], required: true, default: 'not_paid' },
    imageSlipPaid: { type: String },
    cancelOrder: { type: Boolean, default: false },
    completedOrder: { type: Boolean, default: false },
    bottle_count: { type: Number },
    time_completed: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    deviceId: { type: String, unique: true , default: crypto.randomUUID(), index: true},
    bottle_image_path: { type: String },
  },
  {
    timestamps: true,
  }
)

const Order = model<OrderDoc>('Order', orderSchema)
export default Order