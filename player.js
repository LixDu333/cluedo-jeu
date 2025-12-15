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

/* ===== DOM ===== */
const board = document.getElementById("board");
const rollBtn = document.getElementById("roll");
const result = document.getElementById("result");
const playersUI = document.getElementById("players-ui");
const who = document.getElementById("who-am-i");

/* ===== CONSTANTS ===== */
const W = 25, H = 25, TOTAL = W * H;
const idx = (x, y) => y * W + x;

let cells = [];
let state = null;

const myName =
  new URLSearchParams(window.location.search).get("name") || "Nathan";


/* ===== BUILD BOARD ===== */
board.innerHTML = "";
for (let i = 0; i < TOTAL; i++) {
  const c = document.createElement("div");
  c.className = "cell";
  c.addEventListener("click", () => onCellClick(i));
  board.appendChild(c);
  cells.push(c);
}

/* ===== ROOMS (VISUAL ONLY) ===== */
function paintRoom(cls, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      cells[idx(x, y)].classList.add(cls);
}
paintRoom("room-salon", 1, 1, 6, 6);
paintRoom("room-cuisine", 9, 1, 14, 6);
paintRoom("room-salle", 17, 1, 23, 6);
paintRoom("room-bureau", 2, 9, 6, 13);
paintRoom("room-biblio", 10, 9, 14, 13);
paintRoom("room-entree", 18, 9, 23, 13);
paintRoom("room-parents", 4, 17, 9, 22);
paintRoom("room-enfants", 15, 17, 20, 22);

/* ===== ROOM LOGIC (NO DOM) ===== */
function isRoomIndex(i) {
  const x = i % W;
  const y = Math.floor(i / W);

  if (x >= 1 && x <= 6 && y >= 1 && y <= 6) return true;       // salon
  if (x >= 9 && x <= 14 && y >= 1 && y <= 6) return true;     // cuisine
  if (x >= 17 && x <= 23 && y >= 1 && y <= 6) return true;    // salle
  if (x >= 2 && x <= 6 && y >= 9 && y <= 13) return true;     // bureau
  if (x >= 10 && x <= 14 && y >= 9 && y <= 13) return true;   // bibliothèque
  if (x >= 18 && x <= 23 && y >= 9 && y <= 13) return true;   // entrée
  if (x >= 4 && x <= 9 && y >= 17 && y <= 22) return true;    // parents
  if (x >= 15 && x <= 20 && y >= 17 && y <= 22) return true;  // enfants

  return false;
}

