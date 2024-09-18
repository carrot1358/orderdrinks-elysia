import { Context } from "elysia";
import FilterCleaning from "~/models/filterCleaningModel";

const stringToBoolean = (value: string): boolean => {
  return value.toLowerCase() === "true";
};

export const addFilterCleaning = async (c: Context) => {
  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { cleaned, date } = c.body as any;

  const filterCleaning = await FilterCleaning.create({
    cleaned: stringToBoolean(cleaned),
    date: date || new Date().toISOString(),
  });

  if (!filterCleaning) {
    c.set.status = 400;
    throw new Error("ข้อมูลไม่ถูกต้อง");
  }

  c.set.status = 201;
  return {
    status: c.set.status,
    success: true,
    data: filterCleaning,
    message: "บันทึกข้อมูลการทำความสะอาดเครื่องกรองสำเร็จ",
  };
};

export const getFilterCleanings = async (c: Context) => {
  const filterCleanings = await FilterCleaning.find().sort({ date: -1 });

  if (!filterCleanings || filterCleanings.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบข้อมูลการทำความสะอาดเครื่องกรอง");
  }

  return {
    status: c.set.status,
    success: true,
    data: filterCleanings,
    message: "ดึงข้อมูลการทำความสะอาดเครื่องกรองสำเร็จ",
  };
};
