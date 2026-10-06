const dog = document.getElementById("dog");
const messages = document.getElementById("messages");
const input = document.getElementById("command-input");
const form = document.getElementById("command-form");

const STORAGE_KEY = "pixelpet-data-v1";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"notes":[],"reminders":[],"mood":"happy"}');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addMessage(text, type = "pet") {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function activePet() { return dog; }

function mood(name) {
  const pet = activePet();
  pet.classList.remove("happy", "sleep", "walk", "sit", "greet", "pat", "bored", "angry", "confront", "curious", "look", "sniff", "stretch", "lie", "wake");
  if (name === "sleepy") pet.classList.add("sleep");
  if (name === "happy") pet.classList.add("happy");
  state.mood = name;
  save();
}

function help() {
  return [
    "Try:",
    "• hello",
    "• timer 25",
    "• note buy milk",
    "• notes",
    "• remind me in 10 minutes to stretch",
    "• battery",
    "• memory",
    "• focus",
    "• sleep",
    "• pat",
    "• greet",
    "• sit",
    "• walk",
    "• bored",
    "• sniff",
    "• stretch",
    "• lie",
    "• look"
  ].join("\n");
}

function parseReminder(command) {
  const match = command.match(/^remind me in (\\d+) (minute|minutes|hour|hours) to (.+)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].startsWith("hour") ? 3600000 : 60000;
  const due = Date.now() + amount * unit;
  const text = match[3].trim();

  state.reminders.push({ text, due, notified: false });
  save();

  setTimeout(() => checkReminders(), 500);
  return `Okay. I'll remind you in ${amount} ${match[2]}: ${text}`;
}

function checkReminders() {
  const now = Date.now();
  let changed = false;

  for (const reminder of state.reminders) {
    if (!reminder.notified && reminder.due <= now) {
      reminder.notified = true;
      changed = true;
      mood("happy");
      addMessage("⏰ Reminder: " + reminder.text);
    }
  }

  if (changed) save();
}

function runTimer(minutes) {
  const ms = minutes * 60000;
  mood("happy");
  addMessage(`⏱️ Focus timer started for ${minutes} minutes.`);

  setTimeout(() => {
    mood("happy");
    addMessage("🎉 Time's up! Nice work.");
  }, ms);
}

async function command(raw) {
  const command = raw.trim();
  const text = command.toLowerCase();

  if (!command) return;

  addMessage(command, "user");

  if (text === "help" || text === "?") {
    addMessage(help());
    return;
  }

  if (text === "hello" || text === "hi" || text === "hey") {
    mood("happy");
    addMessage("Woof! Hi! 🐶 I'm PixelPet. I'm right here with you.");
    return;
  }

    if (text === "who are you") {
    addMessage("I'm your tiny desktop coworker. I live locally on your Mac.");
    return;
  }

  if (["pat","greet","sit","walk","bored","angry","confront","sniff","stretch","lie","look"].includes(text)) {
    petReact(text);
    const lines = {
      pat: "🐾 Tail wag! That feels good.",
      greet: "🐶 Hello! *tail wagging*",
      sit: "🐶 Sitting nicely.",
      walk: "🐾 Let's go!",
      bored: "😐 I'm bored... entertain me!",
      angry: "😤 Hey! What's going on?",
      confront: "🐶 Excuse me. We need to talk.",
      sniff: "🐶 *sniff sniff*",
      stretch: "🐶 *big stretch*",
      lie: "🐶 Time for a little rest.",
      look: "🐶 Hmm? Did you call me?"
    };
    addMessage(lines[text]);
    return;
  }

  if (text === "focus") {
    mood("happy");
    addMessage("🎯 Focus mode: let's make the next 25 minutes count.");
    runTimer(25);
    return;
  }

  const timer = text.match(/^timer (\\d+)$/);
  if (timer) {
    runTimer(Math.min(Number(timer[1]), 240));
    return;
  }

  const note = command.match(/^note (.+)$/i);
  if (note) {
    state.notes.push({ text: note[1].trim(), created: Date.now() });
    save();
    addMessage("📝 Saved locally: " + note[1].trim());
    return;
  }

  if (text === "notes") {
    if (!state.notes.length) {
      addMessage("Your notebook is empty.");
      return;
    }
    addMessage(state.notes.map((n, i) => `${i + 1}. ${n.text}`).join("\n"));
    return;
  }

  const reminder = parseReminder(command);
  if (reminder) {
    addMessage("⏰ " + reminder);
    return;
  }

  if (text === "memory") {
    const info = await window.pixelPet.getSystemInfo();
    const used = info.memoryTotalGB - info.memoryFreeGB;
    addMessage(`💻 Memory: ${used.toFixed(1)} / ${info.memoryTotalGB} GB used.`);
    return;
  }

  if (text === "cpu") {
    const info = await window.pixelPet.getSystemInfo();
    addMessage(`🧠 CPU: ${info.cpu} (${info.cpuCores} cores).`);
    return;
  }

  if (text === "system") {
    const info = await window.pixelPet.getSystemInfo();
    addMessage(`🍎 ${info.platform} • ${info.cpuCores} CPU cores • ${info.memoryTotalGB} GB RAM.`);
    return;
  }

  if (text === "sleep") {
    mood("sleepy");
    addMessage("😴 Okay... I'll nap.");
    return;
  }

  if (text === "wake") {
    mood("happy");
    addMessage("☀️ I'm awake!");
    return;
  }

  addMessage("I don't know that command yet. Type 'help' to see what I can do.");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input.value;
  input.value = "";
  command(value);
});

