const { exec } = require("child_process");
const { logMessage } = require("./logger");

const killProcess = (program) => {
  return new Promise((resolve) => {
    exec(`taskkill /IM ${program} /F`, (err, stdout) => {
      logMessage(err ? `⚠️ Error terminating process: ${err.message}` : stdout.trim());
      resolve({ err, stdout });
    });
  });
};

module.exports = { killProcess };
