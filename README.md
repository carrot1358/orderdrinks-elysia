# ส่วนประกอบของโครงการ

### Git FrontEnd VueJS : [[GitLab](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-vuejs)] [[GitHub](https://github.com/carrot1358/orderdrinks-vuejs)]

### Git BackEnd Elysia : [[GitLab](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-elysia)] [[GitHub](https://github.com/carrot1358/orderdrinks-elysia)] (คุณอยู่ที่นี่)

### Git สำหรับ Hardware(Raspberry Pi) : [[GitLab](https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-hw.git)]

# การติดตั้งและการตั้งค่า

## 1. สำหรับการทำงานบน Localhost

1.1 ติดตั้ง Bun จากที่นี่ : [คลิก](https://bun.sh/docs/installation)

1.2 ติดตั้งตัวจัดการฐานข้อมูล MongoDB จากที่นี่ : [คลิก](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)

1.3 โคลนโปรเจ็คนี้จาก GitLab

      ```bash
      git clone https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-elysia.git
      cd orderdrinks-elysia
      ```

1.4 เปลี่ยนชื่อไฟล์ .env.example เป็น .env และตั้งค่าตามต้องการ

1.5 เริ่มโปรเจ็คด้วยคำสั่ง
`bash
      bun dev
      `

## 2. สำหรับการทำงานบน Docker

2.1 โคลนโปรเจ็คนี้จาก GitLab

```bash
git clone https://gitlab.eng.rmuti.ac.th/nattapad.sa/orderdrinks-elysia.git
cd orderdrinks-elysia
```

2.2 สร้างไฟล์ `.env` และตั้งค่าตามต้องการ

2.3 Build docker-compose

```bash
docker-compose up -d --build
```

2.4 ตรวจสอบการทำงานของ Docker

```bash
docker logs orderdrinks-elysia
```
