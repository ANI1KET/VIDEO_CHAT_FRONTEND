"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SocketIO, { socketIo } from "@/app/utils/socketIo";

const Stream = () => {
  const router = useRouter();
  const userName = useSearchParams().get("username");
  const meetingId = useSearchParams().get("meetingId");

  const [boolean, setBoolean] = useState<Boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const RtcPeerConnection = useRef<RTCPeerConnection | null>(null);

  const VideoStream = useRef<MediaStream | null>(null);
  const VideoTrack = useRef<MediaStreamTrack | null>(null);
  const AudioStream = useRef<MediaStream | null>(null);
  const AudioTrack = useRef<MediaStreamTrack | null>(null);

  if (!userName) {
    router.back();
  }

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

      VideoStream.current = videoStream;
      VideoTrack.current = videoTrack;

      AudioStream.current = audioStream;
      AudioTrack.current = audioTrack;
      setBoolean(true);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    processMedia();
  }, []);
  useEffect(() => {
    const createConnection = async () => {
      const rtcPeerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun.l.google.com:5349" },
          { urls: "stun:stun1.l.google.com:3478" },
        ],
      });

      if (VideoTrack.current && VideoStream.current) {
        rtcPeerConnection.addTrack(VideoTrack.current, VideoStream.current);
      }

      if (AudioTrack.current && AudioStream.current) {
        rtcPeerConnection.addTrack(AudioTrack.current, AudioStream.current);
      }

      rtcPeerConnection.onnegotiationneeded = async function (event) {
        if (rtcPeerConnection) {
          const offer = await rtcPeerConnection.createOffer();
          await rtcPeerConnection.setLocalDescription(offer);
          socketIo?.emit("WebRTCSetUp", {
            message: JSON.stringify({
              offer: offer,
              // offer: rtcPeerConnection.localDescription,
            }),
            meetingId,
          });
        }
      };

      rtcPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketIo?.emit("WebRTCSetUp", {
            message: JSON.stringify({ iceCandidate: event.candidate }),
            meetingId,
          });
        }
      };

      rtcPeerConnection.ontrack = (event) => {
        if (event.track.kind === "video") {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        } else if (event.track.kind === "audio") {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        }
      };

      RtcPeerConnection.current = rtcPeerConnection;
    };

    if (boolean && meetingId) {
      //   SocketIO(`${process.env.NEXT_PUBLIC_BASE_URL}`, meetingId);

      socketIo?.on("connect", async () => {
        console.log("Connected to Socket.IO server ", socketIo?.id);
      });

      socketIo?.on("User_Joined", async () => {
        await createConnection();
      });

      socketIo?.on(
        "WebRTCSetUp",
        async ({
          message,
          meetingId,
        }: {
          message: string;
          meetingId: string;
        }) => {
          const userMessage = JSON.parse(message);

          switch (Object.keys(userMessage)[0]) {
            case "iceCandidate":
              if (!RtcPeerConnection.current) {
                await createConnection();
              }
              try {
                if (RtcPeerConnection.current)
                  await RtcPeerConnection.current.addIceCandidate(
                    new RTCIceCandidate(userMessage.iceCandidate)
                  );
              } catch (error) {
                console.log(error);
              }
              break;
            case "offer":
              if (!RtcPeerConnection.current) {
                await createConnection();
              }
              if (RtcPeerConnection.current) {
                await RtcPeerConnection.current.setRemoteDescription(
                  new RTCSessionDescription(userMessage.offer)
                );
                const answer = await RtcPeerConnection.current.createAnswer();
                await RtcPeerConnection.current.setLocalDescription(answer);
                socketIo?.emit("WebRTCSetUp", {
                  message: JSON.stringify({ answer: answer }),
                  meetingId,
                });
              }
              break;
            case "answer":
              if (RtcPeerConnection.current) {
                await RtcPeerConnection.current.setRemoteDescription(
                  new RTCSessionDescription(userMessage.answer)
                );
              }
              break;
          }
        }
      );

      return () => {
        socketIo?.off("connect");
        socketIo?.off("WebRTCSetUp");
        socketIo?.off("User_Joined");
      };
    }
  }, [
    boolean,
    AudioStream,
    AudioTrack,
    RtcPeerConnection,
    VideoStream,
    VideoTrack,
    meetingId,
    userName,
  ]);

  return (
    <div className="flex justify-center items-center p-4 min-h-screen">
      <div
        className="grid gap-4 bg-gray-800 rounded-lg max-w-screen-lg shadow-lg overflow-hidden p-4 mx-auto"
        style={{
          gridTemplateColumns: `repeat(2, 1fr)`,
        }}
      >
        <div className={`flex flex-col items-center`}>
          <h5 className="text-white text-lg font-bold mb-2">A</h5>
          <div className="relative">
            <video
              ref={localVideoRef}
              width="100%"
              height="100%"
              autoPlay
              controls
              className="rounded-lg shadow-md"
            >
              Your browser does not support the video tag.
            </video>
            <audio
              ref={localAudioRef}
              style={{ display: "none" }}
              autoPlay
              controls
            >
              Your browser does not support the video tag.
            </audio>
          </div>
        </div>
        <div className={`flex flex-col items-center`}>
          <h5 className="text-white text-lg font-bold mb-2">B</h5>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              width="100%"
              height="100%"
              autoPlay
              controls
              className="rounded-lg shadow-md"
            >
              Your browser does not support the video tag.
            </video>
            <audio
              ref={remoteAudioRef}
              style={{ display: "none" }}
              autoPlay
              controls
            >
              Your browser does not support the video tag.
            </audio>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stream;
