import { Elysia, t } from "elysia";
import { Device, Order, User } from "~/models";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { sendLineNotification } from "~/utils/lineNotification";

// WebSocket connections
const frontendConnections = new Map();
const deviceConnections = new Map();

export const getDeviceConnections = () => deviceConnections;

export function setupWebSocket(app: Elysia) {
  // WebSocket for frontend
  app.ws("/ws/frontend/:userid", {
    open(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.set(userid, ws);
      console.log(`Frontend connection opened for user: ${userid}`);
    },
    message(ws, message) {
      const userid = ws.data.params.userid;
      console.log(`Frontend message from user ${userid}:`, message);

      if (typeof message === "object" && message !== null) {
        const data = message as Record<string, unknown>;
        if (data.sendto === "device" && typeof data.body === "object") {
          // ส่งข้อความไปยังอุปกรณ์ทั้งหมด
          deviceConnections.forEach((deviceWs) => {
            deviceWs.send(JSON.stringify(message));
          });
          console.log(`ส่งข้อความไปยังอุปกรณ์ทั้งหมด:`, message);
        }
      }
    },
    close(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.delete(userid);
      console.log(`Frontend connection closed for user: ${userid}`);
    },
  });

  // WebSocket for devices
  app.ws("/ws/device/:deviceid", {
    open(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.set(deviceid, ws);
      console.log(`Device connection opened for device: ${deviceid}`);
    },
    message(ws, message) {
      const deviceid = ws.data.params.deviceid;
      console.log(`Device message from device ${deviceid}:`);
      if (typeof message === "object" && message !== null) {
        try {
          const payload = message as Record<string, unknown>;
          if (
            payload.sendto === "backend" &&
            typeof payload.body === "object"
          ) {
            const data = payload.body as Record<string, unknown>;

            if (
              "order_id" in data &&
              "bottle_count" in data &&
              "time_completed" in data &&
              "image" in data
            ) {
              // จัดการข้อมูลขวด
              handleBottleData(deviceid, data);
            } else if (
              "gpsStatus" in data &&
              "latitude" in data &&
              "longitude" in data &&
              "deviceId" in data
            ) {
              // จัดการข้อมูลตำแหน่งรถ
              updateDeviceLocation(deviceid, data);
            } else if ("near_order" in data) {
              handleNearOrder(deviceid, data);
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
    },
    close(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.delete(deviceid);
      console.log(`Device connection closed for device: ${deviceid}`);
    },
  });

  // Function to send message to specific target
  function sendMessage(target: "frontend" | "device", message: string) {
    const connections =
      target === "frontend" ? frontendConnections : deviceConnections;
    connections.forEach((ws) => {
      ws.send(JSON.stringify({ message }));
    });
  }

  // Example route to send message
  app.post(
    "/send-message",
    ({ body }) => {
      const { sendto, message } = body;
      if (sendto === "frontend" || sendto === "device") {
        sendMessage(sendto, message);
        return { success: true, message: `Message sent to ${sendto}` };
      }
      return { success: false, message: "Invalid target" };
    },
    {
      body: t.Object({
        sendto: t.Union([t.Literal("frontend"), t.Literal("device")]),
        message: t.String(),
      }),
    }
  );

  return app;
}

async function handleBottleData(deviceid: string, data: any) {
  // ตัวอย่างข้อมูลจากอุปกรณ์
  // {
  //   "sendTo": "backend",
  //   "body": {
  //     "order_id": "1234567890",
  //     "bottle_count": 10,
  //     "time_completed": "2024-05-01T12:00:00Z",
  //     "image": "base64_encoded_image_data"
  //   }
  // }
  try {
    // สร้างไดเรกทอรีสำหรับเก็บรูปภาพขวด (ถ้ายังไม่มี)
    const uploadDir = join(process.cwd(), "image", "bottles");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        console.error("ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพขวดได้:", error);
        throw new Error("เกิดข้อผิดพลาดในการสร้างไดเรกทอรีสำหรับรูปภาพขวด");
      }
    }

    // บันทึกรูปภาพ
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

    // อัปเดต Order document
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
  // ตัวอย่างข้อมูลจากอุปกรณ์
  // {
  //   "sendTo": "backend",
  //   "body": {
  //     "orderId": "1234567890",
  //     "userId": "user123",
  //     "distance": 0.5, (กิโลเมตร)
  //     "latitude": 13.7563,
  //     "longitude": 100.5018
  //   }
  // }
  try {
    console.log(`Device ${deviceid} has a near order`);

    if (!data || typeof data !== "object") {
      throw new Error("ข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์");
    }

    const { orderId, userId, distance, latitude, longitude } = data;

    if (
      !orderId ||
      !userId ||
      typeof distance !== "number" ||
      !latitude ||
      !longitude
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

      await sendLineNotification(
        user.lineId,
        `คุณมีคำสั่งซื้ออยู่ที่ระยะห่างจากคุณ ${distance.toFixed(2)} กิโลเมตร`
      );
      console.log(`ส่งการแจ้งเตือนสำเร็จสำหรับคำสั่งซื้อ ID: ${orderId}`);
    }

    // อัปเดตตำแหน่งล่าสุดของอุปกรณ์
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
    // อาจจะเพิ่มการแจ้งเตือนผู้ดูแลระบบหรือบันทึกข้อผิดพลาดลงในระบบ logging ที่นี่
  }
}

async function updateDeviceLocation(deviceid: string, data: any) {
  // ตัวอย่างข้อมูลจากอุปกรณ์
  // {
  //   "sendTo": "backend",
  //   "body": {
  //     "deviceId": "device123",
  //     "latitude": 13.7563,
  //     "longitude": 100.5018
  //   }
  // }
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
