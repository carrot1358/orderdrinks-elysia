import { Context } from "elysia";
import { Order, Product, User } from "~/models";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { jwt, getUserIdFromToken } from "~/utils";
import axios from "axios"; // เพิ่มการนำเข้า axios
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { getDeviceConnections } from "~/utils/websocket";

interface Order_Interface {
  userId: {
    userId: string;
  };
}

/**
 * @api [POST] /api/v1/orders
 * @description สร้างคำสั่งซื้อใหม่
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const createOrder = async (c: Context) => {
  const userId = await getUserIdFromToken(c.headers.authorization || "");

  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { products: productsString, methodPaid } = c.body as any;

  // แปลง products จาก JSON string เป็น array ของ objects
  let products;
  try {
    products = JSON.parse(productsString);
    if (!Array.isArray(products)) {
      throw new Error("products ต้องเป็น array");
    }
  } catch (error) {
    c.set.status = 400;
    console.log(productsString);
    console.log(error);
    return { error: "เกิดข้อผิดพลาดในการแปลงข้อมูล" };
  }

  // ตรวจสอบความถูกต้องของ products
  if (
    !products.every(
      (product) =>
        typeof product.productId === "string" &&
        typeof product.quantity === "number" &&
        product.quantity > 0
    )
  ) {
    c.set.status = 400;
    return { error: "ข้อมูลสินค้าไม่ถูกต้อง" };
  }

  // ตรวจสอบว่า user มีอยู่จริง
  const user = await User.findOne({ userId: userId });
  if (!user) {
    c.set.status = 404;
    throw new Error("ไม่พบผู้ใช้ ID: " + userId);
  }

  // คำนวณราคารวม
  let totalPrice = 0;
  for (const item of products) {
    const product = await Product.findOne({ productId: item.productId });
    if (!product) {
      c.set.status = 404;
      throw new Error(`ไม่พบสินค้า ID: ${item.productId}`);
    }
    totalPrice += product.price * item.quantity;
  }

  const order = await Order.create({
    orderId: crypto.randomUUID(),
    userId,
    products,
    totalPrice,
    methodPaid,
    statusPaid: methodPaid === "cash" ? "not_paid" : "wait_paid",
    deliverStatus: "pending",
  });

  if (!order) {
    c.set.status = 400;
    throw new Error("ไม่สามารถสร้างคำสั่งซื้อได้");
  }

  c.set.status = 201;
  return {
    status: c.set.status,
    success: true,
    data: order,
    message: "สร้างคำสั่งซื้อสำเร็จ",
  };
};

/**
 * @api [POST] /api/v1/orders/check_slip
 * @description ตรวจสอบสลิปการชำระเงิน
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const checkSlip = async (c: Context) => {
  const userId = await getUserIdFromToken(c.headers.authorization || "");
  const { orderId, slip } = c.body as any;

  const order = await Order.findOne({ orderId, userId });
  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  order.statusPaid = "check_paid";
  await order.save();

  // จัดการกับไฟล์ slip
  if (slip && typeof slip === "object" && "size" in slip) {
    const fileUpload = slip as FileUpload;
    const uploadDir = join(process.cwd(), "image", "slips");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        console.error("ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บ slip ได้:", error);
        throw new Error("เกิดข้อผิดพลาดในการอัปโหลด slip");
      }
    }

    const fileExtension = fileUpload.name.split(".").pop();
    const fileName = `${orderId}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    try {
      const buffer = Buffer.from(await fileUpload.arrayBuffer());
      await writeFile(filePath, buffer);
      order.slipImage = `/image/slips/${fileName}`;

      // สร้าง FormData หลังจากที่บันทึกไฟล์เรียบร้อยแล้ว
      const formData = new FormData();
      formData.append("files", fs.createReadStream(filePath));
      formData.append("log", "true");
      formData.append("amount", order.totalPrice.toString());

      // ส่งข้อมูลสลิปไปเช็คใน SlipOk
      try {
        const SlipOk_res = await axios.post(
          `https://api.slipok.com/api/line/apikey/${Bun.env.BRANCH_ID}`,
          formData,
          {
            headers: {
              "x-authorization": Bun.env.API_KEY,
              ...formData.getHeaders(),
            },
          }
        );

        if (SlipOk_res.data.success) {
          order.statusPaid = "paid";
          const order_save = await order.save();
          return {
            status: 200,
            success: true,
            data: order_save,
            message: "ตรวจสอบสลิปสำเร็จ",
          };
        } else {
          order.statusPaid = "error";
          await order.save();
          return {
            status: 400,
            success: false,
            data: SlipOk_res.data,
            message: "การตรวจสอบสลิปล้มเหลว",
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          order.statusPaid = "error";
          await order.save();
          let data_SlipOk = error.response?.data;

          console.error("error response", data_SlipOk);

          if (data_SlipOk?.code === 1012) {
            return {
              status: 400,
              success: false,
              data: data_SlipOk,
              message: "สลิปซ้ำกัน",
            };
          } else {
            return {
              status: 500,
              success: false,
              data: data_SlipOk,
              message: data_SlipOk?.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป",
            };
          }
        }
        throw error; // โยนข้อผิดพลาดที่ไม่ใช่ AxiosError
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการอัปโหลด slip:", error);
      throw new Error("เกิดข้อผิดพลาดในการอัปโหลด slip");
    }
  } else {
    // กรณีไม่มีการอัปโหลดไฟล์ slip
    return {
      status: 400,
      success: false,
      message: "ไม่พบไฟล์สลิป",
    };
  }
};

/**
 * @api [GET] /api/v1/orders
 * @description ดึงข้อมูลคำสั่งซื้อทั้งหมด
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const getOrders = async (c: Context) => {
  const orders: Order_Interface[] | null = await Order.find()
    .populate({
      path: "userId",
      select: "name email phone avatar address createdAt lat lng",
      localField: "userId",
      foreignField: "userId",
    })
    .populate({
      path: "products.productId",
      model: "Product",
      select: "name price imagePath",
      localField: "productId",
      foreignField: "productId",
    });

  if (!orders || orders.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  return {
    status: c.set.status,
    success: true,
    data: orders,
    message: "ดึงข้อมูลคำสั่งซื้อทั้งหมดสำเร็จ",
  };
};

/**
 * @api [GET] /api/v1/orders/:id
 * @description ดึงข้อมูลคำสั่งซื้อตาม ID
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getOrderById = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID คำสั่งซื้อ");
  }

  const order: Order_Interface | null = await Order.findOne({
    orderId: c.params.id,
  })
    .populate({
      path: "userId",
      select: "name email phone avatarPath address latitude longitude",
      localField: "userId",
      foreignField: "userId",
    })
    .populate({
      path: "products.productId",
      model: "Product",
      select: "name price imagePath",
      localField: "productId",
      foreignField: "productId",
    });

  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  const decodedToken = (await getUserIdFromToken(
    c.headers.authorization || "",
    true
  )) as DecodedToken;

  if (decodedToken.userId !== order.userId.userId && !decodedToken.isAdmin) {
    c.set.status = 403;
    throw new Error(
      "คุณไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้ order UserId: " +
        order.userId.userId +
        " token UserId: " +
        decodedToken.userId
    );
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: "ดึงข้อมูลคำสั่งซื้อสำเร็จ",
  };
};

/**
 * @api [GET] /api/v1/orders/my_order
 * @description ดึงข้อมูลคำสั่งซื้อตามผู้ใช้
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getMyOrder = async (c: Context) => {
  if (c.headers.authorization == null) {
    c.set.status = 401;
    throw new Error("ไม่มี authorization");
  }
  const userId = await getUserIdFromToken(c.headers.authorization || "");
  if (userId == null) {
    c.set.status = 401;
    throw new Error("ไม่พบผู้ใช้");
  }

  const orders: Order_Interface[] | null = await Order.find({ userId })
    .populate({
      path: "userId",
      select: "name email phone avatarPath address latitude longitude",
      localField: "userId",
      foreignField: "userId",
    })
    .populate({
      path: "products.productId",
      model: "Product",
      select: "name price imagePath",
      localField: "productId",
      foreignField: "productId",
    });

  if (!orders || orders.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  return {
    status: c.set.status,
    success: true,
    data: orders,
    message: "ดึงข้อมูลคำสั่งซื้อสำเร็จ",
  };
};

/**
 * @api [PUT] /api/v1/orders/:id/cancel
 * @description ยกเลิกคำสั่งซื้อ
 * @action เจ้าของคำสั่งซื้อ(own)หรือผู้ดูแลระบบ(admin)
 */
