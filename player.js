const firebaseConfig = {
  apiKey: "AIzaSyDQ3ABWDL2OcBSaro9ZQ7Ez9pJrrbPS3RY",
  authDomain: "jeuanglais-f56d0.firebaseapp.com",
  databaseURL: "https://jeuanglais-f56d0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jeuanglais-f56d0",
  storageBucket: "jeuanglais-f56d0.firebasestorage.app",
  messagingSenderId: "59004903620",
  appId: "1:59004903620:web:e2ff0f53d595a3e2ca6991"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const gameRef = db.ref("game");

// ===== DOM =====
const board = document.getElementById("board");
const rollBtn = document.getElementById("roll");
const result = document.getElementById("result");
const playersUI = document.getElementById("players-ui");
const who = document.getElementById("who-am-i");

// ===== CONSTANTS =====
const W = 25;
const H = 25;
const TOTAL = W * H;
const idx = (x, y) => y * W + x;

let cells = [];
let state = null;

const myName = new URLSearchParams(window.location.search).get("name") || "Nathan";
who.textContent = "You are playing as: " + myName;

// ===== BOARD =====
board.innerHTML = "";
for (let i = 0; i < TOTAL; i++) {
  const c = document.createElement("div");
  c.className = "cell";
  board.appendChild(c);
  cells.push(c);
}

// ===== ROOMS =====
function room(cls, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      cells[idx(x, y)].classList.add(cls);
}

room("room-salon",1,1,6,6);
room("room-cuisine",9,1,14,6);
room("room-salle",17,1,23,6);
room("room-bureau",2,9,6,13);
room("room-biblio",10,9,14,13);
room("room-entree",18,9,23,13);
room("room-parents",4,17,9,22);
room("room-enfants",15,17,20,22);

function isRoom(i) {
  const c = cells[i].classList;
  return c.contains("room-salon") ||
         c.contains("room-cuisine") ||
         c.contains("room-salle") ||
         c.contains("room-bureau") ||
         c.contains("room-biblio") ||
         c.contains("room-entree") ||
         c.contains("room-parents") ||
         c.contains("room-enfants");
}

function clearPawns() {
  cells.forEach(c => c.querySelector(".player")?.remove());
}

function draw(game) {
  // message
  result.textContent = game.message || `Steps remaining: ${game.stepsRemaining ?? 0}`;

  // list
  playersUI.innerHTML = "";
  Object.entries(game.players).forEach(([name, p]) => {
    const li = document.createElement("li");
    li.textContent = `${name}${name === game.currentPlayer ? " ← current turn" : ""}`;
    li.style.color = p.color;
    if (!p.alive) li.style.opacity = "0.5";
    playersUI.appendChild(li);
  });

  // pawns
  clearPawns();
  Object.values(game.players).forEach(p => {
    if (p.alive && cells[p.index]) {
      const pawn = document.createElement("div");
      pawn.className = "player";
      pawn.style.background = p.color;
      cells[p.index].appendChild(pawn);
    }
  });
}

// ===== SYNC =====
gameRef.on("value", snap => {
  const d = snap.val();
  if (!d || !d.players) return;
  state = d;
  draw(d);
});

// ===== TURN HELPERS (inside transaction) =====
function pickNextPlayer(game) {
  const order = game.turnOrder || ["Nathan","Gabriel","Antonin","Arthur","Julie","Eleonore","Alice","Chloe"];
  let i = typeof game.turnIndex === "number" ? game.turnIndex : 0;

  // advance at least once
  let tries = 0;
  do {
    i = (i + 1) % order.length;
    tries++;
    const name = order[i];
    if (game.players[name] && game.players[name].alive) {
      return { nextIndex: i, nextName: name, order };
    }
  } while (tries <= order.length + 1);

  // fallback (shouldn't happen)
  return { nextIndex: i, nextName: order[i] || "Nathan", order };
}

// ===== ROLL DICE (transaction) =====
rollBtn.onclick = () => {
  gameRef.transaction(game => {
    if (!game || !game.players) return game;

    if (game.currentPlayer !== myName) return game;
    if ((game.stepsRemaining || 0) > 0) return game;

    const roll = Math.floor(Math.random() * 6) + 1;
    game.stepsRemaining = roll;
    game.message = `${myName} rolled a ${roll}.`;
    return game;
  });
};

// ===== MOVE (transaction: atomic move + decrement + end turn + next player) =====
document.addEventListener("keydown", e => {
  const key = e.key;
  if (!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(key)) return;

  gameRef.transaction(game => {
    if (!game || !game.players) return game;

    if (game.currentPlayer !== myName) return game;
    if ((game.stepsRemaining || 0) <= 0) return game;

    const me = game.players[myName];
    if (!me || !me.alive) return game;

    const oldIndex = me.index;
    const x = oldIndex % W;
    const y = Math.floor(oldIndex / W);

    let newIndex = oldIndex;
    if (key === "ArrowUp" && y > 0) newIndex -= W;
    else if (key === "ArrowDown" && y < H - 1) newIndex += W;
    else if (key === "ArrowLeft" && x > 0) newIndex -= 1;
    else if (key === "ArrowRight" && x < W - 1) newIndex += 1;
    else return game;

    // apply move
    me.index = newIndex;

    const wasInRoom = isRoom(oldIndex);
    const isNowInRoom = isRoom(newIndex);

    // entering OR leaving a room ends the turn immediately (your rule)
    if (wasInRoom !== isNowInRoom) {
      const { nextIndex, nextName } = pickNextPlayer(game);
      game.stepsRemaining = 0;
      game.turnIndex = nextIndex;
      game.currentPlayer = nextName;

      if (!wasInRoom && isNowInRoom) {
        game.message = `${myName} entered a room. Turn over. It is now ${nextName}'s turn.`;
      } else {
        game.message = `${myName} left the room. Turn over. It is now ${nextName}'s turn.`;
      }
      return game;
    }

    // normal move consumes 1 step
    game.stepsRemaining = (game.stepsRemaining || 0) - 1;

    // if no steps left, end turn -> next player
    if (game.stepsRemaining <= 0) {
      const { nextIndex, nextName } = pickNextPlayer(game);
      game.stepsRemaining = 0;
      game.turnIndex = nextIndex;
      game.currentPlayer = nextName;
      game.message = `${myName} finished moving. It is now ${nextName}'s turn.`;
    } else {
      game.message = `Steps remaining: ${game.stepsRemaining}`;
    }

    return game;
  });
});
