const ModbusRTU = require("modbus-serial");
const { client, connectModbus, disconnectModbus, readModbusOnce } = require("../modbusClient");
const config = require("../config");
const { killProcess } = require("../processManager");
const { logMessage } = require("../logger");

// Mock external dependencies
jest.mock("../processManager", () => ({
  killProcess: jest.fn().mockResolvedValue({ err: null, stdout: "Killed" })
}));

jest.mock("../logger", () => ({
  logMessage: jest.fn()
}));

describe("Modbus Client Module Tests", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock ModbusRTU methods
    const mockClose = jest.fn().mockResolvedValue();
    const mockDestroy = jest.fn();
    const mockRemoveAllListeners = jest.fn();
    
    // Set up client methods
    client.connectTCP = jest.fn().mockResolvedValue();
    client.setID = jest.fn();
    client.close = mockClose;
    client.readHoldingRegisters = jest.fn().mockResolvedValue({ data: [123] });
    client._client = { destroy: mockDestroy };
    client.removeAllListeners = mockRemoveAllListeners;
    
    // Set initial state
    client.isOpen = true;
    global.failCount = 0;
  });

  test("connectModbus ควรเชื่อมต่อสำเร็จและเรียก setID ด้วยค่าที่ถูกต้อง", async () => {
    const result = await connectModbus();
    
    expect(client.connectTCP).toHaveBeenCalledWith(
      config.host,
      { port: config.port }
    );
    expect(client.setID).toHaveBeenCalledWith(config.unitId);
    expect(result).toBe(true);
  });

  test("connectModbus ควรคืนค่า false เมื่อเชื่อมต่อล้มเหลว", async () => {
    client.connectTCP.mockRejectedValueOnce(new Error("Connection failed"));
    
    const result = await connectModbus();
    
    expect(client.connectTCP).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test("disconnectModbus ควรเรียก close, destroy, และ removeAllListeners", async () => {
    await disconnectModbus();
    
    // ตรวจสอบว่า methods ถูกเรียกตามลำดับ
    expect(client.close).toHaveBeenCalled();
    expect(client._client.destroy).toHaveBeenCalled();
    expect(client.removeAllListeners).toHaveBeenCalled();
  });

  test("readModbusOnce ควรอ่านข้อมูลเมื่อเชื่อมต่อสำเร็จ", async () => {
    // Spy on connectModbus
    const connectSpy = jest.spyOn(client, 'connectTCP').mockResolvedValue();
    
    await readModbusOnce();
    
    expect(client.readHoldingRegisters).toHaveBeenCalledWith(config.address, 1);
    // ตรวจสอบว่ามีการเรียก disconnectModbus ซึ่งจะเรียก close ภายใน
    expect(client.close).toHaveBeenCalled();
    
    connectSpy.mockRestore();
  });

  test("readModbusOnce ควรเรียก killProcess เมื่อเชื่อมต่อล้มเหลวและ failCount >= retries", async () => {
    // Mock failed connection
    const connectSpy = jest.spyOn(client, 'connectTCP')
      .mockRejectedValue(new Error("Connection failed"));
    
    // Set config for immediate kill
    const originalRetries = config.retries;
    config.retries = 0;
    config.programToKill = "notepad.exe";
    
    await readModbusOnce();
    
    // ตรวจสอบการเรียก killProcess
    expect(killProcess).toHaveBeenCalledWith("notepad.exe");
    // ตรวจสอบว่ามีการเรียก disconnectModbus
    expect(client.close).toHaveBeenCalled();
    
    // Restore original values
    config.retries = originalRetries;
    connectSpy.mockRestore();
  });
});