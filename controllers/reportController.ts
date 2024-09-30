import { Context } from "elysia";
import PDFDocument from "pdfkit";
import {
  FilterRefill,
  FilterChange,
  FilterCleaning,
  Order,
  User,
  Product,
} from "~/models";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

// ฟังก์ชันสำหรับวาดตาราง (ใช้ร่วมกันทุกรายงาน)
const drawTable = (
  doc: PDFKit.PDFDocument,
  data: any[],
  columns: string[],
  startX: number,
  startY: number,
  options = {}
) => {
  const {
    rowHeight = 25,
    columnWidth = 75,
    fontSize = 12,
    headerColor = "#4A90E2",
    rowEvenColor = "#F5F5F5",
    rowOddColor = "#FFFFFF",
    textColor = "#333333",
  } = options as any;
  let y = startY;

  const drawTableHeader = () => {
    doc
      .fillColor(headerColor)
      .rect(startX, y, columnWidth * columns.length, rowHeight)
      .fill();
    doc.fillColor("#FFFFFF");
    columns.forEach((column, i) => {
      doc.text(column, startX + i * columnWidth, y + 7, {
        width: columnWidth,
        align: "center",
      });
    });
    y += rowHeight;
  };

  drawTableHeader();

  // วาดข้อมูลในตาราง
  data.forEach((row, rowIndex) => {
    let maxHeight = rowHeight;

    // คำนวณความสูงสูงสุดของแถว
    columns.forEach((column) => {
      if (column === "อื่นๆ" && row[column] && row[column] !== "-") {
        const textHeight = doc.heightOfString(row[column], {
          width: columnWidth,
          align: "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 10);
      }
    });

    // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
    if (y + maxHeight > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      drawTableHeader();
    }

    doc
      .fillColor(rowIndex % 2 === 0 ? rowEvenColor : rowOddColor)
      .rect(startX, y, columnWidth * columns.length, maxHeight)
      .fill();
    doc.fillColor(textColor);

    columns.forEach((column, i) => {
      const cellY = y + 5;
      if (column === "อื่นๆ" && row[column] && row[column] !== "-") {
        doc.text(row[column], startX + i * columnWidth + 5, cellY, {
          width: columnWidth - 10,
          align: "left",
          height: maxHeight - 10,
        });
      } else {
        doc.text(
          row[column] || "-",
          startX + i * columnWidth,
          cellY + (maxHeight - rowHeight) / 2,
          {
            width: columnWidth,
            align: "center",
          }
        );
      }
    });
    y += maxHeight;
  });

  // วาดเส้นขอบตาราง
  doc
    .lineWidth(0.5)
    .rect(startX, startY, columnWidth * columns.length, y - startY)
    .stroke();

  // วาดเส้นแนวตั้งแบ่งคอลัมน์
  for (let i = 1; i < columns.length; i++) {
    doc
      .moveTo(startX + i * columnWidth, startY)
      .lineTo(startX + i * columnWidth, y)
      .stroke();
  }
};

export const generatePDFReport_Refill = async (c: Context) => {
  try {
    const filterRefills = await FilterRefill.find()
      .sort({ date: -1 })
      .limit(10);
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "รายงานการบำรุงรักษาเครื่องกรองน้ำ",
        Author: "Panuwat Water",
      },
    });
    const pdfBuffers: Buffer[] = [];

    // เพิ่มฟอนต์ภาษาไทย (ตรวจสอบเส้นทางให้ถูกต้อง)
    const fontPath = path.resolve(
      process.cwd(),
      "assets",
      "fonts",
      "THSarabunNew.ttf"
    );
    doc.font(fontPath);

    // หัวข้อรายงาน
    doc
      .fontSize(18)
      .text("รายงานการบำรุงรักษาเครื่องกรองน้ำ", { align: "center" });
    doc.moveDown();

    // กำหนดคอลัมน์
    const columns = [
      "วันที่",
      "ไอโอดีน",
      "คาร์บอน",
      "เรซิ่น",
      "แมงกานีส",
      "Soda ash",
      "อื่นๆ",
    ];

    // แปลงข้อมูลให้เหมาะสมกับตาราง
    const tableData = filterRefills.map((refill) => ({
      วันที่: refill.date.toLocaleDateString("th-TH"),
      ไอโอดีน: refill.iodine ? "เติม" : "ไม่เติม",
      คาร์บอน: refill.carbon ? "เติม" : "ไม่เติม",
      เรซิ่น: refill.resin ? "เติม" : "ไม่เติม",
      แมงกานีส: refill.manganese ? "เติม" : "ไม่เติม",
      "Soda ash": refill.sodaAsh ? "เติม" : "ไม่เติม",
      อื่นๆ: refill.other || "-",
    }));

    // วาดตาราง
    drawTable(doc, tableData, columns, 50, 100, {
      columnWidth: 75,
      fontSize: 12,
      headerColor: "#4A90E2",
      rowEvenColor: "#F5F5F5",
      rowOddColor: "#FFFFFF",
      textColor: "#333333",
    });

    // แปลง PDF เป็น buffer
    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => pdfBuffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);
        c.set.headers["Content-Type"] = "application/pdf";
        c.set.headers["Content-Disposition"] =
          "attachment; filename=water_filter_report.pdf";
        resolve(pdfBuffer);
      });
      doc.end();
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน PDF:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน PDF",
    };
  }
};