/* ===== HELPERS ===== */
function isAdjacent(a, b) {
  const ax = a % W,
    ay = Math.floor(a / W);
  const bx = b % W,
    by = Math.floor(b / W);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

function hasFurnitureAt(game, i) {
  if (!game.furniture) return false;
  for (const arr of Object.values(game.furniture))
    for (const f of arr) if (f.i === i) return true;
  return false;
}

function furnitureHasClueAt(game, i) {
  if (!game.furniture) return false;
  for (const arr of Object.values(game.furniture))
    for (const f of arr) if (f.i === i && f.clue) return true;
  return false;
}

function setFurnitureClueFalse(game, i) {
  let found = false;
  for (const arr of Object.values(game.furniture))
    for (const f of arr)
      if (f.i === i && f.clue) {
        f.clue = false;
        found = true;
      }
  return found;
}

function pickNextPlayer(game) {
  const order = game.turnOrder;
  let i = game.turnIndex;
  do {
    i = (i + 1) % order.length;
    if (game.players[order[i]].alive)
      return { nextIndex: i, nextName: order[i] };
  } while (true);
}

/* ===== SYNC ===== */
gameRef.on("value", (snap) => {
  const g = snap.val();
  if (!g || !g.players) return;
  state = g;
  if (g.killer === myName) {
  result.textContent = "You are the KILLER. Keep it secret.";
}



  // Clear board
  cells.forEach((c) => {
    c.querySelector(".player")?.remove();
    c.classList.remove("furniture", "clue");
  });

  // Furniture
  if (g.furniture) {
    Object.values(g.furniture)
      .flat()
      .forEach((f) => {
        cells[f.i]?.classList.add("furniture");
        if (f.clue) cells[f.i]?.classList.add("clue");
      });
  }

  // Players
  playersUI.innerHTML = "";
  Object.entries(g.players).forEach(([n, p]) => {
    const li = document.createElement("li");
    li.textContent = n + (n === g.currentPlayer ? " ← current turn" : "");
    li.style.color = p.color;
    playersUI.appendChild(li);
    if (p.alive && cells[p.index]) {
      const pawn = document.createElement("div");
      pawn.className = "player";
      pawn.style.background = p.color;
      cells[p.index].appendChild(pawn);
    }
  });

  // Message
  if (g.currentQuestion) {
    if (g.currentQuestion.player === myName) {
      result.textContent =
        "You found a clue. The Game Master is checking your answer.";
    } else {
      result.textContent = `${g.currentQuestion.player} is answering a question.`;
    }
  } else {
    result.textContent = g.message || "";
  }
});

/* ===== ROLL ===== */
rollBtn.onclick = () => {
  gameRef.transaction((game) => {
    if (!game || game.currentPlayer !== myName) return game;
    if ((game.stepsRemaining || 0) > 0) return game;
    const r = Math.floor(Math.random() * 6) + 1;
    game.stepsRemaining = r;
    game.message = `${myName} rolled a ${r}.`;
    return game;
  });
};

/* ===== MOVE ===== */
document.addEventListener("keydown", (e) => {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
    return;

  gameRef.transaction((game) => {
    if (
      !game ||
      game.currentPlayer !== myName ||
      (game.stepsRemaining || 0) <= 0
    )
      return game;

    const me = game.players[myName];
    const from = me.index;
    let to = from;

    const x = from % W,
      y = Math.floor(from / W);

    if (e.key === "ArrowUp" && y > 0) to -= W;
    else if (e.key === "ArrowDown" && y < H - 1) to += W;
    else if (e.key === "ArrowLeft" && x > 0) to -= 1;
    else if (e.key === "ArrowRight" && x < W - 1) to += 1;
    else return game;

    if (hasFurnitureAt(game, to)) return game;

    const wasRoom = isRoomIndex(from);
    const nowRoom = isRoomIndex(to);

    me.index = to;

    if (wasRoom !== nowRoom) {
      const { nextIndex, nextName } = pickNextPlayer(game);
      game.stepsRemaining = 0;
      game.turnIndex = nextIndex;
      game.currentPlayer = nextName;
      game.message = `${myName} ${
        nowRoom ? "entered" : "left"
      } a room. Turn over. It is now ${nextName}'s turn.`;
      return game;
    }

    game.stepsRemaining--;

    if (game.stepsRemaining <= 0) {
      const { nextIndex, nextName } = pickNextPlayer(game);
      game.turnIndex = nextIndex;
      game.currentPlayer = nextName;
      game.message = `${myName} finished moving. It is now ${nextName}'s turn.`;
    } else {
      game.message = `Steps remaining: ${game.stepsRemaining}`;
    }

    return game;
  });
});

/* ===== SEARCH FURNITURE ===== */
function onCellClick(i) {
  if (!state || state.currentPlayer !== myName) return;
  const me = state.players[myName];
  if (!isAdjacent(me.index, i)) return;

  gameRef.transaction((game) => {
    if (!game || game.currentPlayer !== myName) return game;
    if (!hasFurnitureAt(game, i)) return game;

    const found =
      furnitureHasClueAt(game, i) && setFurnitureClueFalse(game, i);

    const { nextIndex, nextName } = pickNextPlayer(game);

    game.stepsRemaining = 0;
    game.turnIndex = nextIndex;
    game.currentPlayer = nextName;

    if (found) {
      game.currentQuestion = {
        id: Date.now() + "_" + Math.random().toString(16).slice(2),
        player: myName,
        pending: true,
        assigned: false,
        q: "",
        a: ""
      };
      game.message = `${myName} found a clue. Turn over. It is now ${nextName}'s turn.`;
    } else {
      game.message = `${myName} searched furniture. Nothing found. Turn over. It is now ${nextName}'s turn.`;
    }

    return game;
  });
}
