import { Client, TextMessage, FlexMessage } from "@line/bot-sdk";
import { User } from "~/models";

const backendUrl = "https://backend.nattapad.me";

const client = new Client({
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

// ฟังก์ชันสำหรับแปลงวิธีการชำระเงินเป็นภาษาไทย
const translateMethodPaid = (method: string): string => {
  switch (method) {
    case "cash":
      return "เงินสด";
    case "promptpay":
      return "พร้อมเพย์";
    default:
      return method; // คืนค่าตามเดิมถ้าไม่ตรง
  }
};

// ฟังก์ชันสำหรับแปลงสถานะการชำระเงินเป็นภาษาไทย
const translateStatusPaid = (status: string): string => {
  switch (status) {
    case "paid":
      return "ชำระเงินแล้ว";
    case "not_paid":
      return "ยังไม่ชำระเงิน";
    case "check_paid":
      return "ตรวจสอบการชำระเงิน";
    case "wait_paid":
      return "รอการชำระเงิน";
    case "error":
      return "เกิดข้อผิดพลาด";
    default:
      return status; // คืนค่าตามเดิมถ้าไม่ตรง
  }
};

export async function sendTextMessage(
  userId: string,
  message: string
): Promise<void> {
  try {
    const textMessage: TextMessage = {
      type: "text",
      text: message,
    };
    await client.pushMessage(userId, textMessage);
    console.log(`ส่งข้อความถึง User ID: ${userId} สำเร็จ`);
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการส่งข้อความถึง User ID: ${userId}`, error);
  }
}

export async function sendFlexMessage(
  userId: string,
  flexContent: any
): Promise<void> {
  try {
    const flexMessage: FlexMessage = {
      type: "flex",
      altText: "This is a Flex Message",
      contents: flexContent,
    };
    await client.pushMessage(userId, flexMessage);
    console.log(`ส่ง Flex Message ถึง User ID: ${userId} สำเร็จ`);
  } catch (error) {
    console.error(
      `เกิดข้อผิดพลาดในการส่ง Flex Message ถึง User ID: ${userId}`,
      error
    );
  }
}

export async function sendOrderNotification(
  userId: string,
  order: any
): Promise<void> {
  try {
    console.log("Order data:", JSON.stringify(order, null, 2));

    const flexMessage: FlexMessage = {
      type: "flex",
      altText: `คำสั่งซื้อใหม่ #${order.orderId}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "คำสั่งซื้อใหม่",
              weight: "bold",
              size: "xl",
              color: "#ffffff",
            },
          ],
          backgroundColor: "#27ACB2",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `หมายเลขคำสั่งซื้อ: ${order.orderId}`,
              size: "xs",
              color: "#aaaaaa",
              margin: "md",
            },
            {
              type: "separator",
              margin: "xxl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "xxl",
              spacing: "sm",
              contents: order.products.map((product: any) => ({
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "image",
                        url: `${backendUrl}${product.productId.imagePath}`,
                        size: "full",
                        aspectMode: "cover",
                        aspectRatio: "1:1",
                        flex: 1,
                      },
                    ],
                    width: "72px",
                    height: "72px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: product.productId.name,
                        size: "sm",
                        color: "#555555",
                        flex: 0,
                        weight: "bold",
                      },
                      {
                        type: "text",
                        text: `x${product.quantity}`,
                        size: "sm",
                        color: "#111111",
                        align: "start",
                      },
                      {
                        type: "text",
                        text: `฿${product.productId.price * product.quantity}`,
                        size: "sm",
                        color: "#111111",
                        align: "start",
                        weight: "bold",
                      },
                    ],
                    flex: 2,
                    paddingStart: "12px",
                  },
                ],
                margin: "md",
              })),
            },
            {
              type: "separator",
              margin: "xxl",
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "ราคารวม",
                  size: "sm",
                  color: "#555555",
                },
                {
                  type: "text",
                  text: `฿${order.totalPrice.toFixed(2)}`,
                  size: "sm",
                  color: "#111111",
                  align: "end",
                  weight: "bold",
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "วิธีการชำระเงิน",
                  size: "sm",
                  color: "#555555",
                },
                {
                  type: "text",
                  text: translateMethodPaid(order.methodPaid),
                  size: "sm",
                  color: "#111111",
                  align: "end",
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "สถานะการชำระเงิน",
                  size: "sm",
                  color: "#555555",
                },
                {
                  type: "text",
                  text: translateStatusPaid(order.statusPaid),
                  size: "sm",
                  color: "#111111",
                  align: "end",
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "uri",
                label: "ดูรายละเอียด",
                uri: `https://backend.nattapad.me/line/login`,
              },
            },
          ],
        },
      },
    };

    await client.pushMessage(userId, flexMessage);
    console.log(`ส่งการแจ้งเตือนคำสั่งซื้อถึง User ID: ${userId} สำเร็จ`);
  } catch (error: any) {
    console.error(
      `เกิดข้อผิดพลาดในการส่งการแจ้งเตือนคำสั่งซื้อถึง User ID: ${userId}`,
      error
    );
    if (error.originalError && error.originalError.response) {
      console.error("รายละเอียดข้อผิดพลาด:", error.originalError.response.data);
    }
  }
}

export async function nearOrderNotification(
  lineId: string,
  distance: number
): Promise<void> {
  try {
    const message = `คำสั่งซื้อของคุณอยู่ห่างจากคุณ ${distance} เมตร`;

    const textMessage: TextMessage = {
      type: "text",
      text: message,
    };
    await client.pushMessage(lineId, textMessage);
  } catch (error) {
    console.error(
      "เกิดข้อผิดพลาดในการส่งการแจ้งเตือนคำสั่งซื้อถึง User ID:",
      lineId,
      error
    );
  }
}

export async function sendMaintenanceNotification(
  message: string
): Promise<void> {
  try {
    const adminUsers = await User.find({ role: "admin" });

    for (const user of adminUsers) {
      if (user.lineId) {
        await sendTextMessage(user.lineId, message);
      }
    }

    console.log("ส่งการแจ้งเตือนการบำรุงรักษาสำเร็จ");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งการแจ้งเตือนการบำรุงรักษา:", error);
  }
}
