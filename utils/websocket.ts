import { Elysia, t } from 'elysia';
import { Device } from '~/models' // Added this line to import the Device model

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
      console.log(`Device connection opened for user: ${deviceid}`);
    },
    message (ws, message) {
        const deviceid = ws.data.params.deviceid;
        console.log(`Device message from device ${deviceid}:`);
        if (typeof message === 'string') {
            try {
            const data = JSON.parse(message);
            if (data.image && data.bottle_count && data.time && data.order_id) {
                // ส่งข้อมูลขวดน้ำ
                console.log(`Received image data from device ${deviceid}:`);
                console.log(`Bottle count: ${data.bottle_count}`);
                console.log(`Time: ${data.time}`);
                // บันทึกรูปภาพหรือทำการประมวลผลเพิ่มเติมตามต้องการ
            }else if(data.latitude && data.longitude){
                // update device location
                Device.findOne({ deviceId: deviceid }).then((device) => {
                    if (device) {
                        device.latitude = data.latitude;
                        device.longitude = data.longitude;
                        device.save();
                        sendMessage('device', `Device ${deviceid} location updated`);
                    }else{
                        sendMessage('device', `Device ${deviceid} not found`);
                        console.log(`Device ${deviceid} not found`);
                    }
                });
            }
            } catch (error) {
            console.error(`Error processing message from device ${deviceid}:`, error);
            }
      } else {
        console.error(`Invalid message type from device ${deviceid}`);
      }
    },
    close(ws) {
      const deviceid = ws.data.params.deviceid;
      deviceConnections.delete(deviceid);
      console.log(`Device connection closed for user: ${deviceid}`);
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