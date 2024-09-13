import { Context } from "elysia";
import { DistanceNotification } from "~/models";

export const createDefaultDistanceNotification = async () => {
  const distanceNotificationExists = await DistanceNotification.findOne();
  if (!distanceNotificationExists) {
    await DistanceNotification.create({
      distance: 1000,
    });
  }
};

export const getDistanceNotifications = async (c: Context) => {
  try {
    const notifications = await DistanceNotification.find().sort({
      distance: 1,
    });
    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    c.set.status = 500;
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือนระยะทาง",
    };
  }
};

export const createDistanceNotification = async (c: Context) => {
  try {
    const { distance } = c.body as any;
    const newNotification = await DistanceNotification.create({
      distance,
    });
    return {
      success: true,
      data: newNotification,
      message: "สร้างการแจ้งเตือนระยะทางสำเร็จ",
    };
  } catch (error) {
    c.set.status = 500;
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างการแจ้งเตือนระยะทาง",
    };
  }
};

export const updateDistanceNotification = async (c: Context) => {
  try {
    const { id } = c.params as any;
    const { distance } = c.body as any;
    const updatedNotification = await DistanceNotification.findByIdAndUpdate(
      id,
      { distance },
      { new: true }
    );
    if (!updatedNotification) {
      c.set.status = 404;
      return {
        success: false,
        message: "ไม่พบการแจ้งเตือนระยะทางที่ต้องการอัปเดต",
      };
    }
    return {
      success: true,
      data: updatedNotification,
      message: "อัปเดตการแจ้งเตือนระยะทางสำเร็จ",
    };
  } catch (error) {
    c.set.status = 500;
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือนระยะทาง",
    };
  }
};

export const deleteDistanceNotification = async (c: Context) => {
  try {
    const { id } = c.params as any;
    const deletedNotification = await DistanceNotification.findByIdAndDelete(
      id
    );
    if (!deletedNotification) {
      c.set.status = 404;
      return {
        success: false,
        message: "ไม่พบการแจ้งเตือนระยะทางที่ต้องการลบ",
      };
    }
    return {
      success: true,
      message: "ลบการแจ้งเตือนระยะทางสำเร็จ",
    };
  } catch (error) {
    c.set.status = 500;
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบการแจ้งเตือนระยะทาง",
    };
  }
};
