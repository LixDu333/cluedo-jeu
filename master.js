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

const board = document.getElementById("board");
const playersUI = document.getElementById("players-ui");
const killerSpan = document.getElementById("killer-name");
const result = document.getElementById("result");

const W = 25;
const H = 25;
const TOTAL = W * H;
const idx = (x, y) => y * W + x;

let cells = [];

// ===== BOARD =====
board.innerHTML = "";
for (let i = 0; i < TOTAL; i++) {
  const c = document.createElement("div");
  c.className = "cell";
  board.appendChild(c);
  cells.push(c);
}

// ===== ROOMS (colors via CSS classes) =====
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

// ===== INIT (transaction: creates ONLY if missing) =====
const DEFAULT_ORDER = ["Nathan","Gabriel","Antonin","Arthur","Julie","Eleonore","Alice","Chloe"];

gameRef.transaction(current => {
  if (current) {
    // Ensure required fields exist (in case you had old data)
    if (!current.turnOrder) current.turnOrder = DEFAULT_ORDER;
    if (typeof current.turnIndex !== "number") current.turnIndex = 0;
    if (!current.currentPlayer) current.currentPlayer = current.turnOrder[current.turnIndex] || "Nathan";
    if (typeof current.stepsRemaining !== "number") current.stepsRemaining = 0;
    if (!current.message) current.message = `It is ${current.currentPlayer}'s turn.`;
    return current;
  }

  const players = {
    Nathan:   { index: 3,          color: "red",    alive: true },
    Gabriel:  { index: 21,         color: "green",  alive: true },
    Antonin:  { index: idx(0, 8),  color: "blue",   alive: true },
    Arthur:   { index: idx(24, 8), color: "purple", alive: true },
    Julie:    { index: idx(3, 24), color: "pink",   alive: true },
    Eleonore: { index: idx(21,24), color: "orange", alive: true },
    Alice:    { index: idx(12,24), color: "cyan",   alive: true },
    Chloe:    { index: 12,         color: "yellow", alive: true }
  };

  return {
    players,
    turnOrder: DEFAULT_ORDER,
    turnIndex: 0,
    currentPlayer: DEFAULT_ORDER[0],
    stepsRemaining: 0,
    message: "It is Nathan's turn.",
    killer: "Gabriel"
  };
});

// ===== RENDER =====
function clearPawns() {
  cells.forEach(c => c.querySelector(".player")?.remove());
}

gameRef.on("value", snap => {
  const d = snap.val();
  if (!d || !d.players) return;

  clearPawns();

  killerSpan.textContent = d.killer || "(unknown)";
  result.textContent = d.message || "";

  playersUI.innerHTML = "";
  Object.entries(d.players).forEach(([name, p]) => {
    if (p.alive && cells[p.index]) {
      const pawn = document.createElement("div");
      pawn.className = "player";
      pawn.style.background = p.color;
      cells[p.index].appendChild(pawn);
    }
    const li = document.createElement("li");
    li.textContent = `${name}${name === d.currentPlayer ? " ← current turn" : ""}`;
    li.style.color = p.color;
    if (!p.alive) li.style.opacity = "0.5";
    playersUI.appendChild(li);
  });
});
