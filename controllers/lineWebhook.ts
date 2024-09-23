import { WebhookEvent, Client, middleware, TextMessage, FlexMessage } from "@line/bot-sdk";

export const config = {
  channelAccessToken: Bun.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: Bun.env.LINE_CHANNEL_SECRET || "",
};

console.log(
  "Channel Access Token:",
  config.channelAccessToken.substring(0, 5) + "..."
);
console.log("Channel Secret:", config.channelSecret.substring(0, 5) + "...");

const client = new Client(config);

export const handleWebhook = async (body: any) => {
  try {
    console.log("Received webhook payload:", body);
  
    if (body && "events" in body && Array.isArray(body.events)) {
      const events: WebhookEvent[] = body.events;

      await Promise.all(
        events.map(async (event) => {
          if (event.type === "message" && event.message.type === "text") {
            const { text } = event.message;
            const { replyToken } = event;
            const userId = event.source.userId;

            console.log(`ได้รับข้อความ - User ID: ${userId}, ข้อความ: ${text}`);

            if (text === "ข้อมูล") {
              const quickReplyMessage: TextMessage = {
                type: 'text',
                text: 'กรุณาเลือกรายการ',
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: 'รายการสินค้า',
                        text: 'สินค้า'
                      }
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: 'ข้อมูลโรงงาน',
                        text: 'ข้อมูลโรงงาน'
                      }
                    }
                  ]
                }
              };

              try {
                await client.replyMessage(replyToken, quickReplyMessage);
              } catch (error) {
                console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
              }
            } else if (text === 'ข้อมูลโรงงาน') {
              const flexMessage: FlexMessage = {
                type: 'flex',
                altText: 'ข้อมูลโรงงาน',
                contents: {
                  type: 'bubble',
                  hero: {
                    type: 'image',
                    url: 'https://img5.pic.in.th/file/secure-sv1/461045833_1902028550281385_86939055569419391_n.jpg',
                    size: 'full',
                    aspectRatio: '20:13',
                    aspectMode: 'cover'
                  },
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: 'ข้อมูลโรงงาน',
                        weight: 'bold',
                        size: 'xl'
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                              {
                                type: 'text',
                                text: 'ชื่อ',
                                color: '#aaaaaa',
                                size: 'sm',
                                flex: 1
                              },
                              {
                                type: 'text',
                                text: 'โรงงานภาณุวัฒน์Water',
                                wrap: true,
                                color: '#666666',
                                size: 'sm',
                                flex: 5
                              }
                            ]
                          },
                          {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                              {
                                type: 'text',
                                text: 'ที่อยู่',
                                color: '#aaaaaa',
                                size: 'sm',
                                flex: 1
                              },
                              {
                                type: 'text',
                                text: '280 หมู่.3 ต.บึงเนียม อ.เมือง จ.ขอนแก่น 40000',
                                wrap: true,
                                color: '#666666',
                                size: 'sm',
                                flex: 5
                              }
                            ]
                          },
                          {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                              {
                                type: 'text',
                                text: 'เบอร์โทร',
                                color: '#aaaaaa',
                                size: 'sm',
                                flex: 1
                              },
                              {
                                type: 'text',
                                text: '081-545-268-1',
                                wrap: true,
                                color: '#666666',
                                size: 'sm',
                                flex: 5
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              };

              try {
                await client.replyMessage(replyToken, flexMessage);
              } catch (error) {
                console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
              }
            } else {
              const replyMessage: TextMessage = {
                type: 'text',
                text: `คุณได้ส่งข้อความ "${text}"`
              };

              try {
                await client.replyMessage(replyToken, replyMessage);
              } catch (error) {
                console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
              }
            }
          }
        })
      );
    } else {
      console.log("Invalid webhook payload structure");
    }

    return { status: 200, body: "OK" };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการประมวลผล webhook:", error);
    return { status: 200, body: "OK" };
  }
};

export const lineMiddleware = middleware(config);
