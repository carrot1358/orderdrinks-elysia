import { Context } from "elysia";
import Payment from "~/models/paymentModel";

export const createDefaultPayment = async () => {
  const paymentExists = await Payment.findOne();
  if (!paymentExists) {
    await Payment.create({
      typePromtpay: "phone",
      numberPromtpay: "",
    });
  }
};

export const getPayment = async (c: Context) => {
  const payment = await Payment.find();
  return {
    status: 200,
    success: true,
    data: payment,
    message: "ดึงข้อมูลการชำระเงินสำเร็จ",
  };
};

export const updatePayment = async (c: Context) => {
  const { typePromtpay, numberPromtpay } = c.body as {
    typePromtpay: string;
    numberPromtpay: string;
  };

  const payment = await Payment.updateOne({
    typePromtpay,
    numberPromtpay,
  });
  return {
    status: 200,
    success: true,
    data: payment,
    message: "อัปเดตข้อมูลการชำระเงินสำเร็จ",
  };
};
