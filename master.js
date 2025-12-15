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

/* ================= QUESTIONS (TES 50) ================= */
const QUESTIONS = [
  { q:"The more guards I have, the worse I am at guarding. What am I?", a:"A secret" },
  { q:"I have no mouth, but I can still talk. I often repeat, but I never balk. What am I?", a:"An echo" },
  { q:"I’m not a teacher, but I help you write. What am I?", a:"A pencil" },
  { q:"I’m sticky and sweet and come on a stick. But eat me too slowly, and I’ll do a quick trick. What am I?", a:"A popsicle" },
  { q:"What has cities but no houses, forests but no trees, and rivers but no water?", a:"A map" },
  { q:"I’m full of holes, but I can hold water. What am I?", a:"A sponge" },
  { q:"I’m an animal that carries my house on my back. I never run fast; I’m known to be slack. What am I?", a:"A snail" },
  { q:"What has a ring but no finger?", a:"A mobile phone" },
  { q:"What has legs but doesn't walk?", a:"A table" },
  { q:"I’m red all over, with dust in the air. Some people think I might have had water to share. What am I?", a:"Mars" },
  { q:"I’m a gas giant and the biggest by far. With a Great Red Spot, I’m the king of the stars! What am I?", a:"Jupiter" },
  { q:"I’m not alive, but I can grow. I don’t have lungs, but I need air. I’m not a plant, but you need water to exterminate me. What am I?", a:"Fire" },
  { q:"It belongs to you, but your friends use it more. What is it?", a:"Your name" },
  { q:"What has to be broken before you can use it?", a:"An egg" },
  { q:"What goes up but never comes down?", a:"Your age" },
  { q:"What three numbers, none of which is zero, give the same result whether they’re added or multiplied?", a:"One, two and three" },
  { q:"Which is heavier: a ton of bricks or a ton of feathers?", a:"Neither—they both weigh a ton" },
  { q:"Two fathers and two sons are in a car, yet there are only three people in the car. How?", a:"They are a grandfather, father and son" },
  { q:"If there are three apples and you take away two, how many apples do you have?", a:"You have two apples" },
  { q:"Forward I am heavy, but backward I am not. What am I?", a:"The word “ton”" },
  { q:"What can fill a room but takes up no space?", a:"Light" },
  { q:"What goes through cities and fields, but never moves?", a:"A road" },
  { q:"Why do cats make good warriors?", a:"Because they’ve got nine lives" },
  { q:"In the neighbour's garden there is a carrot, a scarf and five pieces of coal, yet no one put them on the ground. Why?", a:"It was a snowman that had melted" },
  { q:"Who has married many women but was never married?", a:"The priest" },
  { q:"What word starts with a letter T, ends with a letter T, and has tea in it?", a:"A teapot" },
  { q:"What kind of ship has two mates but no captain?", a:"A relationship" },
  { q:"Poor people have it. Rich people need it. If you eat it you die. What is it?", a:"Nothing" },
  { q:"What is it that no one wants to have, but no one wants to lose either?", a:"A case" },
  { q:"I’m orange, I wear a green hat and I sound like a parrot. What am I?", a:"A carrot" },
  { q:"If an electric train is traveling south, then which way is the smoke going?", a:"There is no smoke, it's an electric train" },
  { q:"What has six faces, but does not wear makeup, has twenty-one eyes, but cannot see. What is it?", a:"A dice" },
  { q:"I am as light as a feather, yet no man can hold me for long. What am I?", a:"Your Breath" },
  { q:"How many sides does a circle have?", a:"Two (inside and outside)" },
  { q:"A monkey, a bird, and a squirrel are climbing a coconut tree. Who gets the banana first?", a:"None! Bananas don't grow on coconut trees!" },
  { q:"What is free but priceless and often unnoticed?", a:"Oxygen" },
  { q:"A plane crashes on the border of two countries. Where do you bury the survivors?", a:"You don't bury survivors" },
  { q:"A girl drops a teacup, and it shatters into exactly two pieces. She then drops another cup, and it breaks into five. How many cups did she drop in total?", a:"Two" },
  { q:"What can be served but never eaten?", a:"A tennis ball" },
  { q:"What comes at the end of everything?", a:"The letter \"G\"" },
  { q:"What word rhymes with \"gold\" and describes age?", a:"Old" },
  { q:"What word contains \"sun\" at the beginning but has nothing to do with the weather?", a:"Sunday" },
  { q:"What word rhymes with \"beach\" and describes a lesson?", a:"Teach" },
  { q:"A perfect spot to take a seat, used when eating something sweet. What is it?", a:"A chair" },
  { q:"Rolls around to clean the floor, picking up dust forevermore. What is it?", a:"A vacuum cleaner" },
  { q:"Spinning fast or spinning slow, makes things clean with water's flow. What is it?", a:"A washing machine" },
  { q:"Tells directions, shows the way, guides the driver every day. What is it?", a:"A GPS" },
  { q:"I’m lighter than what I am made of, and more of me is hidden than is seen. What am I?", a:"An iceberg" },
  { q:"You bury me when I’m alive and dig me up when I’m dead. What am I?", a:"A plant" },
  { q:"I can shave daily, but my beard stays the same. Who am I?", a:"A barber" }
];