export const generatePDFReport_Cleaning = async (c: Context) => {
  try {
    const filterCleanings = await FilterCleaning.find()
      .sort({ date: -1 })
      .limit(10);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "รายงานการทำความสะอาดเครื่องกรองน้ำ",
        Author: "Panuwat Water",
      },
    });
    const pdfBuffers: Buffer[] = [];

    // เพิ่มฟอนต์ภาษาไทย (ตรวจสอบเส้นทางให้ถูกต้อง)
    const fontPath = path.resolve(
      process.cwd(),
      "assets",
      "fonts",
      "THSarabunNew.ttf"
    );
    doc.font(fontPath);

    // หัวข้อรายงาน
    doc
      .fontSize(18)
      .text("รายงานการทำความสะอาดเครื่องกรองน้ำ", { align: "center" });
    doc.moveDown();

    // กำหนดคอลัมน์
    const columns = ["วันที่", "สถานะการทำความสะอาด"];

    // แปลงข้อมูลให้เหมาะสมกับตาราง
    const tableData = filterCleanings.map((cleaning) => ({
      วันที่: cleaning.date.toLocaleDateString("th-TH"),
      สถานะการทำความสะอาด: cleaning.cleaned
        ? "ทำความสะอาดแล้ว"
        : "ยังไม่ได้ทำความสะอาด",
    }));

    // วาดตาราง
    drawTable(doc, tableData, columns, 50, 100, {
      columnWidth: 250, // ปรับความกว้างของคอลัมน์ให้เหมาะสมกับข้อมูล 2 คอลัมน์
      fontSize: 12,
      headerColor: "#4A90E2",
      rowEvenColor: "#F5F5F5",
      rowOddColor: "#FFFFFF",
      textColor: "#333333",
    });

    // แปลง PDF เป็น buffer
    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => pdfBuffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);
        c.set.headers["Content-Type"] = "application/pdf";
        c.set.headers["Content-Disposition"] =
          "attachment; filename=filter_cleaning_report.pdf";
        resolve(pdfBuffer);
      });
      doc.end();
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน PDF:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน PDF",
    };
  }
};

export const generatePDFReport_Change = async (c: Context) => {
  try {
    const filterChanges = await FilterChange.find()
      .sort({ date: -1 })
      .limit(10);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "รายงานการเปลี่ยนไส้กรอง",
        Author: "Panuwat Water",
      },
    });
    const pdfBuffers: Buffer[] = [];

    // เพิ่มฟอนต์ภาษาไทย (ตรวจสอบเส้นทางให้ถูกต้อง)
    const fontPath = path.resolve(
      process.cwd(),
      "assets",
      "fonts",
      "THSarabunNew.ttf"
    );
    doc.font(fontPath);

    // หัวข้อรายงาน
    doc.fontSize(18).text("รายงานการเปลี่ยนไส้กรอง", { align: "center" });
    doc.moveDown();

    // กำหนดคอลัมน์
    const columns = ["วันที่", "ไส้กรองเล็ก", "ไส้กรอง RO", "อื่นๆ"];

    // แปลงข้อมูลให้เหมาะสมกับตาราง
    const tableData = filterChanges.map((change) => ({
      วันที่: change.date.toLocaleDateString("th-TH"),
      ไส้กรองเล็ก: change.smallFilter ? "เปลี่ยน" : "ไม่เปลี่ยน",
      "ไส้กรอง RO": change.membraneFilter ? "เปลี่ยน" : "ไม่เปลี่ยน",
      อื่นๆ: change.other || "-",
    }));

    // วาดตาราง
    drawTable(doc, tableData, columns, 50, 100, {
      columnWidth: 130,
      fontSize: 9,
      headerColor: "#4A90E2",
      rowEvenColor: "#F5F5F5",
      rowOddColor: "#FFFFFF",
      textColor: "#333333",
    });

    // แปลง PDF เป็น buffer
    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => pdfBuffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);
        c.set.headers["Content-Type"] = "application/pdf";
        c.set.headers["Content-Disposition"] =
          "attachment; filename=filter_change_report.pdf";
        resolve(pdfBuffer);
      });
      doc.end();
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน PDF:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน PDF",
    };
  }
};

