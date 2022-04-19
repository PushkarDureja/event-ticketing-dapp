const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
  networks: {
    develop: {
      port: 8545,
    },
  },
  contracts_build_directory: path.join(__dirname, "client", "src", "contracts"),
  compilers: {
    solc: {
      version: "0.7.6",
    },
  },
};
