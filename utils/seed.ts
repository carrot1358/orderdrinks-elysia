import { User, Order, Product } from "~/models";
import { randomUUID } from "crypto";

const khonkaenArea = {
  center: {
    lat: 16.4321,
    lng: 102.8236,
  },
  radius: 0.1,
};

// ข้อมูลสำหรับสุ่มชื่อ
const thaiNames = {
  firstNames: [
    "สมชาย",
    "สมหญิง",
    "วิชัย",
    "วันดี",
    "ประเสริฐ",
    "มานี",
    "สุดา",
    "ชัยวัฒน์",
    "นภา",
    "ธนพล",
    "พิมพ์ใจ",
    "อนุชา",
    "รัตนา",
    "ภูวดล",
  ],
  lastNames: [
    "ใจดี",
    "รักเรียน",
    "มั่นคง",
    "สุขสบาย",
    "รุ่งเรือง",
    "ศรีสุข",
    "พรหมมา",
    "วงศ์ใหญ่",
    "ดวงดี",
    "มีสุข",
    "แสนสุข",
    "ทองดี",
    "จันทร์เพ็ญ",
  ],
};

function getRandomName() {
  const firstName =
    thaiNames.firstNames[
      Math.floor(Math.random() * thaiNames.firstNames.length)
    ];
  const lastName =
    thaiNames.lastNames[Math.floor(Math.random() * thaiNames.lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomPhone() {
  return `08${Math.floor(Math.random() * 10)}${Math.random()
    .toString()
    .slice(2, 9)}`;
}

function getRandomAddress() {
  const houseNumber = Math.floor(Math.random() * 999) + 1;
  const streets = [
    "ถ.มิตรภาพ",
    "ถ.ศรีจันทร์",
    "ถ.กสิกรทุ่งสร้าง",
    "ถ.หน้าเมือง",
    "ถ.ชาตะผดุง",
  ];
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${houseNumber} ${street} ต.ในเมือง อ.เมือง จ.ขอนแก่น`;
}

function getRandomLocation(
  center: typeof khonkaenArea.center,
  radiusKm: number
) {
  const r = radiusKm * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  return {
    lat: center.lat + r * Math.cos(theta),
    lng: center.lng + r * Math.sin(theta),
  };
}

// ข้อมูลสินค้าเทียม (คงเดิม)
const mockProducts = [
  {
    productId: randomUUID(),
    name: "น้ำดื่ม ขนาด 600ml",
    price: 7,
    stock: 100,
    description: "น้ำดื่มสะอาด บรรจุขวด PET ขนาด 600ml",
    isAvailable: true,
    imagePath: "https://picsum.photos/400/400?random=1",
  },
  {
    productId: randomUUID(),
    name: "น้ำดื่ม ขนาด 1.5L",
    price: 13,
    stock: 100,
    description: "น้ำดื่มสะอาด บรรจุขวด PET ขนาด 1.5 ลิตร",
    isAvailable: true,
    imagePath: "https://picsum.photos/400/400?random=2",
  },
];

// เพิ่มผู้ใช้พิเศษ
const specialUsers = [
  {
    userId: randomUUID(),
    name: "Admin User",
    phone: "_admin",
    password: "1234",
    address: "ขอนแก่น",
    role: "admin",
    isAdmin: true,
    lat: khonkaenArea.center.lat,
    lng: khonkaenArea.center.lng,
  },
  {
    userId: randomUUID(),
    name: "Driver User",
    phone: "_driver",
    password: "1234",
    address: "ขอนแก่น",
    role: "driver",
    isAdmin: false,
    lat: khonkaenArea.center.lat,
    lng: khonkaenArea.center.lng,
  },
  {
    userId: randomUUID(),
    name: "Test User",
    phone: "_user",
    password: "1234",
    address: "ขอนแก่น",
    role: "user",
    isAdmin: false,
    lat: khonkaenArea.center.lat,
    lng: khonkaenArea.center.lng,
  },
];

export async function seedDatabase(
  userCount: number = 3,
  orderCount: number = 10
) {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // สร้างผู้ใช้ติเศษ
    const createdSpecialUsers = await Promise.all(
      specialUsers.map((user) => User.create(user))
    );

    // สร้างผู้ใช้ทั่วไปตามจำนวนที่กำหนด
    const mockUsers = Array(userCount)
      .fill(null)
      .map(() => ({
        userId: randomUUID(),
        name: getRandomName(),
        phone: getRandomPhone(),
        password: "password",
        address: getRandomAddress(),
        role: "user",
        isAdmin: false,
      }));

    const createdNormalUsers = await Promise.all(
      mockUsers.map(async (user) => {
        const location = getRandomLocation(
          khonkaenArea.center,
          khonkaenArea.radius
        );
        return await User.create({
          ...user,
          lat: location.lat,
          lng: location.lng,
        });
      })
    );

    // รวมผู้ใช้ทั้งหมด
    const allUsers = [...createdSpecialUsers, ...createdNormalUsers];

    const createdProducts = await Promise.all(
      mockProducts.map((product) => Product.create(product))
    );

    // สร้างออเดอร์ตามจำนวนที่กำหนด
    const paymentMethods = ["cash", "promptpay"];
    const paymentStatuses = ["not_paid", "paid"];

    const mockOrders = Array(orderCount)
      .fill(null)
      .map(() => {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;

        // สุ้าง products array ที่มี reference ถูกต้อง
        const products = [{
          productId: randomProduct.productId, // ใช้ productId จาก MongoDB
          quantity: quantity
        }];

        return {
          orderId: randomUUID(),
          userId: randomUser.userId, // ใช้ userId จาก MongoDB
          products: products,
          totalPrice: randomProduct.price * quantity,
          methodPaid: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          statusPaid: Math.random() > 0.5 ? "paid" : "not_paid",
          deliverStatus: "pending"
        };
      });

    // ใช้ create แทน insertMany เพื่อให้ Mongoose จัดการ references
    const createdOrders = await Promise.all(
      mockOrders.map(order => Order.create(order))
    );

    console.log(
      `เพิ่มข้อมูลเทียมสำเร็จ (ผู้ใช้: ${userCount} คน, ออเดอร์: ${orderCount} รายการ)`
    );
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูลเทียม:", error);
    return false;
  }
}
