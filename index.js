require("dotenv").config();
const ModbusRTU = require("modbus-serial");
const { exec } = require("child_process");
const fs = require("fs");

const client = new ModbusRTU();
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
};

let failCount = 0;

const logMessage = (message) => {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(logEntry.trim());
    manageLogSize();
    fs.appendFileSync(config.logFile, logEntry, { flag: "a" });
};

const manageLogSize = () => {
    if (fs.existsSync(config.logFile)) {
        const stats = fs.statSync(config.logFile);
        if (stats.size > config.maxLogSize) {
            fs.renameSync(config.logFile, `${config.logFile}.${Date.now()}.bak`);
        }
    }
};

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

const killProcess = (program) => {
    return new Promise((resolve) => {
        exec(`taskkill /IM ${program} /F`, (err, stdout) => {
            logMessage(err ? `⚠️ Error terminating process: ${err.message}` : stdout.trim());
            resolve();
        });
    });
};

const readModbus = async () => {
    while (true) {
        try {
            if (await connectModbus()) {
                let data = await client.readHoldingRegisters(config.address, 1);
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
        await new Promise((resolve) => setTimeout(resolve, config.readInterval));
    }
};

// 🏁 Start process
readModbus().catch((err) => logMessage(`❌ Unhandled Error: ${err.message}`));
