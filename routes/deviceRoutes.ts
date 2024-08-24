import { Elysia, t } from 'elysia'
import {
  addDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from '~/controllers'
import { admin, auth } from '~/middlewares'

const deviceRoutes = (app: Elysia) => {
  app.group('/api/v1/devices', (app) =>
    app
      .post('/', addDevice, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          deviceId: t.String(),
          deviceName: t.String(),
          status: t.Optional(t.Union([t.Literal('connected'), t.Literal('disconnected')])),
          gpsStatus: t.Optional(t.Union([t.Literal('ready'), t.Literal('not_ready')])),
        }),
        detail: {
          tags: ['Device']
        }
      })
      .get('/', getAllDevices, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Device']
        }
      })
      .get('/:id', getDeviceById, {
        beforeHandle: (c) => auth(c),
        detail: {
          tags: ['Device']
        }
      })
      .put('/:id', updateDevice, {
        beforeHandle: (c) => admin(c),
        body: t.Object({
          deviceName: t.Optional(t.String()),
          status: t.Optional(t.Union([t.Literal('connected'), t.Literal('disconnected')])),
          gpsStatus: t.Optional(t.Union([t.Literal('ready'), t.Literal('not_ready')])),
        }),
        detail: {
          tags: ['Device']
        }
      })
      .delete('/:id', deleteDevice, {
        beforeHandle: (c) => admin(c),
        detail: {
          tags: ['Device']
        }
      })
  )
}

export default deviceRoutes as any
