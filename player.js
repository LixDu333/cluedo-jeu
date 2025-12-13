import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 👉 COLLE LA MÊME CONFIG QUE DANS master.js
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_AUTH_DOMAIN",
  databaseURL: "TON_DATABASE_URL",
  projectId: "TON_PROJECT_ID",
  storageBucket: "TON_BUCKET",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomRef = ref(db, "rooms/defaultRoom");

const boardEl   = document.getElementById("board");
const rollBtn   = document.getElementById("roll");
const resultEl  = document.getElementById("result");
const playersUI = document.getElementById("players-ui");
const whoAmIEl  = document.getElementById("who-am-i");

const WIDTH = 25;
const HEIGHT = 25;
const TOTAL = WIDTH * HEIGHT;

let cells = [];
let myName = new URLSearchParams(window.location.search).get("name") || "Nathan";

whoAmIEl.textContent = "Tu joues : " + myName;

// ==================== Plateau local ====================

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
}

buildBoard();

// ==================== Listener Firebase ====================

let lastState = null;

onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  lastState = data;

  const { players, currentPlayer, stepsRemaining } = data;

  drawPlayers(players);
  updatePlayersUI(players, currentPlayer);
  resultEl.textContent = "Pas restants : " + stepsRemaining;
});

// ==================== Affichage ====================

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
    li.textContent = (p.name === "Chloe" ? "Chloé" : p.name) + (p.name === currentPlayer ? " ← tour" : "");
    li.style.color = p.color;
    if (!p.alive) li.classList.add("dead");
    playersUI.appendChild(li);
  });
}

// ==================== Lancer le dé ====================

rollBtn.addEventListener("click", async () => {
  if (!lastState) return;

  const { currentPlayer, stepsRemaining } = lastState;

  if (currentPlayer !== myName) {
    alert("Ce n'est pas ton tour !");
    return;
  }

  if (stepsRemaining > 0) {
    alert("Tu as encore des pas à utiliser.");
    return;
  }

  const roll = Math.floor(Math.random() * 6) + 1;

  await update(roomRef, {
    stepsRemaining: roll
  });
});

// ==================== Déplacement clavier ====================

document.addEventListener("keydown", async (e) => {
  if (!lastState) return;

  let { players, currentPlayer, stepsRemaining } = lastState;

  if (currentPlayer !== myName) return;
  if (stepsRemaining <= 0) return;

  const me = players[myName];
  if (!me || !me.alive) return;

  let newIndex = me.index;
  const row = Math.floor(me.index / WIDTH);
  const col = me.index % WIDTH;

  if (e.key === "ArrowUp" && row > 0) newIndex -= WIDTH;
  else if (e.key === "ArrowDown" && row < HEIGHT - 1) newIndex += WIDTH;
  else if (e.key === "ArrowLeft" && col > 0) newIndex -= 1;
  else if (e.key === "ArrowRight" && col < WIDTH - 1) newIndex += 1;
  else return;

  if (!cells[newIndex]) return;

  // Met à jour ton index et stepsRemaining dans Firebase
  players[myName].index = newIndex;
  stepsRemaining--;

  await update(roomRef, {
    players,
    stepsRemaining
  });
});
