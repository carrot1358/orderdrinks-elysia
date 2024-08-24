import { Elysia, t } from 'elysia';
import { Device, Order } from '~/models'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// WebSocket connections
const frontendConnections = new Map();
const deviceConnections = new Map();

export function setupWebSocket(app: Elysia) {
  // WebSocket for frontend
  app.ws('/ws/frontend/:userid', {
    open(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.set(userid, ws);
      console.log(`Frontend connection opened for user: ${userid}`);
    },
    message(ws, message) {
      const userid = ws.data.params.userid;
      console.log(`Frontend message from user ${userid}:`, message);
      // ทำการประมวลผลข้อความที่ได้รับจาก frontend
    },
    close(ws) {
      const userid = ws.data.params.userid;
      frontendConnections.delete(userid);
      console.log(`Frontend connection closed for user: ${userid}`);
    }
  });

  // WebSocket for devices
  app.ws('/ws/device/:deviceid', {
    open(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.set(deviceid, ws);
      console.log(`Device connection opened for device: ${deviceid}`);
    },
    message(ws, message) {
      const deviceid = ws.data.params.deviceid;
      console.log(`Device message from device ${deviceid}:`);
      if (typeof message === 'object' && message !== null) {
        try {
          const data = message as Record<string, unknown>;
          if ('image' in data && 'bottle_count' in data && 'time_completed' in data && 'order_id' in data) {
            handleBottleData(deviceid, data);
          } else if ('latitude' in data && 'longitude' in data) {
            updateDeviceLocation(deviceid, data);
          }
        } catch (error) {
          console.error(`Error processing message from device ${deviceid}:`, error);
        }
      } else {
        console.error(`Invalid message type from device ${deviceid} type: ${typeof message}`);
      }
    },
    close(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.delete(deviceid);
      console.log(`Device connection closed for device: ${deviceid}`);
    }
  });

  // Function to send message to specific target
  function sendMessage(target: 'frontend' | 'device', message: string) {
    const connections = target === 'frontend' ? frontendConnections : deviceConnections;
    connections.forEach((ws) => {
      ws.send(JSON.stringify({ message }));
    });
  }

  // Example route to send message
  app.post('/send-message', ({ body }) => {
    const { sendto, message } = body;
    if (sendto === 'frontend' || sendto === 'device') {
      sendMessage(sendto, message);
      return { success: true, message: `Message sent to ${sendto}` };
    }
    return { success: false, message: 'Invalid target' };
  }, {
    body: t.Object({
      sendto: t.Union([t.Literal('frontend'), t.Literal('device')]),
      message: t.String()
    })
  });

  return app;
}

async function handleBottleData(deviceid: string, data: any) {
  try {
    // สร้างไดเรกทอรีสำหรับเก็บรูปภาพขวด (ถ้ายังไม่มี)
    const uploadDir = join(process.cwd(), 'image', 'bottles')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        console.error('ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บรูปภาพขวดได้:', error)
        throw new Error('เกิดข้อผิดพลาดในการสร้างไดเรกทอรีสำหรับรูปภาพขวด')
      }
    }

    // บันทึกรูปภาพ
    const imageName = `${Date.now()}-${deviceid}.jpg`;
    const imagePath = join(uploadDir, imageName);
    await writeFile(imagePath, Buffer.from(data.image, 'base64'));

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
    console.error('Error handling bottle data:', error);
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
    console.error('Error updating device location:', error);
  }
}