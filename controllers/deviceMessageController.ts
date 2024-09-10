import { Device, Order, User } from "~/models";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { sendTextMessage } from "~/utils/lineMessaging";

export const handleDeviceMessage = (deviceid: string, message: any) => {
  console.log(`Device message from device ${deviceid}:`);
  if (typeof message === "object" && message !== null) {
    try {
      const payload = message as Record<string, unknown>;
      if (payload.sendto === "backend" && typeof payload.body === "object") {
        const data = payload.body as Record<string, unknown>;
        if (
          "order_id" in data &&
          "bottle_count" in data &&
          "time_completed" in data &&
          "image" in data
        ) {
          handleBottleData(deviceid, data);
        } else if (
          "gpsStatus" in data &&
          "latitude" in data &&
          "longitude" in data &&
          "deviceId" in data
        ) {
          updateDeviceLocation(deviceid, data);
        } else if ("lineId" in data) {
          if ("topic" in data && data.topic === "message") {
            handleLineMessage(deviceid, data);
          } else if ("topic" in data && data.topic === "near_order") {
            handleNearOrder(deviceid, data);
          }
        } else {
          console.log(`ไม่รู้จักประเภทข้อมูลจากอุปกรณ์ ${deviceid}:`, data);
        }
      } else {
        console.log(
          `ข้อความไม่ได้ส่งถึง backend หรือไม่มี body จากอุปกรณ์ ${deviceid}:`,
          payload
        );
      }
    } catch (error) {
      console.error(
        `เกิดข้อผิดพลาดในการประมวลผลข้อความจากอุปกรณ์ ${deviceid}:`,
        error
      );
    }
  } else {
    console.error(
      `ประเภทข้อความไม่ถูกต้องจากอุปกรณ์ ${deviceid} ประเภท: ${typeof message}`
    );
  }
};

async function handleBottleData(deviceid: string, data: any) {
  try {
    const uploadDir = join(process.cwd(), "image", "bottles");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        console.error("ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพขวดได้:", error);
        throw new Error("เกิดข้อผิดพลาดในการสร้างไดเรกทอรีสำหรับรูปภาพขวด");
      }
    }

    const timestamp = Date.now();
    const fileExtension =
      data.image.match(/^data:image\/(\w+);base64,/)?.[1] || "jpg";
    const imageName = `${data.order_id}.${fileExtension}`;
    const imagePath = join(uploadDir, imageName);

    try {
      const imageData = data.image.replace(/^data:image\/\w+;base64,/, "");
      await writeFile(imagePath, Buffer.from(imageData, "base64"));
      console.log(`บันทึกรูปภาพสำเร็จ: ${imagePath}`);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกรูปภาพ:", error);
      throw new Error("ไม่สามารถบันทึกรูปภาพได้");
    }

    const order = await Order.findOneAndUpdate(
      { orderId: data.order_id },
      {
        bottle_count: data.bottle_count,
        time_completed: data.time_completed,
        deviceId: deviceid,
        bottle_image_path: `/image/bottles/${imageName}`,
      },
      { new: true }
    );

    if (order) {
      console.log(`Order ${data.order_id} updated with bottle data`);
    } else {
      console.log(`Order ${data.order_id} not found`);
    }
  } catch (error) {
    console.error("Error handling bottle data:", error);
  }
}

async function handleNearOrder(deviceid: string, data: any) {
  try {
    console.log(`Device ${deviceid} has a near order`);

    if (!data || typeof data !== "object") {
      throw new Error("ข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์");
    }

    const { orderId, userId, distance, latitude, longitude, lineId } = data;

    if (
      !orderId ||
      !userId ||
      typeof distance !== "number" ||
      !latitude ||
      !longitude ||
      !lineId
    ) {
      throw new Error("ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง");
    }

    const nearOrder = await Order.findOne({ orderId });
    if (!nearOrder) {
      console.warn(`ไม่พบคำสั่งซื้อ ID: ${orderId}`);
      return;
    }

    const user = await User.findOne({ userId });
    if (!user) {
      console.warn(`ไม่พบผู้ใช้ ID: ${userId}`);
      return;
    }

    if (distance < 1) {
      if (!user.lineId) {
        console.warn(`ผู้ใช้ ID: ${userId} ไม่มี LINE ID`);
        return;
      }

      await sendTextMessage(
        user.lineId,
        `คุณมีคำสั่งซื้ออยู่ที่ระยะห่างจากคุณ ${distance.toFixed(2)} กิโลเมตร`
      );
      console.log(`ส่งการแจ้งเตือนสำเร็จสำหรับคำสั่งซื้อ ID: ${orderId}`);
    }

    await Device.findOneAndUpdate(
      { deviceId: deviceid },
      { latitude, longitude },
      { new: true }
    );
  } catch (error) {
    console.error(
      `เกิดข้อผิดพลาดในการจัดการคำสั่งซื้อใกล้เคียงสำหรับอุปกรณ์ ${deviceid}:`,
      error
    );
  }
}

async function updateDeviceLocation(deviceid: string, data: any) {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: deviceid },
      {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      { new: true }
    );

    if (device) {
      console.log(`Device ${deviceid} location updated`);
    } else {
      console.log(`Device ${deviceid} not found`);
    }
  } catch (error) {
    console.error("Error updating device location:", error);
  }
}

async function handleLineMessage(deviceid: string, data: any) {
  try {
    if (!data.lineId || !data.message) {
      console.error(
        `ข้อมูลไม่ครบถ้วนสำหรับการส่งข้อความ LINE จากอุปกรณ์ ${deviceid}`
      );
      return;
    }

    const { lineId, message } = data;

    await sendTextMessage(lineId, message);
    console.log(
      `ส่งข้อความ LINE สำเร็จจากอุปกรณ์ ${deviceid} ถึง LINE ID: ${lineId}`
    );
  } catch (error) {
    console.error(
      `เกิดข้อผิดพลาดในการส่งข้อความ LINE จากอุปกรณ์ ${deviceid}:`,
      error
    );
  }
}
