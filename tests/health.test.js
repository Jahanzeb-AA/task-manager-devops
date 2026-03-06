const fs = require("fs");

try {
  const serverFile = fs.readFileSync("server.js", "utf8");

  if (serverFile.includes("express") && serverFile.includes("app.listen")) {
    console.log("Test passed: server.js looks valid.");
    process.exit(0);
  } else {
    console.error("Test failed: server.js is missing expected content.");
    process.exit(1);
  }
} catch (error) {
  console.error("Test failed:", error.message);
  process.exit(1);
}