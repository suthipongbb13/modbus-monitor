require("dotenv").config();

const config = {
  host: process.env.MODBUS_HOST || "127.0.0.1",
  port: parseInt(process.env.MODBUS_PORT, 10) || 502,
  unitId: parseInt(process.env.MODBUS_UNIT_ID, 10) || 1,
  address: parseInt(process.env.MODBUS_ADDRESS, 10) || 0,
  retries: parseInt(process.env.MODBUS_RETRIES, 10) || 3,
  readInterval: parseInt(process.env.MODBUS_READ_INTERVAL, 10) || 2000,
  programToKill: process.env.PROGRAM_TO_KILL || "notepad.exe",
  logFile: process.env.LOG_FILE || "modbus.log",
  maxLogSize: parseInt(process.env.MAX_LOG_SIZE, 10) || 5 * 1024 * 1024,
  maxBackupFiles: parseInt(process.env.MAX_BACKUP_FILES, 10) || 10,
};

module.exports = config;