dog.addEventListener("mousemove", () => {
  if (Math.random() < 0.025) lookAtCursor();
});

dog.addEventListener("click", () => {
  interactWithPet();
  input.focus();
});

document.addEventListener("mousemove", (event) => {
  const pet = activePet();
  if (Math.random() > 0.015 || state.mood === "sleepy" || walking) return;
  petReact("curious");
});

setInterval(checkReminders, 1000);

setTimeout(() => {
  addMessage("Hi! I'm PixelPet. 🐾");
  addMessage("Everything here runs locally. Type 'help' to try me.");
}, 700);


/* Autonomous desktop-pet behavior */
let wanderTimer = null;
let behaviorTimer = null;
let attentionTimer = null;
let walking = false;
let wanderActive = false;
let systemIdleSeconds = 0;
const IDLE_TO_WANDER = 5 * 60;
let waterReminderTimer = null;

const DOG_STATES = ["idle","walk","happy","curious","sit","greet","pat","bored","angry","confront","look","sniff","stretch","lie","wake","touch-look","touch-happy","touch-wag"];

const DOG_FRAMES = {
  idle: ["./assets/dog-idle.svg"],
  walk: ["./assets/dog-walk-1.svg","./assets/dog-walk-2.svg","./assets/dog-walk-3.svg","./assets/dog-walk-2.svg"],
  sit: ["./assets/dog-sit.svg"],
  lie: ["./assets/dog-lie.svg"],
  sleep: ["./assets/dog-sleep.svg"],
  wake: ["./assets/dog-wake.svg"],
  happy: ["./assets/dog-idle.svg","./assets/dog-wake.svg"],
  greet: ["./assets/dog-idle.svg","./assets/dog-wake.svg"],
  pat: ["./assets/dog-idle.svg","./assets/dog-wake.svg"],
  "touch-look": ["./assets/dog-idle.svg","./assets/dog-wake.svg"],
  "touch-happy": ["./assets/dog-idle.svg","./assets/dog-wake.svg"],
  "touch-wag": ["./assets/dog-idle.svg","./assets/dog-wake.svg"]
};
let dogFrameTimer = null;
let dogFrameIndex = 0;

function playDogFrames(stateName) {
  clearInterval(dogFrameTimer);
  dogFrameIndex = 0;
  const frames = DOG_FRAMES[stateName] || DOG_FRAMES.idle;
  const render = () => {
    dog.style.setProperty("--dog-frame", `url("${frames[dogFrameIndex % frames.length]}")`);
    dogFrameIndex += 1;
  };
  render();
  if (frames.length > 1) {
    const speed = stateName === "walk" ? 145 : stateName === "happy" || stateName === "greet" ? 260 : 420;
    dogFrameTimer = setInterval(render, speed);
  }
}

function setDogState(stateName, duration = 1800) {
  const safeState = DOG_STATES.includes(stateName) ? stateName : "idle";
  dog.classList.remove(...DOG_STATES);
  dog.classList.add(safeState);
  playDogFrames(safeState);
  clearTimeout(attentionTimer);
  if (safeState !== "idle" && duration > 0) {
    attentionTimer = setTimeout(() => setDogState("idle", 0), duration);
  }
}

function petReact(type) {
  setDogState(type, type === "walk" ? 0 : type === "happy" || type === "pat" ? 1400 : 2200);
}