/* ================= DOM ================= */
const board = document.getElementById("board");
const playersUI = document.getElementById("players-ui");
const killerSpan = document.getElementById("killer-name");
const result = document.getElementById("result");
const restartBtn = document.getElementById("restartBtn");
const skipTurnBtn = document.getElementById("skipTurnBtn");
const validateBtn = document.getElementById("validateBtn");
const rejectBtn = document.getElementById("rejectBtn");
const usePowerBtn = document.getElementById("usePowerBtn");
let selectedPlayer = null;
function pickRandomKiller(players){
  const alivePlayers = Object.keys(players);
  return alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
}



/* ================= BOARD ================= */
const W = 25, H = 25, TOTAL = W * H;
const idx = (x,y)=>y*W+x;
const TURN_ORDER = ["Nathan","Gabriel","Antonin","Arthur","Julie","Eleonore","Alice","Chloe"];
let cells=[];

board.innerHTML="";
for(let i=0;i<TOTAL;i++){
  const c=document.createElement("div");
  c.className="cell";
  board.appendChild(c);
  cells.push(c);
}

function paintRoom(cls,x1,y1,x2,y2){
  for(let y=y1;y<=y2;y++)
    for(let x=x1;x<=x2;x++)
      cells[idx(x,y)].classList.add(cls);
}
paintRoom("room-salon",1,1,6,6);
paintRoom("room-cuisine",9,1,14,6);
paintRoom("room-salle",17,1,23,6);
paintRoom("room-bureau",2,9,6,13);
paintRoom("room-biblio",10,9,14,13);
paintRoom("room-entree",18,9,23,13);
paintRoom("room-parents",4,17,9,22);
paintRoom("room-enfants",15,17,20,22);

/* ================= DEFAULT GAME ================= */
function defaultPlayers(){
  return {
    Nathan:{
      index:3,
      color:"red",
      alive:true,
      power:{ used:false }
    },
    Gabriel:{
      index:21,
      color:"green",
      alive:true,
      power:{ used:false }
    },
    Antonin:{
      index:idx(0,8),
      color:"blue",
      alive:true,
      power:{ used:false }
    },
    Arthur:{
      index:idx(24,8),
      color:"purple",
      alive:true,
      power:{ used:false }
    },
    Julie:{
      index:idx(3,24),
      color:"pink",
      alive:true,
      power:{ used:false }
    },
    Eleonore:{
      index:idx(21,24),
      color:"orange",
      alive:true,
      power:{ used:false }
    },
    Alice:{
      index:idx(12,24),
      color:"cyan",
      alive:true,
      power:{ used:false }
    },
    Chloe:{
      index:12,
      color:"yellow",
      alive:true,
      power:{ used:false }
    }
  };
}

