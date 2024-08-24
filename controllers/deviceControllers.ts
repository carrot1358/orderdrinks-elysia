import { Context } from 'elysia'
import { Device } from '~/models'

/**
 * @api [POST] /api/v1/devices
 * @description เพิ่มอุปกรณ์ใหม่
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const addDevice = async (c: Context) => {
  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const { deviceId, deviceName, status, gpsStatus } = c.body as any

  const device = await Device.create({
    deviceId,
    deviceName,
    status,
    gpsStatus,
  })

  if (!device) {
    c.set.status = 400
    throw new Error('ข้อมูลอุปกรณ์ไม่ถูกต้อง')
  }

  c.set.status = 201
  return {
    status: c.set.status,
    success: true,
    data: device,
    message: 'เพิ่มอุปกรณ์สำเร็จ',
  }
}

/**
 * @api [GET] /api/v1/devices
 * @description ดึงข้อมูลอุปกรณ์ทั้งหมด
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getAllDevices = async (c: Context) => {
  const devices = await Device.find()

  if (!devices || devices.length === 0) {
    c.set.status = 404
    throw new Error('ไม่พบอุปกรณ์')
  }

  return {
    status: c.set.status,
    success: true,
    data: devices,
    message: 'ดึงข้อมูลอุปกรณ์ทั้งหมดสำเร็จ',
  }
}

/**
 * @api [GET] /api/v1/devices/:id
 * @description ดึงข้อมูลอุปกรณ์ตาม ID
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getDeviceById = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID อุปกรณ์')
  }

  const device = await Device.findOne({ deviceId: c.params.id })

  if (!device) {
    c.set.status = 404
    throw new Error('ไม่พบอุปกรณ์')
  }

  return {
    status: c.set.status,
    success: true,
    data: device,
    message: 'ดึงข้อมูลอุปกรณ์สำเร็จ',
  }
}

/**
 * @api [PUT] /api/v1/devices/:id
 * @description อัปเดตข้อมูลอุปกรณ์
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const updateDevice = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID อุปกรณ์')
  }

  if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

  const device = await Device.findOneAndUpdate({ deviceId: c.params.id }, c.body, { new: true })

  if (!device) {
    c.set.status = 404
    throw new Error('ไม่พบอุปกรณ์')
  }

  return {
    status: c.set.status,
    success: true,
    data: device,
    message: 'อัปเดตอุปกรณ์สำเร็จ',
  }
}

/**
 * @api [DELETE] /api/v1/devices/:id
 * @description ลบอุปกรณ์
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const deleteDevice = async (c: Context<{ params: { id: string } }>) => {
  if (!c.params?.id) {
    c.set.status = 400
    throw new Error('ไม่ได้ระบุ ID อุปกรณ์')
  }

  const device = await Device.findOneAndDelete({ deviceId: c.params.id })

  if (!device) {
    c.set.status = 404
    throw new Error('ไม่พบอุปกรณ์')
  }

  return {
    status: c.set.status,
    success: true,
    data: {},
    message: 'ลบอุปกรณ์สำเร็จ',
  }
}