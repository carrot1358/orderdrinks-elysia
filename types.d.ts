export {}

import { jwt } from '@elysiajs/jwt'
import { Context } from 'elysia'
import { ObjectId } from 'mongoose'

declare global {
  type RegBody = {
    name: string
    password: string
    isAdmin?: boolean
    role?: string
    phone: string
  }

  type LoginBody = {
    phone: string
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

  type DecodedToken = {
    _id: ObjectId
    userId: string
    name: string
    phone: string
    isAdmin: boolean
    role: string
  }

  type FileUpload = {
    name: string;
    size: number;
    arrayBuffer(): Promise<ArrayBuffer>;
  }
}