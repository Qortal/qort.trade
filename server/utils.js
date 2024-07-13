const axios = require('axios');

const apiEndpoints = [
  "https://appnode.qortal.org",
  "https://api.qortal.org",
  "https://api2.qortal.org",
  "https://apinode.qortalnodes.live",
  "https://apinode1.qortalnodes.live",
  "https://apinode2.qortalnodes.live",
  "https://apinode3.qortalnodes.live",
  "https://apinode4.qortalnodes.live",
];

const findUsableApi = async() => {
    for (const endpoint of apiEndpoints) {
      try {
        // Set timeout to 3000 milliseconds (3 seconds)
        const response = await axios.get(`${endpoint}/admin/status`, { timeout: 3000 });
        const data = response.data;
        if (data.isSynchronizing === false && data.syncPercent === 100) {
          console.log(`Usable API found: ${endpoint}`);
          return endpoint;
        } else {
          console.log(`API not ready: ${endpoint}`);
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log(`Timeout reached for API ${endpoint}`);
        } else {
          console.error(`Error checking API ${endpoint}:`, error);
        }
      }
    }
  
    throw new Error("No usable API found");
  }

  module.exports = { findUsableApi };