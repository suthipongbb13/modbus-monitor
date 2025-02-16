const fs = require("fs");
const { logMessage, manageLogSize, cleanupOldLogs } = require("../logger");
const config = require("../config");

jest.mock("fs");

describe("Logger Module Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("logMessage ควรเขียน log ด้วยข้อความที่ถูกต้อง", () => {
    const fakeTime = "2/16/2025, 12:00:00 PM";
    // จำลอง Date ให้คืนค่า fakeTime
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue(fakeTime);
    
    logMessage("Test log");

    const expectedLogEntry = `[${fakeTime}] Test log\n`;
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      config.logFile,
      expectedLogEntry,
      { flag: "a" }
    );
  });

  test("manageLogSize ควรเรียก fs.renameSync เมื่อขนาด log file เกิน maxLogSize", () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: config.maxLogSize + 1 });
    fs.readdirSync.mockReturnValue([]);
    
    manageLogSize();
    
    expect(fs.renameSync).toHaveBeenCalled();
  });

  test("cleanupOldLogs ควรลบ backup log เก่าเกินจำนวน maxBackupFiles", () => {
    // ตั้ง maxBackupFiles ให้ 3 เพื่อความชัดเจนในการทดสอบ
    config.maxBackupFiles = 3;
    fs.readdirSync.mockReturnValue([
      "modbus.log.1.bak",
      "modbus.log.2.bak",
      "modbus.log.3.bak",
      "modbus.log.4.bak",
      "modbus.log.5.bak"
    ]);
    // จำลองเวลาของไฟล์จากชื่อ (ส่วน mtimeMs)
    fs.statSync.mockImplementation((file) => ({ mtimeMs: Number(file.split(".")[2]) }));
    
    cleanupOldLogs();
    
    // คาดว่า backup เก่าเกิน 3 จะถูกลบออก จำนวนที่ลบควรเป็น 2
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
  });
});
