import { Context } from "elysia";
import FilterRefill from "~/models/filterRefillModel";

const stringToBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  else if (value === "true" || value === "1") return true;
  else if (value === "false" || value === "0") return false;
};

export const addFilterRefill = async (c: Context) => {
  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { iodine, carbon, resin, manganese, sodaAsh, other, date } =
    c.body as any;

  const filterRefill = await FilterRefill.create({
    iodine: stringToBoolean(iodine),
    carbon: stringToBoolean(carbon),
    resin: stringToBoolean(resin),
    manganese: stringToBoolean(manganese),
    sodaAsh: stringToBoolean(sodaAsh),
    other,
    date: date || new Date().toISOString(),
  });

  if (!filterRefill) {
    c.set.status = 400;
    throw new Error("ข้อมูลไม่ถูกต้อง");
  }

  c.set.status = 201;
  return {
    status: c.set.status,
    success: true,
    data: filterRefill,
    message: "บันทึกข้อมูลการเติมสารกรองสำเร็จ",
  };
};

export const getFilterRefills = async (c: Context) => {
  const filterRefills = await FilterRefill.find().sort({ date: -1 });

  if (!filterRefills || filterRefills.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบข้อมูลการเติมสารกรอง");
  }

  return {
    status: c.set.status,
    success: true,
    data: filterRefills,
    message: "ดึงข้อมูลการเติมสารกรองสำเร็จ",
  };
};
