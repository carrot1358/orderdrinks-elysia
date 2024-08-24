import { Document, Schema, model } from 'mongoose'

interface User {
  userId: string
  name: string
  email: string
  password: string
  isAdmin: boolean
  role: 'admin' | 'driver' | 'manager' | 'user'
  lineId: string
  avatar: string
}

interface UserDoc extends User, Document {
  mathPassword: (pass: string) => Promise<boolean>
}

const userSchema = new Schema<UserDoc>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    role: { 
      type: String, 
      required: true, 
      enum: ['admin', 'driver', 'manager', 'user'],
      default: 'user' 
    },
    lineId: { type: String },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
)

// Match user entered password to hashed password in database
userSchema.methods.mathPassword = async function (enteredPassword: string) {
  return Bun.password.verifySync(enteredPassword, this.password)
}

// Hash password with Bun
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  // use bcrypt
  this.password = await Bun.password.hash(this.password, {
    algorithm: 'bcrypt',
    cost: 4, // number between 4-31
  })
})

// random userId
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    this.userId = crypto.randomUUID()
  }
  next()
})

const User = model<UserDoc>('User', userSchema)
export default User