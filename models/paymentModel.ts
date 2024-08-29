import { Document, Schema, model } from 'mongoose';

interface Payment {
  typePromtpay: 'phone' | 'idCard';
  numberPromtpay: string;
}

interface PaymentDoc extends Payment, Document {}

const paymentSchema = new Schema<PaymentDoc>(
  {
    typePromtpay: { type: String, enum: ['phone', 'idCard'], required: true },
    numberPromtpay: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const Payment = model<PaymentDoc>('Payment', paymentSchema);
export default Payment;
