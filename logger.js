const fs = require("fs");
const config = require("./config");

const manageLogSize = () => {
  if (fs.existsSync(config.logFile)) {
    const stats = fs.statSync(config.logFile);
    if (stats.size > config.maxLogSize) {
      const backupFile = `${config.logFile}.${Date.now()}.bak`;
      fs.renameSync(config.logFile, backupFile);
      cleanupOldLogs();
    }
  }
};

const cleanupOldLogs = () => {
  const logFiles = fs
    .readdirSync(".")
    .filter(file => file.startsWith(config.logFile) && file.endsWith(".bak"));
  if (logFiles.length > config.maxBackupFiles) {
    logFiles.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
    const filesToDelete = logFiles.slice(0, logFiles.length - config.maxBackupFiles);
    filesToDelete.forEach(file => {
      fs.unlinkSync(file);
    });
  }
};

const logMessage = (message) => {
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry.trim());
  manageLogSize();
  fs.appendFileSync(config.logFile, logEntry, { flag: "a" });
};

module.exports = { logMessage, manageLogSize, cleanupOldLogs };
