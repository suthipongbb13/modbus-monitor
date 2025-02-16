const { killProcess } = require("../processManager");
const child_process = require("child_process");

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("Process Manager Module Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("killProcess ควรเรียก exec ด้วยคำสั่งที่ถูกต้องและคืนค่า stdout เมื่อสำเร็จ", async () => {
    // จำลอง exec ให้เรียก callback โดยไม่มี error และคืน stdout ที่ต้องการ
    child_process.exec.mockImplementation((cmd, callback) => {
      callback(null, "Process terminated");
    });
    
    const result = await killProcess("dummy.exe");
    
    expect(child_process.exec).toHaveBeenCalledWith(
      "taskkill /IM dummy.exe /F",
      expect.any(Function)
    );
    expect(result).toEqual({ err: null, stdout: "Process terminated" });
  });
});