function defaultFurniture(){
  return {
    salon:[{i:idx(2,2),clue:false},{i:idx(4,4),clue:true}],
    cuisine:[{i:idx(10,2),clue:true},{i:idx(12,4),clue:false}],
    salle:[{i:idx(18,2),clue:false},{i:idx(21,4),clue:true}],
    bureau:[{i:idx(3,10),clue:true},{i:idx(5,12),clue:false}],
    biblio:[{i:idx(11,10),clue:false},{i:idx(13,12),clue:true}],
    entree:[{i:idx(19,10),clue:true},{i:idx(22,12),clue:false}],
    parents:[{i:idx(5,18),clue:false},{i:idx(8,21),clue:true}],
    enfants:[{i:idx(16,18),clue:true},{i:idx(19,21),clue:false}]
  };
}

/* ================= INIT ================= */
gameRef.transaction(g=>{
  if(g) return g;
  return {
    players: defaultPlayers(),
    furniture: defaultFurniture(),
    turnOrder: TURN_ORDER,
    turnIndex: 0,
    currentPlayer: TURN_ORDER[0],
    stepsRemaining: 0,
    message: "It is Nathan's turn.",
    killer: pickRandomKiller(defaultPlayers()),
    currentQuestion: null
  };
});

function pickNextPlayer(game){
  let i = game.turnIndex;
  do{
    i=(i+1)%game.turnOrder.length;
    if(game.players[game.turnOrder[i]].alive)
      return {nextIndex:i,nextName:game.turnOrder[i]};
  }while(true);
}

/* ================= BUTTONS ================= */
if(restartBtn){
  restartBtn.onclick=()=>{ if(confirm("Restart game?")){
    gameRef.set({
      players: defaultPlayers(),
      furniture: defaultFurniture(),
      turnOrder: TURN_ORDER,
      turnIndex: 0,
      currentPlayer: TURN_ORDER[0],
      stepsRemaining: 0,
      message: "Game restarted. It is Nathan's turn.",
      killer: pickRandomKiller(defaultPlayers()),
      currentQuestion: null
    });
  }};
}

if(skipTurnBtn){
  skipTurnBtn.onclick=()=>{
    gameRef.transaction(game=>{
      if(!game) return game;
      const {nextIndex,nextName}=pickNextPlayer(game);
      game.turnIndex=nextIndex;
      game.currentPlayer=nextName;
      game.stepsRemaining=0;
      game.message=`MJ skipped the turn. It is now ${nextName}'s turn.`;
      return game;
    });
  };
}

// Validate = correct answer (for now: just clear currentQuestion + message)
if(validateBtn){
  validateBtn.onclick=()=>{
    gameRef.transaction(game=>{
      if(!game || !game.currentQuestion) return game;
      const p = game.currentQuestion.player || "Player";
      game.message = `${p}'s answer was correct.`;
      game.currentQuestion = null;
      return game;
    });
  };
}

// Reject = incorrect answer (for now: just clear currentQuestion + message)
if(rejectBtn){
rejectBtn.onclick = () => {
  gameRef.transaction(game => {
    if (!game) return game;

    game.vote = {
      active: true,
      votes: {}
    };

    game.message = "A vote has started. All players must vote.";
    game.currentQuestion = null;

    return game;
  });
};

}

/* ================= AUTO-ASSIGN QUESTION (MJ fills it) =================
   Player creates: { player, pending:true, assigned:false, q:"", a:"", id }
   MJ detects pending+not assigned -> assigns random question -> writes q/a/assigned
*/
function tryAssignQuestion(g){
  if(!g || !g.currentQuestion) return;
  const cq = g.currentQuestion;
  if(!cq.pending) return;
  if(cq.assigned) return;

  gameRef.transaction(game=>{
    if(!game || !game.currentQuestion) return game;
    const q2 = game.currentQuestion;
    if(!q2.pending || q2.assigned) return game;

    const pick = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    q2.q = pick.q;
    q2.a = pick.a;
    q2.assigned = true;
    q2.status = "pending";
    game.message = `${q2.player} found a clue. Waiting for the Game Master.`;
    return game;
  });
}

