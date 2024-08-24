import { Context } from 'elysia'
import { Product } from '~/models'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export const addProduct = async (c: Context) => {
  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const { name, description, price, stock, image, isAvailable } = c.body as any

  if (!image) {
    c.set.status = 400
    throw new Error('กรุณาอัปโหลดรูปภาพสินค้า')
  }

  // บันทึกรูปภาพ
  const imageName = `${Date.now()}-${image.name}`
  const imagePath = join(process.cwd(), 'image', 'product', imageName)
  await writeFile(imagePath, await image.arrayBuffer())

  const product = await Product.create({
    name,
    description,
    price,
    stock,
    imagePath: `/image/product/${imageName}`,
    isAvailable,
  })

  if (!product) {
    c.set.status = 400
    throw new Error('ข้อมูลสินค้าไม่ถูกต้อง')
  }

  c.set.status = 201
  return {
    status: c.set.status,
    success: true,
    data: product,
    message: 'เพิ่มสินค้าสำเร็จ',
  }
}

export const getAllProducts = async (c: Context) => {
  const products = await Product.find()

  if (!products || products.length === 0) {
    c.set.status = 404
    throw new Error('ไม่พบสินค้า')
  }

  return {
    status: c.set.status,
    success: true,
    data: products,
    message: 'ดึงข้อมูลสินค้าทั้งหมดสำเร็จ',
  }
}

export const getProductById = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID สินค้า')
  }

  const product = await Product.findById(c.params.id)

  if (!product) {
    c.set.status = 404
    throw new Error('ไม่พบสินค้า')
  }

  return {
    status: c.set.status,
    success: true,
    data: product,
    message: 'ดึงข้อมูลสินค้าสำเร็จ',
  }
}

export const updateProduct = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID สินค้า')
  }

  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const product = await Product.findByIdAndUpdate(c.params.id, c.body, { new: true })

  if (!product) {
    c.set.status = 404
    throw new Error('ไม่พบสินค้า')
  }

  return {
    status: c.set.status,
    success: true,
    data: product,
    message: 'อัปเดตสินค้าสำเร็จ',
  }
}

export const deleteProduct = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID สินค้า')
  }

  const product = await Product.findByIdAndDelete(c.params.id)

  if (!product) {
    c.set.status = 404
    throw new Error('ไม่พบสินค้า')
  }

  return {
    status: c.set.status,
    success: true,
    data: {},
    message: 'ลบสินค้าสำเร็จ',
  }
}