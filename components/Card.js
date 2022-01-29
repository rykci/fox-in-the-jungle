import React from "react";

export default function Card({ card }) {
  return card ? (
    <div className="border p-3">
      {card.value} {card.suit}
    </div>
  ) : (
    <></>
  );
}
