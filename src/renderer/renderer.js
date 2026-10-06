const cat = document.getElementById("cat");
const bubble = document.getElementById("bubble");

let hideTimer;

function speak(message, duration = 2600) {
  bubble.textContent = message;
  bubble.classList.remove("hidden");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => bubble.classList.add("hidden"), duration);
}

cat.addEventListener("dblclick", () => {
  const command = prompt("Talk to PixelPet:");
  if (!command) return;

  const text = command.trim().toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    speak("Meow! I'm PixelPet. 🐾");
  } else if (text.includes("who are you")) {
    speak("I'm your tiny desktop coworker.");
  } else if (text.includes("focus")) {
    speak("Okay. Let's get something done. 🎯");
  } else if (text.includes("sleep")) {
    speak("Fine... five minutes. 😴");
    cat.classList.add("sleep");
  } else {
    speak("Hmm. I don't know that one yet — teach me! ✨", 3200);
  }
});

cat.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  speak("Right-click menu coming soon. 🐾");
});

cat.addEventListener("mouseenter", () => {
  cat.classList.add("walk");
});

cat.addEventListener("mouseleave", () => {
  cat.classList.remove("walk");
});

setTimeout(() => speak("Hi! I'm PixelPet. Double-click me. 🐾", 3500), 900);
