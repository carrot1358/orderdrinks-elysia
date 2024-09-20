import { FilterChange, FilterRefill } from "~/models";
import { sendMaintenanceNotification } from "./lineMessaging";

export async function checkAndSendMaintenanceNotifications() {
  await checkFilterChange();
  await checkFilterRefill();
}

async function checkFilterChange() {
  const lastChange = await FilterChange.findOne().sort({ date: -1 });
  if (lastChange) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (lastChange.date < threeMonthsAgo) {
      await sendMaintenanceNotification(
        "แจ้งเตือน: ถึงเวลาเปลี่ยนไส้กรองแล้ว (ทุก 3 เดือน)"
      );
    }
  }
}

async function checkFilterRefill() {
  const lastRefill = await FilterRefill.findOne().sort({ date: -1 });
  if (lastRefill) {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate()
    );

    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const formatThaiDate = (date: Date) => {
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543; // แปลงเป็นปีพุทธศักราช
      return `${day} ${month} ${year}`;
    };

    const lastRefillDate = formatThaiDate(lastRefill.date);

    if (lastRefill.date < threeDaysAgo) {
      await sendMaintenanceNotification(
        `แจ้งเตือน: ถึงเวลาเติมไอโอดีนแล้ว (ทุก 3 วัน)\nครั้งล่าสุดเติมเมื่อ ${lastRefillDate}`
      );
    }

    if (lastRefill.date < oneYearAgo) {
      await sendMaintenanceNotification(
        `แจ้งเตือน: ถึงเวลาเติมคาร์บอน, เรซิน, แมงกานีส และโซดาแอช (ทุก 1 ปี)\nครั้งล่าสุดเติมเมื่อ ${lastRefillDate}`
      );
    }
  }
}
