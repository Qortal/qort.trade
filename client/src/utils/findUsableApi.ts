import axios from 'axios';

const apiEndpoints = [
  "https://api.qortal.org",
  "https://api2.qortal.org",
  "https://appnode.qortal.org",
  "https://apinode.qortalnodes.live",
  "https://apinode1.qortalnodes.live",
  "https://apinode2.qortalnodes.live",
  "https://apinode3.qortalnodes.live",
  "https://apinode4.qortalnodes.live",
];

export const findUsableApi = async () => {
  for (const endpoint of apiEndpoints) {
    try {
      const response = await axios.get(`${endpoint}/admin/status`, { timeout: 3000 });
      const data = response.data;
      if (data.isSynchronizing === false && data.syncPercent === 100) {
        return endpoint;
      } else {
        console.log(`API not ready: ${endpoint}`);
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.log(`Timeout reached for API ${endpoint}`);
      } else {
        console.error(`Error checking API ${endpoint}:`, error);
      }
    }
  }

  throw new Error("No usable API found");
}