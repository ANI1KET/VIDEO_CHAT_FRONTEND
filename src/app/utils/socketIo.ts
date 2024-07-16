import io, { Socket } from "socket.io-client";

let socketIo: Socket | null;

const SocketIO = (url: string, userName: string, meetingId: string): Socket => {
  socketIo = io(url, {
    query: { username: userName, meetingId: meetingId },
  });

  return socketIo;
};

const disconnectSocket = () => {
  if (socketIo) {
    socketIo.disconnect();
    socketIo = null;
  }
};

export default SocketIO;
export { socketIo, disconnectSocket };
