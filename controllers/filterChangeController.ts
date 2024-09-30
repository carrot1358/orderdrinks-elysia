import { Context } from "elysia";
import FilterChange from "~/models/filterChangeModel";

const stringToBoolean = (value: string): boolean => {
  return value.toLowerCase() === "true";
};

export const addFilterChange = async (c: Context) => {
  if (!c.body) throw new Error("ไม่มีข้อมูลที่ส่งมา");

  const { smallFilter, membraneFilter, other, date } = c.body as any;

  const filterChange = await FilterChange.create({
    smallFilter: stringToBoolean(smallFilter),
    membraneFilter: stringToBoolean(membraneFilter),
    other,
    date: date || new Date().toISOString(),
  });

  if (!filterChange) {
    c.set.status = 400;
    throw new Error("ข้อมูลไม่ถูกต้อง");
  }

  c.set.status = 201;
  return {
    status: c.set.status,
    success: true,
    data: filterChange,
    message: "บันทึกข้อมูลการเปลี่ยนไส้กรองสำเร็จ",
  };
};

export const getFilterChanges = async (c: Context) => {
  const filterChanges = await FilterChange.find().sort({ date: -1 });

  if (!filterChanges || filterChanges.length === 0) {
    c.set.status = 404;
    throw new Error("ไม่พบข้อมูลการเปลี่ยนไส้กรอง");
  }

  return {
    status: c.set.status,
    success: true,
    data: filterChanges,
    message: "ดึงข้อมูลการเปลี่ยนไส้กรองสำเร็จ",
  };
};

export const deleteFilterChange = async (c: Context) => {
  const { id } = c.params as any;
  const filterChange = await FilterChange.findByIdAndDelete(id);

  if (!filterChange) {
    c.set.status = 404;
    throw new Error("ไม่พบข้อมูลการเปลี่ยนไส้กรอง");
  }

  return {
    status: c.set.status,
    success: true,
    data: filterChange,
    message: "ลบข้อมูลการเปลี่ยนไส้กรองสำเร็จ",
  };
};
