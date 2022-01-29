import React, { useState, useEffect } from "react";
import Card from "./Card";
import Hand from "./Hand";
import Image from "next/image";

export default function Room({ socket, room }) {
  const [gameState, setGameState] = useState();
  const [playerIndex, setPlayerIndex] = useState(0);
  const [effectActive, setEffectActive] = useState(0);
  const [showRef, setShowRef] = useState(false);

  const discardCard = (card, cardPosition) => {
    socket.emit("discard card", {
      room: room,
      playerIndex: playerIndex,
      cardIndex: cardPosition,
      card: card,
      gameState: gameState,
    });

    setEffectActive(0);
  };

  const playCard = (card, cardPosition) => {
    const otherCard = gameState.playedCards.find(
      (playedCard) => playedCard.playerIndex != playerIndex
    )?.card;

    // allowed to click
    if (gameState.turn == playerIndex) {
      // TODO: need to clean the code here
      let validCards = gameState.hands[playerIndex];

      if (otherCard) {
        validCards = validCards.filter(
          (cardInHand) => cardInHand.suit == otherCard.suit
        );

        // for #11 effect
        if (otherCard.value == 11) {
          validCards = [
            validCards.pop(),
            ...validCards.filter((cardInHand) => cardInHand.value == 1),
          ];

          validCards = validCards.filter((x) => Boolean(x));
        }
      }

      if (validCards.length == 0) validCards = gameState.hands[playerIndex];

      if (!validCards.includes(card)) {
        alert("You cannot play this card");
      } else {
        socket.emit("play card", {
          room: room,
          playerIndex: playerIndex,
          cardIndex: cardPosition,
          card: card,
          gameState: gameState,
        });
      }
    }
  };

  useEffect(() => {
    socket.emit("join room", { id: socket.id, roomName: room });

    //socket.on("test", (data) => console.log(data));

    socket.on("start game", (data) => {
      setGameState(data.gameState);
      setPlayerIndex(data.users.findIndex((id) => id === socket.id));
    });

    socket.on("3 effect", (state) => {
      setGameState(state);
      alert("pick up trump card. select a card to replace it with");
      setEffectActive(3);
    });

    socket.on("5 effect", (state) => {
      setGameState(state);
      alert("draw 1 card. select a card to place at the bottom of the deck");
      setEffectActive(5);
    });

    socket.on("new round", (state) => {
      alert("new round!");
    });

    socket.on("game over", (state) => {
      alert("game over");
    });

    socket.on("update game", (state) => {
      setGameState(state);
    });
  }, [socket, room]);

  return (
    <div className="flex flex-col justify-center text-center ">
      <div className="absolute top-2 left-4 font-mono">
        <button onClick={() => setShowRef(!showRef)}>INFO </button>
      </div>
      <div className=" font-mono absolute top-2 right-4 text-sm font-semibold">
        {room}
      </div>
      {showRef ? (
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -mt-[25vh] -ml-[25vw]">
          <Image
            src="/reference.jpeg"
            alt="Picture of Card Effects and Scoring"
            layout="fill"
          />
        </div>
      ) : (
        <></>
      )}

      {gameState ? (
        <div className="flex flex-col min-h-[50vh] justify-around">
          <div className="flex flex-row justify-center text-center">
            {gameState.graveyard.map((graveCard) => (
              <div>
                {graveCard.value}
                {graveCard.suit},
              </div>
            ))}
          </div>
          <div className="flex flex-row">
            <div className="font-semibold text-2xl pl-8">You</div>
            <div className="font-semibold text-2xl ml-auto pr-8">Opponent</div>
          </div>
          <div className="flex flex-row">
            <div className="flex flex-row gap-x-4 pl-10">
              <div>
                <div className="font-semibold text-2xl">Points</div>
                <div className="font-semibold text-2xl">
                  {gameState.points[playerIndex]}
                </div>
              </div>
              <div>
                <div>Tricks</div>
                <div>{gameState.tricksWon[playerIndex]}</div>
              </div>
            </div>
            <div className="ml-auto flex flex-row-reverse gap-x-4 pr-10">
              <div>
                <div className="font-semibold text-2xl">Points</div>
                <div className="font-semibold text-2xl">
                  {gameState.points[(playerIndex - 1) * -1]}
                </div>
              </div>
              <div>
                <div>Tricks</div>
                <div>{gameState.tricksWon[(playerIndex - 1) * -1]}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center text-center max-w-1/2 mb-4">
            <div className="align-middle justify-center">Trump:</div>
            <Card card={gameState.trump} />
          </div>
          <div className="min-h-36 ">
            <Card
              card={
                gameState.playedCards.find(
                  (playedCard) => playedCard.playerIndex != playerIndex
                )?.card
              }
            />
            <div className="m-4">
              {gameState.playedCards.length == 2
                ? "Comparing..."
                : gameState.turn == playerIndex
                ? "Your Turn"
                : "Opponent's Turn"}
            </div>

            {gameState.playedCards.find(
              (playedCard) => playedCard.playerIndex == playerIndex
            ) ? (
              <Card
                card={
                  gameState.playedCards.find(
                    (playedCard) => playedCard.playerIndex == playerIndex
                  ).card
                }
              />
            ) : null}
          </div>
          <div className="mt-8">
            <Hand
              effectActive={effectActive}
              playCard={playCard}
              discardCard={discardCard}
              cards={gameState.hands[playerIndex]}
            />
          </div>
        </div>
      ) : (
        <div className="text-3xl font-mono">Waiting for Opponent...</div>
      )}
    </div>
  );
}
