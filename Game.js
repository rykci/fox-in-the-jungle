let deck = [];

// lookup tables to build the deck
const suitLookup = (index) => {
  switch (index) {
    case 0:
      return "🗡";
    case 1:
      return "🏹";
    default:
      return "🛡";
  }
};

const nameLookup = (value) => {
  switch (value) {
    case 1:
      return "Swan";
    case 3:
      return "Fox";
    case 5:
      return "Woodcutter";
    case 7:
      return "Treasure";
    case 9:
      return "Witch";
    case 11:
      return "Monarch";
    default:
      return "";
  }
};

const descLookup = (value) => {
  switch (value) {
    case 1:
      return "If you play this and lose the trick, you lead the next trick.";
    case 3:
      return "When you play this, you may exchange the decree card with a card from your hand.";
    case 5:
      return "When you play this, draw one card, then return any one card to the bottom of the deck face down";
    case 7:
      return "Every 7 won is worth 1 point";
    case 9:
      return "When determining the winner of a trick with only one 9, treat that 9 as if it were the trump suit";
    case 11:
      return "When you lead this, if your opponent has this suit, they must play either the ace of this suit or their highest card of this suit.";
    default:
      return "";
  }
};

//build deck
for (let i = 0; i < 3; i++) {
  for (let j = 1; j <= 11; j++) {
    const card = {
      value: j,
      suit: suitLookup(i),
      name: nameLookup(j),
      desc: descLookup(j),
    };

    deck.push(card);
  }
}

const shuffleDeck = (deck) => {
  return deck
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

const sortCards = (cards) => {
  return cards.sort((a, b) => {
    if (a.suit === b.suit) {
      return a.value - b.value;
    }
    return a.suit > b.suit ? 1 : -1;
  });
};

module.exports = {
  deck: deck,

  shuffleDeck: shuffleDeck,

  sortCards: sortCards,

  newGame: (users, room) => {
    const shuffledDeck = shuffleDeck(deck);
    const startPlayer = Math.round(Math.random());

    return {
      users: users,
      name: room,
      gameState: {
        hands: [
          sortCards(shuffledDeck.slice(0, 13)),
          sortCards(shuffledDeck.slice(13, 26)),
        ],
        trump: shuffledDeck[26],
        deck: shuffledDeck.slice(27),
        playedCards: [],
        graveyard: [],
        tricksWon: [0, 0],
        points: [0, 0],
        dealer: startPlayer,
        turn: startPlayer,
      },
    };
  },

  newRound: (gameState) => {
    const shuffledDeck = shuffleDeck(deck);
    const nextDealer = (gameState.dealer - 1) * -1;

    gameState.tricksWon.forEach((tricks, i) => {
      if (tricks <= 3 || (tricks >= 7 && tricks <= 9)) {
        gameState.points[i] += 6;
      } else if (tricks >= 4 && tricks <= 6) {
        gameState.points[i] += tricks - 3;
      }
    });

    return {
      ...gameState,
      hands: [
        sortCards(shuffledDeck.slice(0, 13)),
        sortCards(shuffledDeck.slice(13, 26)),
      ],
      trump: shuffledDeck[26],
      deck: shuffledDeck.slice(27),
      playedCards: [],
      graveyard: [],
      tricksWon: [0, 0],
      dealer: nextDealer,
      turn: nextDealer,
    };
  },

  // return true if card1 wins
  compare: (card1, card2, trump) => {
    // for #9 effect
    const suit1 =
      card1.value == 9 && card2.value != 9 ? trump.suit : card1.suit;
    const suit2 =
      card2.value == 9 && card1.value != 9 ? trump.suit : card2.suit;

    // both trump
    if (suit1 == trump.suit && suit2 == trump.suit)
      return card1.value > card2.value;

    // card2 trump
    if (suit2 == trump.suit) return false;

    // card2 random suit
    if (suit2 != suit1) return true;

    // card2 same suit
    return card1.value > card2.value;
  },
};
