const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: `*`,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const Game = require("./Game");

const updateGame = async (io, room, gameState) => {
  gameState.turn = gameState.turn ? 0 : 1;

  if (gameState.playedCards.length == 2) {
    //wait a bit
    await delay(3000);
    //compare cards
    const trickWinnerIndex = Game.compare(
      gameState.playedCards[0].card,
      gameState.playedCards[1].card,
      gameState.trump
    )
      ? 0
      : 1;
    const trickLoserIndex = (trickWinnerIndex - 1) * -1;

    // for now change turn, should change to trick winner
    const winnerPlayerIndex =
      gameState.playedCards[trickWinnerIndex].playerIndex;

    gameState.tricksWon[winnerPlayerIndex]++;

    // for #7 effect
    gameState.playedCards.forEach((cardObject) => {
      if (cardObject.card.value == 7) gameState.points[winnerPlayerIndex]++;
    });

    // for #1 effect (see who leads next trick)
    if (gameState.playedCards[trickLoserIndex].card.value == 1) {
      gameState.turn = gameState.playedCards[trickLoserIndex].playerIndex;
    } else {
      gameState.turn = winnerPlayerIndex;
    }

    //send to grave
    gameState.graveyard.push(gameState.playedCards.pop().card);
    gameState.graveyard.push(gameState.playedCards.pop().card);

    // end of round
    if (gameState.graveyard.length == 26) {
      gameState = Game.newRound(gameState);

      if (gameState.points[0] >= 21 || gameState.points[1] >= 21) {
        io.to(room).emit("game over", gameState);
      } else {
        io.to(room).emit("new round", gameState);
      }
    }
  }

  io.to(room).emit("update game", gameState);
};

/*
room = {
name: room name,
users: [,]
gameState: {}
}
*/
let Room = [];

io.on("connection", (socket) => {
  socket.on("join room", (data) => {
    let roomIndex = Room.findIndex((room) => room.name === data.roomName);

    if (roomIndex >= 0) {
      // check if there is space for user to join room
      if (Room[roomIndex].users.length < 2) {
        socket.join(data.roomName);
        if (!Room[roomIndex].users.includes(socket.id)) {
          Room[roomIndex].users.push(data.id);
          console.log(`${data.id} joined room ${data.roomName}`);
        }
      } else {
        socket.emit("room full", "room is full");
      }

      // check if user was last person to join
      if (Room[roomIndex].users.length == 2) {
        Room[roomIndex] = Game.newGame(
          Room[roomIndex].users,
          Room[roomIndex].name
        );

        io.to(data.roomName).emit("start game", Room[roomIndex]);
      }
    } else {
      // create new room
      socket.join(data.roomName);
      Room.push({ name: data.roomName, users: [data.id], gameState: {} });
      console.log(`${data.id} created room ${data.roomName}`);
    }
  });

  //TODO
  socket.on(
    "play card",
    async ({ room, playerIndex, cardIndex, card, gameState }) => {
      //remove card from hand
      gameState.hands[playerIndex].splice(cardIndex, 1);

      //add card to playedCards
      gameState.playedCards.push({
        playerIndex: playerIndex,
        card: card,
      });

      if (card.value == 3) {
        gameState.hands[playerIndex].push(gameState.trump);
        gameState.trump = {};

        socket.emit("3 effect", gameState);
        return;
      } else if (card.value == 5) {
        gameState.hands[playerIndex].push(gameState.deck.shift());
        socket.emit("5 effect", gameState);

        return;
      }

      io.to(room).emit("update game", gameState);

      await updateGame(io, room, gameState);
    }
  );

  socket.on(
    "discard card",
    async ({ room, playerIndex, cardIndex, card, gameState }) => {
      //remove card from hand
      gameState.hands[playerIndex].splice(cardIndex, 1);

      // for #3 effect
      if (
        gameState.playedCards[gameState.playedCards.length - 1].card.value == 3
      ) {
        gameState.trump = card;
      } else {
        // for #5 effect
        gameState.deck.push(card);
      }

      gameState.hands[playerIndex] = Game.sortCards(
        gameState.hands[playerIndex]
      );

      //contine with playcard
      await updateGame(io, room, gameState);
    }
  );

  socket.on("disconnect", () => {
    let roomIndex = Room.findIndex((room) => room.users.includes(socket.id));

    if (roomIndex >= 0) {
      console.log(`${socket.id} left room ${Room[roomIndex].name}`);
      Room[roomIndex].users = Room[roomIndex].users.filter(
        (id) => id != socket.id
      );

      console.log(Room[roomIndex].users);
    }

    console.log(`${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(process.env.PORT || 5000, () => {
  console.log("listening on ", PORT);
});
