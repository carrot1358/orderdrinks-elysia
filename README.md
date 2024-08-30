# ส่วนประกอบของโครงการ

### Git FrontEnd VueJS : [คลิก](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-vuejs)

### Git BackEnd Elysia : [คลิก](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-elysia) (คุณอยู่ที่นี่)

### Git สำหรับ Hardware(Raspberry Pi) : [คลิก](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-hw.git)

# การติดตั้งและการตั้งค่า

2. ติดตั้ง Bun จากที่นี่ : [คลิก](https://bun.sh/docs/installation)

3. ติดตั้งตัวจัดการฐานข้อมูล MongoDB จากที่นี่ : [คลิก](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)

4. โคลนโปรเจ็คนี้จาก GitLab

   ```bash
   git clone https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-elysia.git
   cd orderdrinks-elysia
   ```

5. เปลี่ยนชื่อไฟล์ .env.example เป็น .env และตั้งค่าตามต้องการ

   ```env
   PORT=9000
   MONGO_URI=mongodb://localhost:27017/orderdrinks
   HOSTNAME=orderdrinks.webhop.me
   FONTEND_URL=http://localhost:3000

   # JWT
   JWT_SECRET=secret
   JWT_EXPIRE=7d

   # SlipOk
   BRANCH_ID = Your SlipOk Branch ID
   API_KEY = Your SlipOk API Key
   ```

6. เริ่มโปรเจ็คด้วยคำสั่ง
   ```bash
   bun dev
   ```