/* ================= RENDER ================= */
gameRef.on("value",snap=>{
  const g=snap.val(); if(!g) return;

    if (
    g.players &&
    g.killer &&
    g.players[g.killer] &&
    g.players[g.killer].alive === false
  ) {
    result.textContent = "🏆 The Innocents win! The killer has been eliminated.";
    return;
  }
  // ensure question gets a real one
  tryAssignQuestion(g);

  cells.forEach(c=>{
    c.querySelector(".player")?.remove();
    c.classList.remove("furniture","clue");
  });

  Object.values(g.furniture||{}).flat().forEach(f=>{
    cells[f.i]?.classList.add("furniture");
    if(f.clue) cells[f.i]?.classList.add("clue");
function resolveVote(game) {
  const tally = {};

  Object.values(game.vote.votes).forEach(target => {
    tally[target] = (tally[target] || 0) + 1;
  });

  let max = 0;
  let eliminated = null;
  let tie = false;

  for (const [name, count] of Object.entries(tally)) {
    if (count > max) {
      max = count;
      eliminated = name;
      tie = false;
    } else if (count === max) {
      tie = true;
    }
  }

  if (!tie && eliminated && game.players[eliminated]) {
    game.players[eliminated].alive = false;
    game.message = `${eliminated} has been eliminated by vote.`;
  } else {
    game.message = "Vote ended with a tie. No one is eliminated.";
  }

  game.vote = { active: false, votes: {} };
}

  });

playersUI.innerHTML="";
Object.entries(g.players).forEach(([n,p])=>{
  const li=document.createElement("li");
  li.textContent =
    n +
    (n === g.currentPlayer ? " ← current" : "") +
    (p.alive ? "" : " (dead)");
  li.style.color = p.color;
  li.style.cursor = p.alive ? "pointer" : "default";

  // ===== MJ ELIMINATES PLAYER =====
li.onclick = () => {
  selectedPlayer = n;

  // petit feedback visuel
  [...playersUI.children].forEach(el => el.style.fontWeight = "normal");
  li.style.fontWeight = "bold";
};


  playersUI.appendChild(li);

  // ===== PAWN ON BOARD =====
  if (p.alive && cells[p.index]) {
    const pawn = document.createElement("div");
    pawn.className = "player";
    pawn.style.background = p.color;
    cells[p.index].appendChild(pawn);
  }
});


  killerSpan.textContent=g.killer;

  if(g.currentQuestion){
    const cq = g.currentQuestion;
    result.innerHTML=
      `<strong>QUESTION:</strong> ${cq.q || "(assigning...)"}<br>
       <strong>ANSWER:</strong> ${cq.a || "(assigning...)"}<br>
       <em>Player: ${cq.player}</em>`;
  }else{
    result.textContent=g.message||"";
  }
function resolveVote(game) {
  const tally = {};

  Object.values(game.vote.votes).forEach(target => {
    tally[target] = (tally[target] || 0) + 1;
  });

  let max = 0;
  let eliminated = null;
  let tie = false;

  for (const [name, count] of Object.entries(tally)) {
    if (count > max) {
      max = count;
      eliminated = name;
      tie = false;
    } else if (count === max) {
      tie = true;
    }
  }

  if (!tie && eliminated && game.players[eliminated]) {
    game.players[eliminated].alive = false;
    game.message = `${eliminated} has been eliminated by vote.`;
  } else {
    game.message = "Vote ended with a tie. No one is eliminated.";
  }

  game.vote = { active: false, votes: {} };
}
usePowerBtn.onclick = () => {
  if (!selectedPlayer) {
    alert("Select a player first.");
    return;
  }

  gameRef.transaction(game => {
    const p = game.players[selectedPlayer];
    if (!p || !p.alive) return game;

    if (!p.power || p.power.used) {
      game.message = `${selectedPlayer}'s power has already been used.`;
      return game;
    }

    // ===== GABRIEL POWER =====
    if (selectedPlayer === "Gabriel") {
      const isKiller = game.killer === "Gabriel";
      game.message = `Gabriel used his power: He is ${isKiller ? "" : "NOT "}the killer.`;
      p.power.used = true;
    } else {
      game.message = `${selectedPlayer} has no active power yet.`;
    }

    return game;
  });
};


});
