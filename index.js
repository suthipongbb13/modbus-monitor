const { readModbus } = require("./modbusClient");

// เรียกใช้ readModbus เฉพาะเมื่อไฟล์นี้ถูกเรียกโดยตรง
if (require.main === module) {
  readModbus().catch((err) => console.error(`Unhandled Error: ${err.message}`));
}