function showBubbleMessage(text) {
  addMessage(text);
}

function interactWithPet() {
  const responses = [
    "🐶 Woof!",
    "🐾 Tail wag!",
    "❤️ Belly rub accepted.",
    "🎾 Play with me!",
    "👀 Who's there?",
    "🐕 *happy wiggle*"
  ];
  petReact("pat");
  showBubbleMessage(responses[Math.floor(Math.random() * responses.length)]);
}

function lookAtCursor() {
  if (state.mood === "sleepy" || walking) return;
  petReact("look");
}

function walkTo(x, y, duration) {
  if (!window.pixelPet?.movePet) return;
  walking = true;
  setDogState("walk", 0);
  window.pixelPet.movePet(Math.round(x), Math.round(y), duration);
  setTimeout(() => {
    walking = false;
    setDogState("idle");
  }, duration);
}

async function refreshSystemIdle() {
  if (!window.pixelPet?.getSystemIdleSeconds) return;
  try {
    systemIdleSeconds = await window.pixelPet.getSystemIdleSeconds();
    wanderActive = systemIdleSeconds >= IDLE_TO_WANDER;
  } catch {
    wanderActive = false;
  }
}

async function scheduleWander() {
  clearTimeout(wanderTimer);
  await refreshSystemIdle();
  if (!wanderActive || state.mood === "sleepy") {
    wanderTimer = setTimeout(scheduleWander, 10000);
    return;
  }

  const margin = 35;
  const maxX = Math.max(margin, window.screen.availWidth - 390);
  const maxY = Math.max(margin, window.screen.availHeight - 390);
  const x = margin + Math.random() * Math.max(1, maxX - margin);
  const y = margin + Math.random() * Math.max(1, maxY - margin);
  const duration = 1100 + Math.floor(Math.random() * 1600);

  walkTo(x, y, duration);
  wanderTimer = setTimeout(scheduleWander, duration + 5000 + Math.random() * 7000);
}

function dogLifeBehavior() {
  if (state.mood === "sleepy" || walking) return;

  const roll = Math.random();

  if (roll < 0.16) {
    petReact("look");
  } else if (roll < 0.30) {
    petReact("sniff");
  } else if (roll < 0.40) {
    petReact("stretch");
  } else if (roll < 0.49) {
    petReact("greet");
  } else if (roll < 0.58) {
    petReact("sit");
  } else if (roll < 0.66) {
    petReact("bored");
  } else if (roll < 0.72) {
    petReact("lie");
    setTimeout(() => {
      if (state.mood !== "sleepy") petReact("wake");
    }, 2800);
  }
}

function scheduleDogLife() {
  clearTimeout(behaviorTimer);
  behaviorTimer = setTimeout(() => {
    dogLifeBehavior();
    scheduleDogLife();
  }, 3500 + Math.random() * 7000);
}

dog.addEventListener("mouseenter", () => {
  if (state.mood !== "sleepy" && !walking) petReact("curious");
});

dog.addEventListener("mousemove", () => {
  if (state.mood !== "sleepy" && !walking && Math.random() < 0.018) lookAtCursor();
});

dog.addEventListener("click", () => {
  interactWithPet();
  input.focus();
});

setInterval(refreshSystemIdle, 10000);
setTimeout(scheduleWander, 1000);
scheduleDogLife();

function startWaterReminder() {
  clearInterval(waterReminderTimer);
  waterReminderTimer = setInterval(() => {
    addMessage("💧 Time for a water break! Take a moment to drink some water.");
    petReact("greet");
  }, 60 * 60 * 1000);
}
startWaterReminder();

function touchReaction(type, message) {
  petReact(type);
  showBubbleMessage(message);
}

document.querySelectorAll(".touch-eye").forEach((eye) => {
  eye.addEventListener("click", (event) => {
    event.stopPropagation();
    touchReaction("touch-look", "👀 Hey! My eyes!");
  });
});
document.querySelector(".touch-nose")?.addEventListener("click", (event) => {
  event.stopPropagation();
  touchReaction("touch-happy", "🐶 Boop! *tail wag*");
});
document.querySelector(".touch-collar")?.addEventListener("click", (event) => {
  event.stopPropagation();
  touchReaction("touch-happy", "💜 You touched my collar!");
});
document.querySelector(".touch-tail")?.addEventListener("click", (event) => {
  event.stopPropagation();
  touchReaction("touch-wag", "🐕 My tail!");
});