export const getSalesStats = async (c: Context) => {
  try {
    const { startDate, endDate } = c.query as {
      startDate?: string;
      endDate?: string;
    };
    // ดึงข้อมูลยอดขายจาก database และคำนวณสถิติ
    const salesStats = await calculateSalesStats(startDate, endDate);
    return {
      status: 200,
      success: true,
      data: salesStats,
      message: "ดึงสถิติยอดขายสำเร็จ",
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงสถิติยอดขาย:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติยอดขาย",
    };
  }
};

export const getUserStats = async (c: Context) => {
  try {
    const { startDate, endDate } = c.query as {
      startDate: string;
      endDate: string;
    };
    // ดึงข้อมูลผู้ใช้จาก database และคำนวณสถิติ
    const userStats = await calculateUserStats(startDate, endDate);
    return {
      status: 200,
      success: true,
      data: userStats,
      message: "ดึงสถิติผู้ใช้สำเร็จ",
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้",
    };
  }
};

export const getFilterStats = async (c: Context) => {
  try {
    const { startDate, endDate } = c.query as {
      startDate: string;
      endDate: string;
    };
    // ดึงข้อมูลการเปลี่ยนไส้กรองจาก database และคำนวณสถิติ
    const filterStats = await calculateFilterStats(startDate, endDate);
    return {
      status: 200,
      success: true,
      data: filterStats,
      message: "ดึงสถิติการเปลี่ยนไส้กรองสำเร็จ",
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงสถิติการเปลี่ยนไส้กรอง:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติการเปลี่ยนไส้กรอง",
    };
  }
};

export const getOrderStats = async (c: Context) => {
  try {
    const { startDate, endDate } = c.query as {
      startDate: string;
      endDate: string;
    };
    // ดึงข้อมูลคำสั่งซื้อจาก database และคำนวณสถิติ
    const orderStats = await calculateOrderStats(startDate, endDate);
    return {
      status: 200,
      success: true,
      data: orderStats,
      message: "ดึงสถิติคำสั่งซื้อสำเร็จ",
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงสถิติคำสั่งซื้อ:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติคำสั่งซื้อ",
    };
  }
};

export const getRevenueStats = async (c: Context) => {
  try {
    const { startDate, endDate } = c.query as {
      startDate: string;
      endDate: string;
    };
    // ดึงข้อมูลรายได้จาก database และคำนวณสถิติ
    const revenueStats = await calculateRevenueStats(startDate, endDate);
    return {
      status: 200,
      success: true,
      data: revenueStats,
      message: "ดึงสถิติรายได้สำเร็จ",
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงสถิติรายได้:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติรายได้",
    };
  }
};

