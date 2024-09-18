import { Context } from "elysia";
import PDFDocument from "pdfkit";
import FilterRefill from "~/models/filterRefillModel";
import FilterChange from "~/models/filterChangeModel";
import FilterCleaning from "~/models/filterCleaningModel";

export const generatePDFReport = async (c: Context) => {
  try {
    // ดึงข้อมูลจาก database
    const filterRefills = await FilterRefill.find()
      .sort({ date: -1 })
      .limit(10);
    const filterChanges = await FilterChange.find()
      .sort({ date: -1 })
      .limit(10);
    const filterCleanings = await FilterCleaning.find()
      .sort({ date: -1 })
      .limit(10);

    // สร้าง PDF document
    const doc = new PDFDocument();
    const pdfBuffers: Buffer[] = [];

    // เขียนเนื้อหาลงใน PDF
    doc
      .fontSize(18)
      .text("รายงานการบำรุงรักษาเครื่องกรองน้ำ", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text("บันทึกการเติมสารกรอง");
    filterRefills.forEach((refill) => {
      doc
        .fontSize(12)
        .text(`วันที่: ${refill.date.toLocaleDateString("th-TH")}`);
      doc.text(`ไอโอดีน: ${refill.iodine ? "เติม" : "ไม่เติม"}`);
      doc.text(`คาร์บอน: ${refill.carbon ? "เติม" : "ไม่เติม"}`);
      doc.text(`เรซิ่น: ${refill.resin ? "เติม" : "ไม่เติม"}`);
      doc.text(`แมงกานีส: ${refill.manganese ? "เติม" : "ไม่เติม"}`);
      doc.text(`Soda ash: ${refill.sodaAsh ? "เติม" : "ไม่เติม"}`);
      doc.text(`อื่นๆ: ${refill.other || "-"}`);
      doc.moveDown();
    });

    doc.addPage();

    doc.fontSize(14).text("บันทึกการเปลี่ยนไส้กรอง");
    filterChanges.forEach((change) => {
      doc
        .fontSize(12)
        .text(`วันที่: ${change.date.toLocaleDateString("th-TH")}`);
      doc.text(`ไส้กรองเล็ก: ${change.smallFilter ? "เปลี่ยน" : "ไม่เปลี่ยน"}`);
      doc.text(
        `ไส้กรอง Membrane: ${change.membraneFilter ? "เปลี่ยน" : "ไม่เปลี่ยน"}`
      );
      doc.text(`อื่นๆ: ${change.other || "-"}`);
      doc.moveDown();
    });

    doc.addPage();

    doc.fontSize(14).text("บันทึกการทำความสะอาดเครื่องกรอง");
    filterCleanings.forEach((cleaning) => {
      doc
        .fontSize(12)
        .text(`วันที่: ${cleaning.date.toLocaleDateString("th-TH")}`);
      doc.text(`ทำความสะอาด: ${cleaning.cleaned ? "ทำ" : "ไม่ได้ทำ"}`);
      doc.moveDown();
    });

    // สร้าง PDF buffer
    doc.on("data", (chunk) => pdfBuffers.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(pdfBuffers);

      // ตั้งค่า response
      c.set.status = 200;
      c.set.headers["Content-Type"] = "application/pdf";
      c.set.headers["Content-Disposition"] =
        "attachment; filename=water_filter_report.pdf";

      // ส่ง PDF buffer กลับไป
      return pdfBuffer;
    });

    // จบการสร้าง PDF
    doc.end();
  } catch (error) {
    c.set.status = 500;
    return {
      status: c.set.status,
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงาน PDF",
    };
  }
};
