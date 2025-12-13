import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ✅ TA CONFIG FIREBASE (INTÉGRÉE)
const firebaseConfig = {
  apiKey: "AIzaSyDQ3ABWDL2OcBSaro9ZQ7Ez9pJrrbPS3RY",
  authDomain: "jeuanglais-f56d0.firebaseapp.com",
  projectId: "jeuanglais-f56d0",
  storageBucket: "jeuanglais-f56d0.firebasestorage.app",
  messagingSenderId: "59004903620",
  appId: "1:59004903620:web:e2ff0f53d595a3e2ca6991",
  measurementId: "G-0SW3WTLRR3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomRef = ref(db, "rooms/defaultRoom");

const boardEl   = document.getElementById("board");
const playersUI = document.getElementById("players-ui");
const resultEl  = document.getElementById("result");
const killerSpan = document.getElementById("killer-name");

const WIDTH = 25;
const HEIGHT = 25;
const TOTAL = WIDTH * HEIGHT;

let cells = [];

// ==================== JOUEURS FIXES ====================

const playerDefs = [
  { name: "Nathan",   index: 3, color: "red" },
  { name: "Gabriel",  index: 21, color: "green" },
  { name: "Antonin",  index: 8 * WIDTH + 0, color: "blue" },
  { name: "Arthur",   index: 8 * WIDTH + 24, color: "purple" },
  { name: "Julie",    index: 24 * WIDTH + 3, color: "pink" },
  { name: "Eleonore", index: 24 * WIDTH + 21, color: "orange" },
  { name: "Alice",    index: 24 * WIDTH + 12, color: "cyan" },
  { name: "Chloe",    index: 12, color: "yellow" }
];

// ==================== PLATEAU MJ ====================

function buildBoard() {
  boardEl.innerHTML = "";
  cells = [];

  for (let i = 0; i < TOTAL; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function paintRoom(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const idx = y * WIDTH + x;
        cells[idx].classList.add("room");
      }
    }
  }

  paintRoom(1, 1, 6, 6);
  paintRoom(9, 1, 14, 6);
  paintRoom(17, 1, 23, 6);
  paintRoom(2, 9, 6, 13);
  paintRoom(10, 9, 14, 13);
  paintRoom(18, 9, 23, 13);
  paintRoom(4, 17, 9, 22);
  paintRoom(15, 17, 20, 22);
}

buildBoard();

// ==================== INITIALISATION PARTIE ====================

async function initGameOnServer() {
  const killerIndex = Math.floor(Math.random() * playerDefs.length);
  const killerName = playerDefs[killerIndex].name;

  const playersState = {};
  playerDefs.forEach(p => {
    playersState[p.name] = {
      name: p.name,
      index: p.index,
      alive: true,
      color: p.color
    };
  });

  await set(roomRef, {
    players: playersState,
    currentPlayer: "Nathan",
    stepsRemaining: 0,
    killer: killerName
  });
}

initGameOnServer();

// ==================== SYNCHRO MJ ====================

onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const { players, currentPlayer, stepsRemaining, killer } = data;

  killerSpan.textContent = killer;
  drawPlayers(players);
  updatePlayersUI(players, currentPlayer);
  resultEl.textContent = "Pas restants : " + stepsRemaining;
});

// ==================== AFFICHAGE ====================

function drawPlayers(playersState) {
  cells.forEach(c => c.innerHTML = "");
  Object.values(playersState).forEach(p => {
    if (p.alive && cells[p.index]) {
      const pawn = document.createElement("div");
      pawn.className = "player " + p.color;
      cells[p.index].appendChild(pawn);
    }
  });
}

function updatePlayersUI(playersState, currentPlayer) {
  playersUI.innerHTML = "";
  Object.values(playersState).forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.name === currentPlayer ? " ← tour" : "");
    li.style.color = p.color;
    if (!p.alive) li.classList.add("dead");
    playersUI.appendChild(li);
  });
}

