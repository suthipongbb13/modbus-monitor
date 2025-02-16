const ModbusRTU = require("modbus-serial");
const config = require("./config");
const { logMessage } = require("./logger");
const { killProcess } = require("./processManager");

const client = new ModbusRTU();
let failCount = 0;

const connectModbus = async () => {
  try {
    await client.connectTCP(config.host, { port: config.port });
    client.setID(config.unitId);
    logMessage("✅ Connected to Modbus successfully!");
    return true;
  } catch (error) {
    logMessage(`❌ Failed to connect to Modbus: ${error.message}`);
    return false;
  }
};

const disconnectModbus = async () => {
  try {
    if (client.isOpen) await client.close();
    client._client?.destroy();
    client.removeAllListeners();
    logMessage("🔌 Disconnected from Modbus.");
  } catch (error) {
    logMessage(`⚠️ Error during disconnection: ${error.message}`);
  }
};

// ฟังก์ชันรอบเดียวสำหรับอ่านข้อมูลจาก Modbus
const readModbusOnce = async () => {
  try {
    if (await connectModbus()) {
      const data = await client.readHoldingRegisters(config.address, 1);
      logMessage(`📥 Modbus Data: ${data.data}`);
      failCount = 0;
    } else {
      logMessage(`🚨 Connection attempt failed (Attempt ${++failCount})`);
      if (failCount >= config.retries) {
        logMessage(`⚠️ Failed ${config.retries} times. Restarting connection...`);
        await killProcess(config.programToKill);
        failCount = 0;
      }
    }
  } catch (error) {
    logMessage(`❌ Unhandled Error in readModbus(): ${error.message}`);
  } finally {
    await disconnectModbus();
  }
};

const readModbus = async () => {
  while (true) {
    await readModbusOnce();
    await new Promise((resolve) => setTimeout(resolve, config.readInterval));
  }
};

module.exports = { client, connectModbus, disconnectModbus, readModbusOnce, readModbus };
