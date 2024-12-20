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
import { sendOrderNotification } from "~/utils/lineMessaging";
import { format } from "date-fns";
import crypto from "crypto";

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
  const userId = (await getUserIdFromToken(
    c.headers.authorization || ""
  )) as string;

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

  const generateOrderId = (): string => {
    const timestamp = format(new Date(), "yyyyMMddHHmmss");
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${timestamp}-${randomPart}`;
  };

  const generateUniqueOrderId = async (): Promise<string> => {
    let orderId_generate: string = "";
    let exists = true;
    while (exists) {
      orderId_generate = generateOrderId();
      const existingOrder = await Order.findOne({ orderId: orderId_generate });
      if (!existingOrder) {
        exists = false;
      }
    }
    return orderId_generate;
  };

  const order = await Order.create({
    orderId: await generateUniqueOrderId(),
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

  if (user.lineId) {
    try {
      const order_data = await Order.findOne({ orderId: order.orderId })
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
      await sendOrderNotification(user.lineId, order_data);
    } catch (error) {
      console.error(`ไม่สามารถส่งการแจ้งเตือน LINE ได้: ${error}`);
    }
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

  const order = await Order.findOne({ orderId, userId })
    .populate({
      path: "userId",
      select: "name lineId email phone avatar address createdAt lat lng",
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
      select: "name lineId email phone avatar address createdAt lat lng",
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
 * @api [GET] /api/v1/orders/get-order-delivery
 * @description ดึงข้อมูลคำสั่งซื้อที่กำลังจัดส่ง
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getOrderDelivery = async (c: Context) => {
  const orders: Order_Interface[] | null = await Order.find({
    deliverStatus: "delivering",
  })
    .populate({
      path: "userId",
      select: "name lineId email phone avatar address createdAt lat lng",
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
    throw new Error("ไม่พบคำสั่งซื้อที่กำลังจัดส่ง");
  }

  return {
    status: c.set.status,
    success: true,
    data: orders,
    message: "ดึงข้อมูลคำสั่งซื้อที่กำลังจัดส่งสำเร็จ",
  };
};

/**
 * @api [GET] /api/v1/orders/get-order-not-done
 * @description ดึงข้อมูลคำสั่งซื้อที่ยังไม่เสร็จสมบูรณ์
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getOrderNotDone = async (c: Context) => {
  const orders: Order_Interface[] | null = await Order.find({
    deliverStatus: { $ne: "delivered" },
  })
    .populate({
      path: "userId",
      select: "name lineId email phone avatar address createdAt lat lng",
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
    throw new Error("ไม่พบคำสั่งซื้อที่ยังไม่เสร็จสมบูรณ์");
  }

  return {
    status: c.set.status,
    success: true,
    data: orders,
    message: "ดึงข้อมูลคำสั่งซื้อที่ยังไม่เสร็จสมบูรณ์สำเร็จ",
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
      select: "name lineId email phone avatarPath address latitude longitude",
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
      select: "name lineId email phone avatarPath address latitude longitude",
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
 * @api [PUT] /api/v1/orders/:id/update
 * @description อัปเดตคำสั่งซื้อ
 * @action ผู้ดูแลระบบ(admin)
 */
export const updateOrder = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400;
    throw new Error("ไม่ได้ระบุ ID คำสั่งซื้อ");
  }

  const decodedToken = (await getUserIdFromToken(
    c.headers.authorization || "",
    true
  )) as DecodedToken;

  if (!decodedToken.isAdmin) {
    c.set.status = 403;
    throw new Error("คุณไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้");
  }

  const { statusPaid, deliverStatus, methodPaid } = c.body as any;

  const order = await Order.findOneAndUpdate(
    { orderId: c.params.id },
    { statusPaid, deliverStatus, methodPaid },
    { new: true }
  );

  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  return {
    status: c.set.status,
    success: true,
    data: order,
    message: "อัปเดตคำสั่งซื้อสำเร็จ",
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
export const completeOrder = async (c: Context) => {
  const { orderId, deliverImage } = c.body as any;

  const order = await Order.findOne({ orderId });

  if (!order) {
    c.set.status = 404;
    throw new Error("ไม่พบคำสั่งซื้อ");
  }

  order.deliverStatus = "delivered";

  //save image to image/deliver
  const imagePath = join(process.cwd(), "image", "deliver");
  try {
    await mkdir(imagePath, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      console.error("ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพได้:", error);
      throw new Error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    }
  }

  const fileExtension = deliverImage.name.split(".").pop();
  const fileName = `${orderId}.${fileExtension}`;
  const filePath = join(imagePath, fileName);

  try {
    const buffer = Buffer.from(await deliverImage.arrayBuffer());
    await writeFile(filePath, buffer);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ:", error);
    throw new Error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
  }

  //send need bottle image to device via websocket
  const deviceConnections = getDeviceConnections();
  deviceConnections.forEach((ws: any) => {
    ws.send(
      JSON.stringify({
        sendto: "device",
        body: {
          topic: "need_bottle_image",
          orderId: orderId,
        },
      })
    );
  });

  order.deliver_image_path = `/image/deliver/${fileName}`;
  await order.save();

  c.set.status = 200;
  return {
    status: c.set.status,
    success: true,
    data: order,
    message: "สำเร็จคำสั่งซื้อและอัปเดตสถานะการจัดส่งเป็น 'delivered'",
  };
};

export const prepareDelivery = async (c: Context) => {
  try {
    const pendingOrders = await Order.find({
      deliverStatus: "pending",
    })
      .populate({
        path: "userId",
        select: "name lineId email phone avatarPath address lat lng",
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

    if (!pendingOrders || pendingOrders.length === 0) {
      c.set.status = 404;
      return { success: false, message: "ไม่พบคำสั่งซื้อที่รอการจัดส่ง" };
    }

    // สร้าง metadata สรุปรายการสินค้า
    const deliveryMetadata = {
      totalOrders: pendingOrders.length,
      totalAmount: 0,
      productSummary: new Map<
        string,
        {
          name: string;
          totalQuantity: number;
          totalPrice: number;
        }
      >(),
      deliveryLocations: new Set<string>(), // เก็บพื้นที่จัดส่งที่ไม่ซ้ำกัน
      estimatedDeliveryTime: 0,
    };

    // วนลูปคำนวณ metadata
    pendingOrders.forEach((order: any) => {
      deliveryMetadata.totalAmount += order.totalPrice;

      // เพิ่มพื้นที่จัดส่ง
      if (order.userId?.address) {
        deliveryMetadata.deliveryLocations.add(order.userId.address);
      }

      // รวมข้อมูลสินค้า
      order.products.forEach((product: any) => {
        const productId = product.productId._id.toString();
        const existing = deliveryMetadata.productSummary.get(productId);

        if (existing) {
          existing.totalQuantity += product.quantity;
          existing.totalPrice += product.quantity * product.productId.price;
        } else {
          deliveryMetadata.productSummary.set(productId, {
            name: product.productId.name,
            totalQuantity: product.quantity,
            totalPrice: product.quantity * product.productId.price,
          });
        }
      });
    });

    // อัปเดตสถานะเป็น 'delivering'
    await Order.updateMany(
      { deliverStatus: "pending" },
      { deliverStatus: "delivering" },
      { new: true }
    );

    // แปลง Map และ Set เป็น Object ก่อนส่งกลับ
    const formattedMetadata = {
      ...deliveryMetadata,
      productSummary: Object.fromEntries(deliveryMetadata.productSummary),
      deliveryLocations: Array.from(deliveryMetadata.deliveryLocations),
      timestamp: new Date().toISOString(),
      batchId: crypto.randomUUID(), // สร้าง unique ID สำหรับชุดการจัดส่งนี้
    };

    return {
      success: true,
      message: "เริ่มการจัดส่งสำเร็จ",
      data: {
        orders: pendingOrders,
        metadata: formattedMetadata,
      },
    };
  } catch (error: any) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    c.set.status = 500;
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเตรียมการจัดส่ง",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    };
  }
};
