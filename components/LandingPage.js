import React, { useState } from "react";

export default function LandingPage({ setRoom }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setRoom(value);
      }}
      className="flex flex-col  align-middle justify-center gap-y-5"
    >
      <label className="text-center font-mono text-2xl">Enter Room Name</label>

      <input
        className=" border-2 border-green-700 p-2 font-mono rounded-md focus:outline-none"
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="shadow-lg hover:bg-green-800 border rounded-md bg-green-600 text-white p-2 font-mono "
        onClick={(e) => {
          e.preventDefault();
          setRoom(value);
        }}
      >
        Enter Room
      </button>
    </form>
  );
}