export const cancelOrder = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID คำสั่งซื้อ");
  }
  const decodedToken = (await getUserIdFromToken(
    c.headers.authorization || "",
    true
  )) as DecodedToken;
  const order = await Order.findOne({ orderId: c.params.id });

  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  if (decodedToken.userId !== order.userId && !decodedToken.isAdmin) {
    c.set.status = 403;
    throw new Error(
      "คุณไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้ order UserId: " +
        order.userId +
        " token UserId: " +
        decodedToken.userId
    );
  }

  if (order.deliverStatus === "cancel") {
    c.set.status = 400;
    throw new Error("คำสั่งซื้อถูกยกเลิกไปก่อนหน้านี้");
  } else {
    order.deliverStatus = "cancel";
    await order.save();
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: "ยกเลิกคำสั่งซื้อสำเร็จ",
  };
};

/**
 * @api [PUT] /api/v1/orders/:id/complete
 * @description สำเร็จคำสั่งซื้อ
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const completeOrder = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID คำสั่งซื้อ");
  }

  const order = await Order.findOneAndUpdate(
    { orderId: c.params.id },
    { deliverStatus: "delivered" },
    { new: true }
  );

  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  } else {
    c.set.status = 200;
    return {
      status: c.set.status,
      success: true,
      data: order,
      message: "สำเร็จคำสั่งซื้อและอัปเดตสถานะการจัดส่งเป็น 'delivered'",
    };
  }
};

export const prepareDelivery = async (c: Context) => {
  try {
    const pendingOrders = await Order.find({
      deliverStatus: "pending",
    }).populate({
      path: "userId",
      select: "name email phone avatarPath address latitude longitude",
      localField: "userId",
      foreignField: "userId",
    });

    if (!pendingOrders || pendingOrders.length === 0) {
      c.set.status = 404;
      return { success: false, message: "ไม่พบคำสั่งซื้อที่รอการจัดส่ง" };
    }

    // อัปเดตสถานะเป็น 'delivering'
    await Order.updateMany(
      { deliverStatus: "pending" },
      { deliverStatus: "delivering" }
    );

    // ส่งข้อมูลไปยัง Raspberry Pi ผ่าน WebSocket
    const deviceConnections = getDeviceConnections();
    deviceConnections.forEach((ws: any) => {
      ws.send(
        JSON.stringify({
          type: "prepare_delivery",
          orders: pendingOrders.map((order) => ({
            orderId: order.orderId,
            userId: order.userId.userId, // แก้ด้วย ยังไม่ทดสอบ
            latitude: order.userId.latitude,
            longitude: order.userId.longitude,
          })),
        })
      );
    });

    return {
      success: true,
      message: "เริ่มการจัดส่งสำเร็จ",
      data: pendingOrders,
    };
  } catch (error) {
    c.set.status = 500;
    return { success: false, message: "เกิดข้อผิดพลาดในการเตรียมการจัดส่ง" };
  }
};
