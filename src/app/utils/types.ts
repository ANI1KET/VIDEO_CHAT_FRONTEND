// // interface a {}
// // interface b extends a {}

// // type a = {};
// // type b = a & {};

export type ConnectedUser = {
  socketId: string;
  userName: string;
};

export type UserMessage = {
  iceCandidate: RTCIceCandidate;
  offer: RTCSessionDescriptionInit;
  answer: RTCSessionDescriptionInit;
};
