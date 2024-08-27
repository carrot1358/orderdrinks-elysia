import { Context } from "elysia";
import { Product } from "~/models";
import { writeFile, mkdir, unlink } from "fs/promises"; // เพิ่มการนำเข้า unlink
import { join } from "path";
import crypto from "crypto"; // เพิ่มการนำเข้า crypto

/**
 * @api [POST] /api/v1/products
 * @description เพิ่มสินค้าใหม่
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const addProduct = async (c: Context) => {
  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { name, description, price, stock, image, isAvailable } = c.body as {
    name: string;
    description: string;
    price: number;
    stock: number;
    image: any;
    isAvailable: boolean;
  };

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!name || !description || !price || !stock || !image) {
    c.set.status = 400;
    throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
  }

  //เช็คว่ามีสินค้าชื่นี้อยู่หรือไม่
  const existingProduct = await Product.findOne({ name });
  if (existingProduct) {
    c.set.status = 400;
    throw new Error("สินค้าชื่นี้มีอยู่แล้ว");
  }

  // แปลงข้อมูลเป็นตัวเลข
  const numericPrice = Number(price);
  const numericStock = Number(stock);

  // ตรวจสอบความถูกต้องของข้อมูล
  if (isNaN(numericPrice) || isNaN(numericStock)) {
    c.set.status = 400;
    throw new Error("ราคาและจำนวนสินค้าต้องเป็นตัวเลข");
  }

  // สุ่มสร้าง productId
  const productId = crypto.randomUUID();

  // สร้างไดเรกทอรีสำหรับเก็บรูปภาพ (ถ้ายังไม่มี)
  const uploadDir = join(process.cwd(), "image", "product");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      console.error("ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพได้:", error);
      c.set.status = 500;
      throw new Error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    }
  }

  // บันทึกรูปภาพ
  const imageName = `${productId}.jpg`;
  const imagePath = join(uploadDir, imageName);
  try {
    await writeFile(imagePath, Buffer.from(await image.arrayBuffer())); // แก้ไขการแปลง arrayBuffer เป็น Buffer
  } catch (error: any) {
    console.error("ไม่สามารถบันทึกรูปภาพได้:", error);
    c.set.status = 500;
    throw new Error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
  }

  const product = await Product.create({
    productId,
    name,
    description,
    price: numericPrice,
    stock: numericStock,
    imagePath: `/image/product/${imageName}`,
    isAvailable: stock > 0 || stock == -1 ? true : false,
  });

  if (!product) {
    c.set.status = 400;
    throw new Error("ข้อมูลสินค้าไม่ถูกต้อง");
  }

  c.set.status = 201;
  return {
    status: c.set.status,
    success: true,
    data: product,
    message: "เพิ่มสินค้าสำเร็จ",
  };
};

/**
 * @api [GET] /api/v1/products
 * @description ดึงข้อมูลสินค้าทั้งหมด
 * @action สาธารณะ
 */
export const getAllProducts = async (c: Context) => {
  const products = await Product.find();

  if (!products || products.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบสินค้า");
  }

  return {
    status: c.set.status,
    success: true,
    data: products,
    message: "ดึงข้อมูลสินค้าทั้งหมดสำเร็จ",
  };
};

/**
 * @api [GET] /api/v1/products/:id
 * @description ดึงข้อมูลสินค้าตาม ID
 * @action สาธารณะ
 */
export const getProductById = async (
  c: Context<{ params: { id: string } }>
) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID สินค้า");
  }

  const product = await Product.findOne({ productId: c.params.id });

  if (!product) {
    c.set.status = 404;
    throw new Error("ไม่พบสินค้า");
  }

  return {
    status: c.set.status,
    success: true,
    data: product,
    message: "ดึงข้อมูลสินค้าสำเร็จ",
  };
};

/**
 * @api [PUT] /api/v1/products/:id
 * @description อัปเดตข้อมูลสินค้า
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const updateProduct = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID สินค้า");
  }

  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { name, description, price, stock, image, isAvailable } = c.body as any;

  // เช็คว่ามีสินค้าชื่นี้อยู่หรือไม่
  const existingProduct = await Product.findOne({ name });
  if (existingProduct) {
    if (existingProduct.productId !== c.params.id) {
      c.set.status = 400;
      throw new Error("สินค้าชื่นี้มีอยู่แล้ว");
    }
  }

  const product = await Product.findOneAndUpdate(
    { productId: c.params.id },
    c.body,
    { new: true }
  );

  if (!product) {
    c.set.status = 404;
    throw new Error("ไม่พบสินค้า");
  }

  // อัปเดตรูปภาพ
  if (image) {
    const uploadDir = join(process.cwd(), "image", "product"); // เพิ่มการประกาศ uploadDir
    const imageName = `${product.productId}.jpg`;
    const imagePath = join(uploadDir, imageName);
    await writeFile(imagePath, await image.arrayBuffer());
  }

  return {
    status: c.set.status,
    success: true,
    data: product,
    message: "อัปเดตสินค้าสำเร็จ",
  };
};
/**
 * @api [DELETE] /api/v1/products/:id
 * @description ลบสินค้า
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const deleteProduct = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID สินค้า");
  }

  const product = await Product.findOneAndDelete({ productId: c.params.id }); // แก้ไขการลบสินค้า

  if (!product) {
    c.set.status = 404;
    throw new Error("ไม่พบสินค้า");
  }

  // ลบรูปภาพ
  const imagePath = join(
    process.cwd(),
    "image",
    "product",
    `${c.params.id}.jpg`
  );
  await unlink(imagePath);

  return {
    status: c.set.status,
    success: true,
    data: {},
    message: "ลบสินค้าสำเร็จ",
  };
};
