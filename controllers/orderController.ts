import { Context } from 'elysia'
import { Order, Product, User } from '~/models'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * @api [POST] /api/v1/orders
 * @description สร้างคำสั่งซื้อใหม่
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const createOrder = async (c: Context) => {
  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const { userId, products, methodPaid, imageSlipPaid } = c.body as any

  // ตรวจสอบว่า user มีอยู่จริง
  const user = await User.findById(userId)
  if (!user) {
    c.set.status = 404
    throw new Error('ไม่พบผู้ใช้')
  }

  // คำนวณราคารวม
  let totalPrice = 0
  for (const item of products) {
    const product = await Product.findById(item.productId)
    if (!product) {
      c.set.status = 404
      throw new Error(`ไม่พบสินค้า ID: ${item.productId}`)
    }
    totalPrice += product.price * item.quantity
  }

  let slipPath = ''
  if (methodPaid === 'promptpay' && imageSlipPaid) {
    // บันทึกรูปภาพสลิป
    const slipName = `${Date.now()}-${imageSlipPaid.name}`
    slipPath = join(process.cwd(), 'image', 'slips', slipName)
    await writeFile(slipPath, await imageSlipPaid.arrayBuffer())
  }

  const order = await Order.create({
    userId,
    products,
    totalPrice,
    methodPaid,
    statusPaid: methodPaid === 'cash' ? 'not_paid' : 'paid',
    imageSlipPaid: slipPath ? `/image/slips/${slipPath.split('\\').pop()}` : undefined,
  })

  if (!order) {
    c.set.status = 400
    throw new Error('ไม่สามารถสร้างคำสั่งซื้อได้')
  }

  c.set.status = 201
  return {
    status: c.set.status,
    success: true,
    data: order,
    message: 'สร้างคำสั่งซื้อสำเร็จ',
  }
}

/**
 * @api [GET] /api/v1/orders
 * @description ดึงข้อมูลคำสั่งซื้อทั้งหมด
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const getOrders = async (c: Context) => {
  const orders = await Order.find().populate('userId', 'name email')

  if (!orders || orders.length === 0) {
    c.set.status = 404
    throw new Error('ไม่พบคำสั่งซื้อ')
  }

  return {
    status: c.set.status,
    success: true,
    data: orders,
    message: 'ดึงข้อมูลคำสั่งซื้อทั้งหมดสำเร็จ',
  }
}

/**
 * @api [GET] /api/v1/orders/:id
 * @description ดึงข้อมูลคำสั่งซื้อตาม ID
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getOrderById = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID คำสั่งซื้อ')
  }

  const order = await Order.findById(c.params.id).populate('userId', 'name email')

  if (!order) {
    c.set.status = 404
    throw new Error('ไม่พบคำสั่งซื้อ')
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: 'ดึงข้อมูลคำสั่งซื้อสำเร็จ',
  }
}

/**
 * @api [PUT] /api/v1/orders/:id/status
 * @description อัปเดตสถานะการชำระเงินของคำสั่งซื้อ
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const updateOrderStatus = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID คำสั่งซื้อ')
  }

  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const { statusPaid } = c.body as any

  const order = await Order.findByIdAndUpdate(
    c.params.id,
    { statusPaid },
    { new: true }
  )

  if (!order) {
    c.set.status = 404
    throw new Error('ไม่พบคำสั่งซื้อ')
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: 'อัปเดตสถานะการชำระเงินสำเร็จ',
  }
}

/**
 * @api [PUT] /api/v1/orders/:id/cancel
 * @description ยกเลิกคำสั่งซื้อ
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const cancelOrder = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID คำสั่งซื้อ')
  }

  const order = await Order.findByIdAndUpdate(c.params.id, { cancelOrder: true }, { new: true })

  if (!order) {
    c.set.status = 404
    throw new Error('ไม่พบคำสั่งซื้อ')
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: 'ยกเลิกคำสั่งซื้อสำเร็จ',
  }
}

/**
 * @api [PUT] /api/v1/orders/:id/complete
 * @description สำเร็จคำสั่งซื้อ
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const completeOrder = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID คำสั่งซื้อ')
  }

  const order = await Order.findByIdAndUpdate(c.params.id, { completedOrder: true }, { new: true })

  if (!order) {
    c.set.status = 404
    throw new Error('ไม่พบคำสั่งซื้อ')
  }else{
    c.set.status = 200
    return {
      status: c.set.status,
      success: true,
      data: order,
      message: 'สำเร็จ',
    }
  }
}