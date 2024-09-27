import {
  WebhookEvent,
  Client,
  middleware,
  TextMessage,
  FlexMessage,
  FlexBubble,
  FlexCarousel,
} from "@line/bot-sdk";
import { Product } from "~/models";

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
                type: "text",
                text: "กรุณาเลือกรายการ",
                quickReply: {
                  items: [
                    {
                      type: "action",
                      action: {
                        type: "message",
                        label: "รายการสินค้า",
                        text: "สินค้า",
                      },
                    },
                    {
                      type: "action",
                      action: {
                        type: "message",
                        label: "ข้อมูลโรงงาน",
                        text: "ข้อมูลโรงงาน",
                      },
                    },
                  ],
                },
              };

              try {
                await client.replyMessage(replyToken, quickReplyMessage);
              } catch (error) {
                console.error("เกิดข้อผิดพลาดในการส่งข้อความ:", error);
              }
            } else if (text === "ข้อมูลโรงงาน") {
              const flexMessage: FlexMessage = {
                type: "flex",
                altText: "ข้อมูลโรงงาน",
                contents: {
                  type: "bubble",
                  hero: {
                    type: "image",
                    url: "https://img5.pic.in.th/file/secure-sv1/461045833_1902028550281385_86939055569419391_n.jpg",
                    size: "full",
                    aspectRatio: "20:13",
                    aspectMode: "cover",
                  },
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "โรงงานภาณุวัฒน์Water",
                        weight: "bold",
                        size: "xl",
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                          {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                              {
                                type: "text",
                                text: "เวลาทำการ",
                                color: "#aaaaaa",
                                size: "sm",
                                flex: 1,
                              },
                              {
                                type: "text",
                                text: "8.30-17.30",
                                wrap: true,
                                color: "#666666",
                                size: "sm",
                                flex: 5,
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "โทร:",
                            color: "#aaaaaa",
                            size: "sm",
                            flex: 1,
                          },
                          {
                            type: "text",
                            text: "081-545-268-1",
                            wrap: true,
                            color: "#666666",
                            size: "sm",
                            flex: 5,
                          },
                        ],
                      },
                      {
                        type: "button",
                        style: "primary",
                        action: {
                          type: "uri",
                          label: "ดูแผนที่",
                          uri: "https://maps.app.goo.gl/jhRQogd9cSG3n8et5",
                        },
                        margin: "md",
                      },
                    ],
                  },
                },
              };

              try {
                await client.replyMessage(replyToken, flexMessage);
              } catch (error) {
                console.error("เกิดข้อผิดพลาดในการส่งข้อความ:", error);
              }
            } else if (text === "สินค้า") {
              try {
                const products = await Product.find().limit(10);

                if (products.length === 0) {
                  await client.replyMessage(replyToken, {
                    type: "text",
                    text: "ขออภัย ไม่พบรายการสินค้าในขณะนี้",
                  });
                  return;
                }

                const flexContents: FlexBubble[] = products.map(
                  (product: Product) => ({
                    type: "bubble",
                    hero: {
                      type: "image",
                      url: `https://backend.nattapad.me${product.imagePath}`,
                      size: "full",
                      aspectRatio: "20:13",
                      aspectMode: "cover",
                    },
                    body: {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: product.name,
                          weight: "bold",
                          size: "xl",
                          wrap: true,
                        },
                        {
                          type: "box",
                          layout: "baseline",
                          margin: "md",
                          contents: [
                            {
                              type: "text",
                              text: `${product.price} บาท`,
                              size: "xl",
                              color: "#1DB446",
                              flex: 0,
                            },
                          ],
                        },
                        {
                          type: "text",
                          text: product.description || "ไม่มีคำอธิบาย",
                          size: "sm",
                          color: "#aaaaaa",
                          wrap: true,
                          margin: "sm",
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
                          action: {
                            type: "postback",
                            label: "สั่งซื้อ",
                            data: `action=order&id=${product.productId}`,
                          },
                        },
                        {
                          type: "button",
                          action: {
                            type: "postback",
                            label: "ดูรายละเอียด",
                            data: `action=view_product&id=${product.productId}`,
                          },
                        },
                      ],
                    },
                  })
                );

                const carouselContents: FlexCarousel = {
                  type: "carousel",
                  contents: flexContents,
                };

                const flexMessage: FlexMessage = {
                  type: "flex",
                  altText: "รายการสินค้า",
                  contents: carouselContents,
                };

                await client.replyMessage(replyToken, flexMessage);
              } catch (error) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", error);
                await client.replyMessage(replyToken, {
                  type: "text",
                  text: "ขออภัย เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                });
              }
            } else if (text === 'ติดต่อแอดมิน') {
              const flexMessage: FlexMessage = {
                type: 'flex',
                altText: 'ติดต่อแอดมิน',
                contents: {
                  type: 'bubble',
                  hero: {
                    type: 'image',
                    url: 'https://img2.pic.in.th/pic/1481932F-DC39-48BD-BD5B-9C79286183A6.jpg', // แทนที่ด้วย URL จริงของรูปแอดมิน
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
                        text: 'Admin Phanuwat',
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md'
                      },
                      {
                        type: 'text',
                        text: 'คุณสามารถติดต่อแอดมินได้ตามช่องทางด้านล่างนี้',
                        size: 'sm',
                        color: '#aaaaaa',
                        wrap: true,
                        margin: 'sm'
                      },
                      {
                        type: 'separator',
                        margin: 'xxl'
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'xxl',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                              {
                                type: 'text',
                                text: 'โทรศัพท์:',
                                size: 'sm',
                                color: '#555555',
                                flex: 0
                              },
                              {
                                type: 'text',
                                text: '0656843458',
                                size: 'sm',
                                color: '#111111',
                                align: 'end'
                              }
                            ]
                          },
                        ]
                      }
                    ]
                  },
                  footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'button',
                        style: 'link',
                        height: 'sm',
                        action: {
                          type: 'uri',
                          label: 'ติดต่อทาง LINE',
                          uri: 'https://line.me/ti/p/stZ9C78x7-'
                        }
                      }
                    ],
                    flex: 0
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
                type: "text",
                text: `คุณได้ส่งข้อความ "${text}"`,
              };

              try {
                await client.replyMessage(replyToken, replyMessage);
              } catch (error) {
                console.error("เกิดข้อผิดพลาดในการส่งข้อความ:", error);
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