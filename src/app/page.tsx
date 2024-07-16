"use client";

import { useRouter } from "next/navigation";
// import { usePathname } from "next/navigation";

// import { increment } from "./store/slices/userSlice";
// import { useAppDispatch, useAppSelector } from "./store/hooks/hooks";

const Home: React.FC = () => {
  const router = useRouter();
  //   const pathname = usePathname();

  //   const dispatch = useAppDispatch();
  //   const count = useAppSelector((state) => state.user.value);
  return (
    <div className="main-wrap flex justify-center items-center min-h-screen">
      <div className="flex justify-center items-center p-8 space-x-12">
        <button
          className="flex justify-center items-center bg-teal-700 text-white h-12 w-48 text-lg rounded-md hover:bg-teal-800 transition"
          onClick={() => {
            const idNum = Math.floor(Math.random() * 100000000);
            router.push(`/meeting?meetingId=${idNum}`);
          }}
        >
          Host
        </button>
        <button
          className="flex justify-center items-center bg-teal-700 text-white h-12 w-48 text-lg rounded-md hover:bg-teal-800 transition"
          onClick={() => {
            router.push(`/join`);
          }}
        >
          Join
        </button>
      </div>
    </div>
  );
};

export default Home;
