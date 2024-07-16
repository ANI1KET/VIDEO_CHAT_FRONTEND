import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// interface a {}
// interface b extends a {}

// type a = {};
// type b = a & {};

export type ConnectedUser = {
  socketId: string;
  userName: string;
};

// export type UserMessage =
//   | { type: "iceCandidate"; iceCandidate: RTCIceCandidate }
//   | { type: "offer"; offer: RTCSessionDescriptionInit }
//   | { type: "answer"; answer: RTCSessionDescriptionInit };

export interface CounterState {
  connectedUsers: ConnectedUser[];
}

const initialState: CounterState = {
  connectedUsers: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    ConnectedUsers: (state, action: PayloadAction<ConnectedUser[]>) => {
      state.connectedUsers = action.payload;
    },
  },
});

export const { ConnectedUsers } = userSlice.actions;

export default userSlice.reducer;
