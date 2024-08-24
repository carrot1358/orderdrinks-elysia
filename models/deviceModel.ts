import { Document, Schema, model } from 'mongoose'

interface Device {
  deviceId: string
  deviceName: string
  status: 'connected' | 'disconnected'
  gpsStatus: 'ready' | 'not_ready'
  latitude: number
  longitude: number
}

interface DeviceDoc extends Device, Document {}

const deviceSchema = new Schema<DeviceDoc>(
  {
    deviceId: { type: String, unique: true , default: crypto.randomUUID(), index: true},
    deviceName: { type: String, required: true },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
    gpsStatus: { type: String, enum: ['ready', 'not_ready'], default: 'not_ready' },
    latitude: { type: Number },
    longitude: { type: Number},
  },
  {
    timestamps: true,
  }
)


const Device = model<DeviceDoc>('Device', deviceSchema)
export default Device
