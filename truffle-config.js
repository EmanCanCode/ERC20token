require('babel-register');
require('babel-polyfill');
require('dotenv').config();

module.exports = {

  networks: {
    devolpment: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" //you can match any network 
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
}
