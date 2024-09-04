import { Context } from "elysia";
import axios from "axios";
import { User } from "~/models";
import { jwt } from "~/utils";

const clientID = import.meta.env.LINE_LOGIN_CHANNEL_ID as string;
const clientSecret = import.meta.env.LINE_LOGIN_CHANNEL_SECRET as string;
const redirectUri = import.meta.env.LINE_LOGIN_CALLBACK_URL as string;

const getAccessToken = async (authorizationCode: string) => {
  try {
    const response = await axios.post(
      "https://api.line.me/oauth2/v2.1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: clientID,
        client_secret: clientSecret,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
};

const getProfile = async (accessToken: string) => {
  try {
    const response = await axios.get("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error getting profile:", error);
    throw error;
  }
};

export const lineLogin = ({ set }: Context) => {
  const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientID}&redirect_uri=${redirectUri}&state=abc&scope=profile%20openid`;
  set.redirect = loginUrl;
};

export const lineCallback = async ({ query, set }: Context) => {
  const { code } = query;

  if (typeof code !== "string") {
    set.status = 400;
    return "Invalid authorization code";
  }
  console.log("รหัสการอนุญาตที่ได้รับ:", code);

  try {
    const accessToken = await getAccessToken(code);
    console.log("Access token ที่ได้รับ:", accessToken);
    const profile = await getProfile(accessToken);
    console.log("ข้อมูลโปรไฟล์ที่ได้รับ:", profile);

    // ตรวจสอบว่ามีผู้ใช้ที่เชื่อมโยงกับ LINE ID นี้หรือไม่
    let user = await User.findOne({ lineId: profile.userId });

    if (!user) {
      // ถ้าไม่มี ให้สร้างผู้ใช้ใหม่และบันทึกข้อมูล LINE
      const userId = crypto.randomUUID();
      user = new User({
        name: profile.displayName,
        lineName: profile.displayName,
        lineId: profile.userId,
        lineAvatar: profile.pictureUrl,
        phone: "ยังไม่ได้ระบุ", // เพิ่มค่าเริ่มต้นสำหรับ phone
        password: "Changethispassword@1234",
        userId: userId,
      });
      await user.save();
      // สร้าง JWT token
      const token = await jwt.sign({
        data: {
          userId: userId,
          name: user.name,
          phone: user.phone,
          isAdmin: user.isAdmin,
          role: user.role,
        },
      });
      set.redirect = import.meta.env.FONTEND_URL + "/login?jwtToken=" + token;
    } else if (!user.lineId) {
      user.lineName = profile.displayName;
      user.lineAvatar = profile.pictureUrl;
      user.lineId = profile.userId;

      await user.save();
    }
    const token = await jwt.sign({
      data: {
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role: user.role,
      },
    });
    set.redirect = import.meta.env.FONTEND_URL + "/login?jwtToken=" + token;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดระหว่างการเข้าสู่ระบบ LINE:", error);
    set.status = 500;
    return "Error during LINE login";
  }
};
