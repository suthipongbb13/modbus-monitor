require("dotenv").config();
const ModbusRTU = require("modbus-serial");

// Mock ModbusRTU โดยกำหนดฟังก์ชันที่จำเป็นทั้งหมด
jest.mock("modbus-serial", () => {
  return jest.fn().mockImplementation(() => ({
    connectTCP: jest.fn().mockResolvedValue(),
    setID: jest.fn(),
    isOpen: true,
    close: jest.fn().mockResolvedValue(),
    readHoldingRegisters: jest.fn().mockResolvedValue({ data: [123] }),
    _client: { destroy: jest.fn() },
    removeAllListeners: jest.fn(),
  }));
});

const { connectModbus, disconnectModbus, client } = require("./index");

describe("Modbus Connection Tests", () => {
  beforeEach(() => {
    // ล้างการเรียกของ method ต่าง ๆ ก่อนแต่ละเทส
    client.connectTCP.mockClear();
    client.setID.mockClear();
    client.close.mockClear();
    client._client.destroy.mockClear();
    client.removeAllListeners.mockClear();
  });

  test("ควรเชื่อมต่อกับ Modbus Server ได้สำเร็จ", async () => {
    const result = await connectModbus();

    expect(client.connectTCP).toHaveBeenCalledWith(
      process.env.MODBUS_HOST || "127.0.0.1",
      { port: parseInt(process.env.MODBUS_PORT, 10) || 502 }
    );
    expect(client.setID).toHaveBeenCalledWith(
      parseInt(process.env.MODBUS_UNIT_ID, 10) || 1
    );
    expect(result).toBe(true);
  });

  test("ควรจัดการเมื่อการเชื่อมต่อล้มเหลว", async () => {
    client.connectTCP.mockRejectedValueOnce(new Error("Connection failed"));

    const result = await connectModbus();

    expect(client.connectTCP).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test("ควรปิดการเชื่อมต่อ Modbus ได้อย่างถูกต้อง", async () => {
    await disconnectModbus();

    expect(client.close).toHaveBeenCalled();
    expect(client._client.destroy).toHaveBeenCalled();
    expect(client.removeAllListeners).toHaveBeenCalled();
  });
});
