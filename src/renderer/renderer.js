const cat = document.getElementById("cat");
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

function mood(name) {
  cat.classList.remove("happy", "sleep", "walk");
  if (name === "sleepy") cat.classList.add("sleep");
  if (name === "happy") cat.classList.add("happy");
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
    "• sleep"
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
    addMessage("Meow! I'm PixelPet. 🐾 No AI needed — I'm powered by local commands.");
    return;
  }

  if (text === "who are you") {
    addMessage("I'm your tiny desktop coworker. I live locally on your Mac.");
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

cat.addEventListener("mouseenter", () => {
  if (state.mood !== "sleepy") cat.classList.add("walk");
});

cat.addEventListener("mouseleave", () => cat.classList.remove("walk"));

cat.addEventListener("click", () => {
  input.focus();
});

setInterval(checkReminders, 1000);
setTimeout(() => {
  addMessage("Hi! I'm PixelPet. 🐾");
  addMessage("Everything here runs locally. Type 'help' to try me.");
}, 700);
