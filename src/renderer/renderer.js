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
  pet.classList.remove("happy", "sleep", "walk", "sit", "greet", "pat", "bored", "angry", "confront", "curious");
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
    "• bored"
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
    addMessage("Woof! I'm PixelPet. 🐶 No AI needed — I live locally on your Mac.");
    return;
  }

    if (text === "who are you") {
    addMessage("I'm your tiny desktop coworker. I live locally on your Mac.");
    return;
  }

  if (["pat","greet","sit","walk","bored","angry","confront"].includes(text)) {
    petReact(text);
    const lines = {
      pat: "🐾 Tail wag! That feels good.",
      greet: "🐶 Hello! *tail wagging*",
      sit: "🐶 Sitting nicely.",
      walk: "🐾 Let's go!",
      bored: "😐 I'm bored... entertain me!",
      angry: "😤 Hey! What's going on?",
      confront: "🐶 Excuse me. We need to talk."
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
let wanderActive = true;
let walking = false;
let attentionTimer = null;
let interactionTimer = null;

function showBubbleMessage(text) {
  addMessage(text);
}

function petReact(type) {
  const pet = dog;
  pet.classList.remove("idle","happy","curious","sleep","walk","sit","greet","pat","bored","angry","confront");
  pet.classList.add(type);
  clearTimeout(attentionTimer);
  attentionTimer = setTimeout(() => {
    pet.classList.remove(type);
    pet.classList.add("idle");
  }, type === "happy" || type === "pat" ? 1400 : 2200);
}

function randomBehavior() {
  if (state.mood === "sleepy" || walking) return;

  const pet = activePet();
  const roll = Math.random();

  if (roll < 0.22) {
    petReact("curious");
  } else if (roll < 0.40) {
    petReact("happy");
  } else if (roll < 0.54) {
    petReact("sit");
  } else if (roll < 0.65) {
    petReact("sleep");
    setTimeout(() => {
      if (state.mood !== "sleepy") petReact("idle");
    }, 1800);
  }
}

function scheduleRandomBehavior() {
  clearTimeout(interactionTimer);
  interactionTimer = setTimeout(() => {
    randomBehavior();
    scheduleRandomBehavior();
  }, 3500 + Math.random() * 7000);
}

function maybePlaySoundlessReaction() {
  if (Math.random() < 0.35) showBubbleMessage("🐶 *happy tail wagging*");
}

function interactWithPet() {
  const responses = ["🐶 Woof!","🐾 Tail wag!","❤️ Belly rub accepted.","🎾 Play with me!","👀 Who's there?"];
  petReact("pat");
  showBubbleMessage(responses[Math.floor(Math.random() * responses.length)]);
}

function walkTo(x, y, duration) {
  if (!window.pixelPet?.movePet) return;
  const pet = activePet();
  pet.classList.remove("idle", "sleep", "happy");
  pet.classList.add("walk");
  walking = true;
  window.pixelPet.movePet(Math.round(x), Math.round(y), duration);
  setTimeout(() => {
    walking = false;
    pet.classList.remove("walk");
    pet.classList.add("idle");
  }, duration);
}

function scheduleWander() {
  clearTimeout(wanderTimer);
  if (!wanderActive || state.mood === "sleepy") {
    wanderTimer = setTimeout(scheduleWander, 5000);
    return;
  }

  const margin = 35;
  const maxX = Math.max(margin, window.screen.availWidth - 390);
  const maxY = Math.max(margin, window.screen.availHeight - 390);
  const x = margin + Math.random() * Math.max(1, maxX - margin);
  const y = margin + Math.random() * Math.max(1, maxY - margin);
  const duration = 900 + Math.floor(Math.random() * 1400);

  walkTo(x, y, duration);
  wanderTimer = setTimeout(scheduleWander, duration + 2500 + Math.random() * 3500);
}

setTimeout(scheduleWander, 3000);
scheduleRandomBehavior();
