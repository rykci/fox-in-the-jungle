import React from "react";
import Card from "./Card";

export default function Hand({ effectActive, playCard, discardCard, cards }) {
  const handleClick = (card, index) => {
    if (effectActive) {
      discardCard(card, index);
    } else {
      playCard(card, index);
    }
  };

  return (
    <div className="mt-auto w-screen">
      <div className="flex justify-center align-middle  w-screen">
        {cards.map((card, index) => (
          <div
            key={card.value + card.suit}
            className="hover:-translate-y-1/4"
            onClick={() => handleClick(card, index)}
          >
            <Card card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
