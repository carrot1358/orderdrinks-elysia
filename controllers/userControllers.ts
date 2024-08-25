import {Context} from 'elysia'
import {User} from '~/models'
import {jwt} from '~/utils'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'

interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role: string;
}

interface FileUpload {
    name: string;
    size: number;
    arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * @api [POST] /api/v1/users
 * @description สร้างผู้ใช้ใหม่
 * @action สาธารณะ
 */
export const createUser = async (c: Context) => {
    //   Check for body
    if (!c.body) throw new Error('No body provided')

    const {name, password, isAdmin, role, phone} = c.body as RegBody

    const phoneExists = await User.findOne({phone})
    if (phoneExists) {
        c.set.status = 400
        throw new Error('Phone number already exists!')
    }

    // Generate a unique userId
    const userId = randomUUID()

    // Create user
    const _user = await User.create({
        userId,
        name,
        password,
        phone,
        isAdmin,
        role: role || 'user',
    })

    if (!_user) {
        c.set.status = 400
        throw new Error('Invalid user data!')
    }

    // Generate token
    const accessToken = await jwt.sign({
        data: {userId: _user.userId, isAdmin: _user.isAdmin, role: _user.role},
    })

    // Return success response
    c.set.status = 201
    return {
        status: c.set.status,
        success: true,
        data: {accessToken},
        message: 'User created successfully',
    }
}

/**
 * @api [POST] /api/v1/users/login
 * @description เข้าสู่ระบบ
 * @action สาธารณะ
 */
export const loginUser = async (c: Context) => {
    //   Check for body
    if (!c.body) throw new Error('No body provided')

    const {email, password} = c.body as LoginBody

    if (!email || !password) throw new Error('Invalid email or password!')

    // Check for user
    const user = await User.findOne({email})
    if (!user) {
        c.set.status = 401
        throw new Error('Invalid email or password!')
    }

    // Check for password
    const isMatch = await user.mathPassword(password)
    if (!isMatch) {
        c.set.status = 401
        throw new Error('Invalid email or password!')
    }

    // Generate token
    const accessToken = await jwt.sign({
        data: {userId: user.userId, isAdmin: user.isAdmin, role: user.role},
    })

    // Return success response
    return {
        status: c.set.status,
        success: true,
        data: {accessToken},
        message: 'User logged in successfully',
    }
}

/**
 * @api [GET] /api/v1/users
 * @description ดึงข้อมูลผู้ใช้ทั้งหมด
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const getUsers = async (c: Context) => {
    const users = await User.find().select('-password')

    // Check for users
    if (!users || users.length === 0) {
        c.set.status = 404
        throw new Error('No users found!')
    }

    // Return success response
    return {
        status: c.set.status,
        success: true,
        data: users,
        message: 'Users fetched successfully',
    }
}

/**
 * @api [GET] /api/v1/users/:id
 * @description ดึงข้อมูลผู้ใช้ตาม ID
 * @action เฉพาะผู้ดูแลระบบ (admin) หรือผู้ใช้ที่ร้องขอเอง
 */
export const getUser = async (c: Context<{ params: { id: string } }>) => {
    if (!c.params?.id) {
        c.set.status = 400
        throw new Error('ไม่ได้ระบุ ID')
    }

    // ดึง token จาก header
    let token
    if (c.headers.authorization && c.headers.authorization.startsWith('Bearer')) {
        token = c.headers.authorization.split(' ')[1]
    }

    if (!token) {
        c.set.status = 401
        throw new Error('ไม่พบ token')
    }

    // ถอดรหัส token เพื่อดึง userId
    const decoded = await jwt.verify(token) as { sub: string, data: DecodedToken }
    console.log("decoded", decoded)
    const requestingUserId = decoded.sub

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await User.findOne({userId: c.params.id}).select('-password')
    console.log("user", user)

    if (!user) {
        c.set.status = 404
        throw new Error('ไม่พบผู้ใช้')
    }

    // ตรวจสอบว่าผู้ใช้ที่ร้องขอเป็นเจ้าของข้อมูลหรือเป็นผู้ดูแลระบบ
    if (requestingUserId !== user.userId && !decoded.data.isAdmin) {
        c.set.status = 403
        throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้')
    }

    return {
        status: c.set.status,
        success: true,
        data: user,
        message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
    }
}

/**
 * @api [GET] /api/v1/users/profile
 * @description ดึงข้อมูลโปรไฟล์ผู้ใช้
 * @action ต้องผ่านการยืนยันตัวตน (auth)
 */
export const getUserProfile = async (c: Context) => {
    // Get user id from token
    let token, userId
    if (c.headers.authorization && c.headers.authorization.startsWith('Bearer')) {
        token = c.headers.authorization.split(' ')[1]
        const decoded = await jwt.verify(token) as { data: DecodedToken }
        userId = decoded.data.userId
    }

    // Check for user
    const user = await User.findOne({userId: userId}).select('-password')

    if (!user) {
        c.set.status = 404
        throw new Error('User not found!')
    }

    return {
        status: c.set.status,
        success: true,
        data: user,
        message: 'Profile fetched successfully',
    }
}

/**
 * @api [PUT] /api/v1/users/:id
 * @description อัปเดตข้อมูลผู้ใช้
 * @action เเฉพาะผู้ดูแลระบบ (admin) หรือผู้ใช้ที่ร้องขอเอง
 */
export const updateUser = async (c: Context<{ params: { id: string } }>) => {

    // ดึง token จาก header
    var token
    if (c.headers.authorization && c.headers.authorization.startsWith('Bearer')) {
        token = c.headers.authorization.split(' ')[1]
    }

    if (c.params && !c.params?.id) {
        c.set.status = 400
        throw new Error('ไม่ได้ระบุ ID')
    }

    //   เช็คว่ามีข้อมูลหรือไม่
    if (!c.body) throw new Error('ไม่มีข้อมูลที่ส่งมา')

    const {name, password, email, phone, address, avatar, role, isAdmin, lng, lat} = c.body as UpdateBody

    // ตรวจสอบว่ามี token หรือไม่
    if (!token) {
        c.set.status = 401
        throw new Error('ไม่พบ token')
    }

    // ตรวจสอบว่ามีสิทธิ์หรือไม่
    const decoded = await jwt.verify(token) as { data: DecodedToken }
    const requestingUserId = decoded.data.userId
    const requestingUser = await User.findOne({userId: requestingUserId})
    if(!requestingUser || requestingUser.role !== 'admin' && requestingUser.userId !== c.params.id){
        c.set.status = 403
        throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้')
    }

    // เช็คผู้ใช้ว่ามีอยู่หรือไม่
    const user = await User.findOne({ userId: c.params.id })
    if (!user) {
        c.set.status = 404
        throw new Error('ไม่พบผู้ใช้')
    }

    // อัปเดตข้อมูลผู้ใช้
    user.name = name || user.name
    user.email = email || user.email
    if (password) {
        user.password = password
    }
    user.phone = phone || user.phone
    user.address = address || user.address
    
    if(role && isAdmin){
        if(requestingUser.role !== 'admin'){
            c.set.status = 403
            throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูล isAdmin หรือ role ของผู้ใช้นี้')
        }else{
            user.role = role as "admin" | "driver" | "manager" | "user"
            user.isAdmin = isAdmin
        }
    }
    
    if(lng && lat){
        user.lng = lng
        user.lat = lat
    }


   

    // จัดการกับไฟล์ avatar
    if (avatar && typeof avatar === 'object' && 'size' in avatar) {
        const fileUpload = avatar as FileUpload;
        const uploadDir = join(process.cwd(), 'image', 'avatars')
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error: any) {
            if (error.code !== 'EEXIST') {
                console.error('ไม่สามารถสร้างไดเรกทอรีสำหรับเก็บ avatar ได้:', error)
                throw new Error('เกิดข้อผิดพลาดในการอัปโหลด avatar')
            }
        }

        const fileExtension = fileUpload.name.split('.').pop()
        const fileName = `${user.userId}.${fileExtension}`
        const filePath = join(uploadDir, fileName)

        try {
            const buffer = Buffer.from(await fileUpload.arrayBuffer())
            await writeFile(filePath, buffer)
            user.avatar = `/image/avatars/${fileName}`
        } catch (error) {
            console.error('ไม่สามารถบันทึกไฟล์ avatar ได้:', error)
            throw new Error('เกิดข้อผิดพลาดในการอัปโหลด avatar')
        }
    }

    const updatedUser = await user.save()

    if (!updatedUser) {
        c.set.status = 400
        throw new Error('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้')
    }

    // Return success response
    return {
        status: c.set.status,
        success: true,
        data: updatedUser,
        message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
    }
}

/**
 * @api [DELETE] /api/v1/users/:id
 * @description ลบผู้ใช้
 * @action เฉพาะผู้ดูแลระบบ (admin)
 */
export const deleteUser = async (c: Context<{ params: { id: string } }>) => {
    if (c.params && !c.params?.id) {
        c.set.status = 400
        throw new Error('No id provided')
    }

    // ลบผู้ใช้
    const user = await User.findOne({userId: c.params.id})
    if(!user) throw new Error('User not found')

    await user.deleteOne()

    return {
        status: c.set.status,
        success: true,
        message: 'User deleted successfully',
    }
}