import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';

class SocketService {
    public socket: Socket | null = null;
  
    public connect(
      url: string,
      token: string
    ): Promise<Socket<DefaultEventsMap, DefaultEventsMap>> {
      return new Promise((resolve, reject) => {
        this.socket = io(url, {
          auth: {
            token: token
          }
        });
  
        if (!this.socket) return reject("Socket initialization failed");
  
        this.socket.on("connect", () => {
          console.log('connected');
          resolve(this.socket as Socket);
        });
  
        this.socket.on("connect_error", (err) => {
          console.log("Connection error: ", err);
          reject(err);
        });
      });
    }
  
    public disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null; // Optionally reset the socket to null after disconnecting
        console.log('Disconnected');
      }
    }
  }
  
  export default new SocketService();
  