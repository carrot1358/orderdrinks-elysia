import { Context } from 'elysia'
import { Product } from '~/models'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * @api [POST] /api/v1/products
 * @description เพิ่มสินค้าใหม่
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const addProduct = async (c: Context) => {
  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const { name, description, price, stock, image, isAvailable } = c.body as any

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!name || !description || !price || !stock || !image) {
    c.set.status = 400
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน')
  }

  // แปลงข้อมูลเป็นตัวเลข
  const numericPrice = Number(price)
  const numericStock = Number(stock)

  // ตรวจสอบความถูกต้องของข้อมูล
  if (isNaN(numericPrice) || isNaN(numericStock)) {
    c.set.status = 400
    throw new Error('ราคาและจำนวนสินค้าต้องเป็นตัวเลข')
  }

  // สร้างไดเรกทอรีสำหรับเก็บรูปภาพ (ถ้ายังไม่มี)
  const uploadDir = join(process.cwd(), 'image', 'product')
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (error : any) {
    if (error.code !== 'EEXIST') {
      console.error('ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพได้:', error)
      c.set.status = 500
      throw new Error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    }
  }

  // บันทึกรูปภาพ
  const imageName = `${Date.now()}-${image.name}`
  const imagePath = join(uploadDir, imageName)
  try {
    await writeFile(imagePath, await image.arrayBuffer())
  } catch (error : any) {
    console.error('ไม่สามารถบันทึกรูปภาพได้:', error)
    c.set.status = 500
    throw new Error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
  }

  const product = await Product.create({
    name,
    description,
    price: numericPrice,
    stock: numericStock,
    imagePath: `/image/product/${imageName}`,
    isAvailable: isAvailable === 'true',
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

/**
 * @api [GET] /api/v1/products
 * @description ดึงข้อมูลสินค้าทั้งหมด
 * @action สาธารณะ
 */
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

/**
 * @api [GET] /api/v1/products/:id
 * @description ดึงข้อมูลสินค้าตาม ID
 * @action สาธารณะ
 */
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

/**
 * @api [PUT] /api/v1/products/:id
 * @description อัปเดตข้อมูลสินค้า
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
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

/**
 * @api [DELETE] /api/v1/products/:id
 * @description ลบสินค้า
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
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