export {}

import { jwt } from '@elysiajs/jwt'
import { Context } from 'elysia'

declare global {
  type RegBody = {
    name: string
    email: string
    password: string
    isAdmin?: boolean
    role?: string
  }

  type LoginBody = {
    email: string
    password: string
  }

  type UpdateBody = {} & Partial<RegBody>
}