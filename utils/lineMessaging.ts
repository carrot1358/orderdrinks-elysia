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
