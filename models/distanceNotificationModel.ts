import { Document, Schema, model } from "mongoose";

interface DistanceNotification {
  distance: number;
}

interface DistanceNotificationDoc extends DistanceNotification, Document {}

const distanceNotificationSchema = new Schema<DistanceNotificationDoc>(
  {
    distance: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export const DistanceNotification = model<DistanceNotificationDoc>(
  "DistanceNotification",
  distanceNotificationSchema
);
export default DistanceNotification;