// ฟังก์ชันสำหรับคำนวณสถิติต่างๆ
async function calculateSalesStats(startDate?: string, endDate?: string) {
  const matchCondition: any = {};
  if (startDate) {
    matchCondition.createdAt = { $gte: new Date(startDate) };
  }
  if (endDate) {
    matchCondition.createdAt = {
      ...matchCondition.createdAt,
      $lte: new Date(endDate),
    };
  }

  const sales = await Order.aggregate([
    {
      $match: {
        ...matchCondition,
        deliverStatus: "delivered",
        statusPaid: "paid",
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSales: { $sum: "$totalPrice" }, // เปลี่ยนจาก totalAmount เป็น totalPrice
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sales;
}

async function calculateUserStats(startDate: string, endDate: string) {
  // ลอจิกการคำนวณสถิติผู้ใช้
  // ตัวอย่าง:
  const newUsers = await User.countDocuments({
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  const totalUsers = await User.countDocuments({
    createdAt: { $lte: new Date(endDate) },
  });

  return { newUsers, totalUsers };
}

async function calculateFilterStats(startDate: string, endDate: string) {
  // ลอจิกการคำนวณสถิติการเปลี่ยนไส้กรอง
  // ตัวอย่าง:
  const filterChanges = await FilterChange.countDocuments({
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  const filterRefills = await FilterRefill.countDocuments({
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  return { filterChanges, filterRefills };
}

async function calculateOrderStats(startDate: string, endDate: string) {
  // ลอจิกการคำนวณสถิติคำสั่งซื้อ
  // ตัวอย่าง:
  const orderStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: "$deliverStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  return orderStats;
}

async function calculateRevenueStats(startDate: string, endDate: string) {
  // ลอจิกการคำนวณสถิติรายได้
  // ตัวอย่าง:
  const revenueStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        deliverStatus: "delivered",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
          },
        },
        totalRevenue: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return revenueStats;
}

export const generateExcelReport_Refill = async (c: Context) => {
  try {
    const filterRefills = await FilterRefill.find()
      .sort({ date: -1 })
      .limit(10);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Refill Report");

    // กำหนดคอลัมน์
    sheet.columns = [
      { header: "วันที่", key: "date", width: 15 },
      { header: "ไอโอดีน", key: "iodine", width: 10 },
      { header: "คาร์บอน", key: "carbon", width: 10 },
      { header: "เรซิ่น", key: "resin", width: 10 },
      { header: "แมงกานีส", key: "manganese", width: 10 },
      { header: "Soda ash", key: "sodaAsh", width: 10 },
      { header: "อื่นๆ", key: "other", width: 20 },
    ];

    // เพิ่มข้อมูลลงในชีท
    filterRefills.forEach((refill) => {
      sheet.addRow({
        date: refill.date.toLocaleDateString("th-TH"),
        iodine: refill.iodine ? "เติม" : "ไม่เติม",
        carbon: refill.carbon ? "เติม" : "ไม่เติม",
        resin: refill.resin ? "เติม" : "ไม่เติม",
        manganese: refill.manganese ? "เติม" : "ไม่เติม",
        sodaAsh: refill.sodaAsh ? "เติม" : "ไม่เติม",
        other: refill.other || "-",
      });
    });

    // แปลง Excel เป็น buffer
    const buffer = await workbook.xlsx.writeBuffer();
    c.set.headers["Content-Type"] =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    c.set.headers["Content-Disposition"] =
      "attachment; filename=refill_report.xlsx";
    return buffer;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน Excel:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน Excel",
    };
  }
};

export const generateExcelReport_Cleaning = async (c: Context) => {
  try {
    const filterCleanings = await FilterCleaning.find()
      .sort({ date: -1 })
      .limit(10);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cleaning Report");

    // กำหนดคอลัมน์
    sheet.columns = [
      { header: "วันที่", key: "date", width: 15 },
      { header: "สถานะการทำความสะอาด", key: "cleaned", width: 25 },
    ];

    // เพิ่มข้อมูลลงในชีท
    filterCleanings.forEach((cleaning) => {
      sheet.addRow({
        date: cleaning.date.toLocaleDateString("th-TH"),
        cleaned: cleaning.cleaned ? "ทำความสะอาดแล้ว" : "ยังไม่ได้ทำความสะอาด",
      });
    });

    // แปลง Excel เป็น buffer
    const buffer = await workbook.xlsx.writeBuffer();
    c.set.headers["Content-Type"] =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    c.set.headers["Content-Disposition"] =
      "attachment; filename=cleaning_report.xlsx";
    return buffer;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน Excel:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน Excel",
    };
  }
};

export const generateExcelReport_Change = async (c: Context) => {
  try {
    const filterChanges = await FilterChange.find()
      .sort({ date: -1 })
      .limit(10);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Change Report");

    // กำหนดคอลัมน์
    sheet.columns = [
      { header: "วันที่", key: "date", width: 15 },
      { header: "ไส้กรองเล็ก", key: "smallFilter", width: 15 },
      { header: "ไส้กรอง RO", key: "membraneFilter", width: 15 },
      { header: "อื่นๆ", key: "other", width: 20 },
    ];

    // เพิ่มข้อมูลลงในชีท
    filterChanges.forEach((change) => {
      sheet.addRow({
        date: change.date.toLocaleDateString("th-TH"),
        smallFilter: change.smallFilter ? "เปลี่ยน" : "ไม่เปลี่ยน",
        membraneFilter: change.membraneFilter ? "เปลี่ยน" : "ไม่เปลี่ยน",
        other: change.other || "-",
      });
    });

    // แปลง Excel เป็น buffer
    const buffer = await workbook.xlsx.writeBuffer();
    c.set.headers["Content-Type"] =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    c.set.headers["Content-Disposition"] =
      "attachment; filename=change_report.xlsx";
    return buffer;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างรายงาน Excel:", error);
    return {
      status: 500,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน Excel",
    };
  }
};
