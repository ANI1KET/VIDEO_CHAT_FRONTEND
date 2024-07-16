"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SocketIO, { disconnectSocket, socketIo } from "@/app/utils/socketIo";
import { ConnectedUser, UserMessage } from "@/app/utils/types";

const StreamContent = () => {
  const router = useRouter();
  const userName = useSearchParams().get("username");
  const meetingId = useSearchParams().get("meetingId");

  if (!userName) {
    router.back();
  }

  const [boolean, setBoolean] = useState<Boolean>(false);

  const [localUser, setLocalUser] = useState<ConnectedUser>();
  const [remoteUsers, setRemoteUsers] = useState<ConnectedUser[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoStream = useRef<MediaStream | null>(null);
  const localVideoTrack = useRef<MediaStreamTrack | null>(null);
  const localAudioStream = useRef<MediaStream | null>(null);
  const localAudioTrack = useRef<MediaStreamTrack | null>(null);

  const RtcPeerConnection = useRef<{
    [key: string]: RTCPeerConnection | null;
  }>({});

  const remoteVideoRef = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const remoteAudioRef = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const remoteVideoStream = useRef<{
    [socketId: string]: MediaStream | null;
  }>({});
  const remoteAudioStream = useRef<{
    [socketId: string]: MediaStream | null;
  }>({});

  const processMedia = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      const videoTrack = videoStream.getVideoTracks()[0];
      videoTrack.enabled = true;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = videoStream;
        // videoRef.current.srcObject = new MediaStream([videoTrack]);
        // videoRef.current.srcObject = new MediaStream([videoStream.getVideoTracks()[0]]);
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const audioTrack = audioStream.getAudioTracks()[0];
      audioTrack.enabled = true;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = audioStream;
      }

      localVideoStream.current = videoStream;
      localVideoTrack.current = videoTrack;

      localAudioStream.current = audioStream;
      localAudioTrack.current = audioTrack;
      setBoolean(true);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    processMedia();
  }, []);

  useEffect(() => {
    const createConnection = async (socketId: string) => {
      const rtcPeerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun.l.google.com:5349" },
          { urls: "stun:stun1.l.google.com:3478" },
        ],
      });

      if (localVideoTrack.current && localVideoStream.current) {
        rtcPeerConnection.addTrack(
          localVideoTrack.current,
          localVideoStream.current
        );
      }

      if (localAudioTrack.current && localAudioStream.current) {
        rtcPeerConnection.addTrack(
          localAudioTrack.current,
          localAudioStream.current
        );
      }

      rtcPeerConnection.onnegotiationneeded = async function (event) {
        if (RtcPeerConnection.current[socketId]) {
          const offer = await RtcPeerConnection.current[
            socketId
          ]?.createOffer();
          await RtcPeerConnection.current[socketId]?.setLocalDescription(offer);
          socketIo?.emit("SDPSetUp", {
            message: JSON.stringify({
              offer: offer,
              // offer: RtcPeerConnection.current[socketId]?.localDescription,
            }),
            socketId,
          });
        }
      };

      rtcPeerConnection.onicecandidate = function (event) {
        if (event.candidate) {
          socketIo?.emit("SDPSetUp", {
            message: JSON.stringify({ iceCandidate: event.candidate }),
            socketId,
          });
        }
      };

      rtcPeerConnection.ontrack = function (event) {
        if (!remoteVideoStream.current[socketId]) {
          const newVideoStream = new MediaStream();
          remoteVideoStream.current[socketId] = newVideoStream;
        }
        if (!remoteAudioStream.current[socketId]) {
          const newAudioStream = new MediaStream();
          remoteAudioStream.current[socketId] = newAudioStream;
        }

        if (event.track.kind == "video") {
          remoteVideoStream.current[socketId]
            ?.getTracks()
            .forEach((track) =>
              remoteVideoStream.current[socketId]?.removeTrack(track)
            );
          remoteVideoStream.current[socketId]?.addTrack(event.track);

          if (remoteVideoRef.current[socketId]) {
            remoteVideoRef.current[socketId]!.srcObject =
              remoteVideoStream.current[socketId];
            remoteVideoRef.current[socketId]?.load();
          }
        } else if (event.track.kind == "audio") {
          remoteAudioStream.current[socketId]
            ?.getTracks()
            .forEach((track) =>
              remoteAudioStream.current[socketId]?.removeTrack(track)
            );
          remoteAudioStream.current[socketId]?.addTrack(event.track);

          if (remoteAudioRef.current[socketId]) {
            remoteAudioRef.current[socketId]!.srcObject =
              remoteAudioStream.current[socketId];
            remoteAudioRef.current[socketId]?.load();
          }
        }
      };

      RtcPeerConnection.current[socketId] = rtcPeerConnection;
    };

    if (boolean && userName && meetingId) {
      if (!socketIo) {
        SocketIO(`${process.env.NEXT_PUBLIC_BASE_URL}`, userName, meetingId);
      }

      socketIo?.on("connect", async () => {
        console.log("Connected to Socket.IO server ", socketIo?.id);
        if (socketIo?.id && userName) {
          setLocalUser({ socketId: socketIo?.id, userName: userName });
        }
      });

      socketIo?.on("Notify_User", async (ConnectedUsers: ConnectedUser) => {
        setRemoteUsers([...remoteUsers, ConnectedUsers]);

        // await createConnection(ConnectedUsers.socketId);
      });

      socketIo?.on(
        "Connected_User",
        async (ConnectedUsers: ConnectedUser[]) => {
          setRemoteUsers([...remoteUsers, ...ConnectedUsers]);

          ConnectedUsers.forEach(async (user) => {
            await createConnection(user.socketId);
          });
        }
      );

      socketIo?.on(
        "SDPSetUp",
        async ({ message, from }: { message: string; from: string }) => {
          const userMessage: UserMessage = JSON.parse(message);

          switch (Object.keys(userMessage)[0]) {
            case "iceCandidate":
              if (!RtcPeerConnection.current[from]) {
                await createConnection(from);
              }
              try {
                await RtcPeerConnection.current[from]?.addIceCandidate(
                  new RTCIceCandidate(userMessage.iceCandidate)
                );
              } catch (error) {
                console.log(error);
              }
              break;
            case "offer":
              if (!RtcPeerConnection.current[from]) {
                await createConnection(from);
              }
              try {
                await RtcPeerConnection.current[from]?.setRemoteDescription(
                  new RTCSessionDescription(userMessage.offer)
                );
                const answer = await RtcPeerConnection.current[
                  from
                ]?.createAnswer();
                await RtcPeerConnection.current[from]?.setLocalDescription(
                  answer
                );

                socketIo?.emit("SDPSetUp", {
                  message: JSON.stringify({ answer: answer }),
                  socketId: from,
                });
              } catch (error) {
                console.error(
                  "Error setting remote description or creating answer:",
                  error
                );
              }
              break;
            case "answer":
              await RtcPeerConnection.current[from]?.setRemoteDescription(
                new RTCSessionDescription(userMessage.answer)
              );
              break;
          }
        }
      );

      socketIo?.on("Notify_User_Disconnect", (socketId: string) => {
        RtcPeerConnection.current[socketId]?.close();
        RtcPeerConnection.current[socketId] = null;

        if (remoteVideoRef.current[socketId]) {
          remoteVideoRef.current[socketId]!.srcObject = null;
          remoteVideoRef.current[socketId] = null;
        }
        if (remoteAudioRef.current[socketId]) {
          remoteAudioRef.current[socketId]!.srcObject = null;
          remoteAudioRef.current[socketId] = null;
        }

        if (remoteVideoStream.current[socketId]) {
          remoteVideoStream.current[socketId]?.getTracks().forEach((track) => {
            track.stop();
          });
          remoteVideoStream.current[socketId] = null;
        }

        if (remoteAudioStream.current[socketId]) {
          remoteAudioStream.current[socketId]?.getTracks().forEach((track) => {
            track.stop();
          });
          remoteAudioStream.current[socketId] = null;
        }

        setRemoteUsers((prevUsers) =>
          prevUsers.filter((user) => user.socketId !== socketId)
        );
      });
      return () => {
        socketIo?.off("connect");
        socketIo?.off("SDPSetUp");
        socketIo?.off("Notify_User");
        socketIo?.off("Connected_Users");
        socketIo?.off("Notify_User_Disconnect");
      };
    }
  }, [RtcPeerConnection, boolean, meetingId, remoteUsers, userName]);

  useEffect(() => {
    return () => {
      disconnectSocket();

      if (localVideoTrack.current) {
        localVideoTrack.current.stop();
        localVideoTrack.current = null;
      }
      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current = null;
      }

      if (localVideoStream.current) {
        localVideoStream.current.getTracks().forEach((track) => track.stop());
        localVideoStream.current = null;
      }
      if (localAudioStream.current) {
        localAudioStream.current.getTracks().forEach((track) => track.stop());
        localAudioStream.current = null;
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (localAudioRef.current) localAudioRef.current.srcObject = null;
    };
  }, []);
  return (
    <div className="flex justify-center items-center p-4 min-h-screen">
      <div
        className="grid gap-4 bg-gray-800 rounded-lg max-w-screen-lg shadow-lg overflow-hidden p-4 mx-auto"
        style={{
          gridTemplateColumns:
            remoteUsers.length > 0 ? `repeat(2, 1fr)` : `1fr`,
        }}
      >
        <div className={`flex flex-col items-center`}>
          <h5 className="text-white text-lg font-bold mb-2">
            {localUser && localUser.userName}
          </h5>
          <div className="relative">
            <video
              className="rounded-lg shadow-md"
              ref={localVideoRef}
              width="100%"
              height="100%"
              autoPlay
              // controls
            >
              Your browser does not support the video tag.
            </video>
            <audio
              ref={localAudioRef}
              style={{ display: "none" }}
              autoPlay
              // controls
            >
              Your browser does not support the video tag.
            </audio>
          </div>
        </div>
        {remoteUsers.map((userData, index) => {
          return (
            <div
              key={userData.socketId}
              className={`flex flex-col items-center ${
                remoteUsers.length % 2 === 0 && index === remoteUsers.length - 1
                  ? "transform translate-x-1/2"
                  : ""
              }`}
            >
              <h5 className="text-white text-lg font-bold mb-2">
                {userData.userName}
              </h5>
              <div className="relative">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRef.current[userData.socketId] = el;
                      // el.srcObject =
                      //   remoteVideoStream.current[userData.socketId];
                    }
                  }}
                  className="rounded-lg shadow-md"
                  width="100%"
                  height="100%"
                  autoPlay
                  // controls
                >
                  Your browser does not support the video tag.
                </video>
                <audio
                  ref={(el) => {
                    if (el) {
                      remoteAudioRef.current[userData.socketId] = el;
                      // el.srcObject =
                      //   remoteAudioStream.current[userData.socketId];
                    }
                  }}
                  style={{ display: "none" }}
                  autoPlay
                  // controls
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Stream = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <StreamContent />
  </Suspense>
);

export default Stream;
