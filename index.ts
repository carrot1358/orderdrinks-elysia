import { Elysia } from 'elysia'
//
import { userRoutes, productRoutes, deviceRoutes } from './routes'
import { error, logger } from './middlewares'
import { connectDB } from './config'
import { swagger } from '@elysiajs/swagger'


// Create Elysia instance
const app = new Elysia()

// Config MongoDB
connectDB()

// Middlewares
app.use(swagger({
  documentation: {
    info: {
      title: 'Elysia API',
      version: '1.0.0'
    },
    tags: [
      { name: 'User', description: 'User endpoints' },
      { name: 'Product', description: 'Product endpoints' },
      { name: 'Device', description: 'Device endpoints' }
    ]
  }
}))
app.use(logger())
app.use(error())


// Root Routes
app.get('/', () => 'Welcome to our API')

// User Routes [api/v1/users]
app.use(userRoutes)

// Product Routes [api/v1/products]
app.use(productRoutes)

// Device Routes [api/v1/devices]
app.use(deviceRoutes)


// Start the server
app.listen(Bun.env.PORT || 9000)

const hostname = app.server?.hostname || 'localhost'
const port = app.server?.port || 9000
const url = `http://${hostname}:${port}`

console.log(
  `🚀 Server is running at \u001b]8;;${url}\u001b\\${url}\u001b]8;;\u001b\\`
)