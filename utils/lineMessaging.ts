import { Client, TextMessage, FlexMessage } from "@line/bot-sdk";

const client = new Client({
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

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
    const flexMessage: FlexMessage = {
      type: "flex",
      altText: "คำสั่งซื้อใหม่",
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
              weight: "bold",
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
                    type: "text",
                    text: product.productId.name,
                    size: "sm",
                    color: "#555555",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `x${product.quantity}`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                  },
                ],
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
                uri: `https://yourwebsite.com/orders/${order.orderId}`,
              },
            },
          ],
          flex: 0,
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
