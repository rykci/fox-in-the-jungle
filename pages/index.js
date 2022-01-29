import Head from "next/head";
import { useState, useEffect } from "react";
import LandingPage from "../components/LandingPage";
import Room from "../components/Room";

import { io } from "socket.io-client";

export default function Home() {
  const [room, setRoom] = useState();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(`https://fox-jungle.herokuapp.com/`);
    setSocket(newSocket);

    newSocket.on("room full", (data) => {
      alert(data);
      setRoom();
    });

    return () => newSocket.close();
  }, [setSocket]);

  return (
    <div className=" min-h-screen min-w-[50vw] flex flex-col items-center justify-center h-min py-2">
      <Head>
        <title>Fox in the Jungle</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-w-fit font-mono text-3xl font-bold absolute top-2">
        🦊 Fox in the Jungle 🌴
      </div>

      {room ? (
        <Room socket={socket} room={room} />
      ) : (
        <LandingPage setRoom={setRoom} />
      )}

      <footer className="absolute bottom-2 items-center justify-center w-full text-xs font-mono flex">
        By Ricky Yuen
      </footer>
    </div>
  );
}
