export {}

import { jwt } from '@elysiajs/jwt'
import { Context } from 'elysia'

declare global {
  type RegBody = {
    name: string
    password: string
    isAdmin?: boolean
    role?: string
    phone: string
  }

  type LoginBody = {
    email: string
    password: string
  }

  type UpdateBody = {
    name: string
    password: string
    phone: string
    address: string
    avatar: string
    lng: number
    lat: number
    role: string
    isAdmin: boolean
    email: string
  }
}