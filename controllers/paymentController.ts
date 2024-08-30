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
  try {
    const payment = await Payment.find();
    return {
      status: 200,
      success: true,
      data: payment,
      message: "ดึงข้อมูลการชำระเงินสำเร็จ",
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: "ดึงข้อมูลการชำระเงินไม่สำเร็จ" + error,
    };
  }
};

export const updatePayment = async (c: Context) => {
  const { typePromtpay, numberPromtpay } = c.body as {
    typePromtpay: string;
    numberPromtpay: string;
  };

  if (typePromtpay === "phone") {
    if (!numberPromtpay) {
      return {
        status: 400,
        success: false,
        message: "กรุณาระบุหมายเลขโทรศัพท์",
      };
    } else if (numberPromtpay.length !== 10) {
      return {
        status: 400,
        success: false,
        message: "หมายเลขโทรศัพท์ต้องมี 10 หลัก",
      };
    }
  } else if (typePromtpay === "idCard") {
    if (!numberPromtpay) {
      return {
        status: 400,
        success: false,
        message: "กรุณาระบุหมายเลขบัตรประชาชน",
      };
    } else if (numberPromtpay.length !== 13) {
      return {
        status: 400,
        success: false,
        message: "หมายเลขบัตรประชาชนต้องมี 13 หลัก",
      };
    }
  }

  try {
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
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: "อัปเดตข้อมูลการชำระเงินไม่สำเร็จ" + error,
    };
  }
};
