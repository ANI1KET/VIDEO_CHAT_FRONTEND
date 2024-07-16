"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const Join = () => {
  const router = useRouter();
  const meetingidRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!meetingidRef.current || meetingidRef.current.value.length !== 8) {
      setMessage("Please enter correct meeting ID");
      return;
    }
    router.push(`/meeting?meetingId=${meetingidRef.current.value}`);
  };
  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        className="bg-white p-8 rounded-lg shadow-lg w-80"
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <button
          className="flex items-center mb-6 text-teal-500 hover:text-teal-700 transition"
          onClick={async () => {
            router.push(`/`);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-move-left"
          >
            <path d="M6 8L2 12L6 16" />
            <path d="M2 12H22" />
          </svg>
          <span className="ml-2">Back</span>
        </button>

        <div className="mb-6">
          {message && <p className="text-red-500">{message}</p>}
          <div className="flex items-center border-b-2 border-gray-300 focus-within:border-teal-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ee2020"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-presentation mr-2"
            >
              <path d="M2 3h20" />
              <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
              <path d="m7 21 5-5 5 5" />
            </svg>
            <input
              type="text"
              placeholder="Meeting ID"
              className="flex-grow p-2 outline-none"
              ref={meetingidRef}
              onKeyDown={handleKeyPress}
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center w-full bg-teal-500 text-white px-4 py-2 rounded-full hover:bg-teal-600 transition"
        >
          Join
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#17ee42"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-send-horizontal ml-2"
          >
            <path d="m3 3 3 9-3 9 19-9Z" />
            <path d="M6 12h16" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Join;
