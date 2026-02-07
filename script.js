const screens = Array.from(document.querySelectorAll(".screen"));
const endingIndex = screens.findIndex((screen) => screen.querySelector("#confetti"));
const linesByScreen = new Map();
const revealsByScreen = new Map();
const mediaByScreen = new Map();
const photosByScreen = new Map();
const timers = [];
const visitedScreens = new Set();
const counterNode = document.getElementById("love-counter");
const startDate = new Date(2025, 4, 22, 0, 0, 0, 0);
let midnightTimerId = null;
const noMessage = document.getElementById("no-msg");
const yesButton = document.getElementById("yes-btn");
const noButton = document.getElementById("no-btn");
const surpriseMessage = document.getElementById("surprise-msg");
let noClickCount = 0;
const randomOffset = (max) => Math.floor(Math.random() * (max * 2 + 1)) - max;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
let counterMode = "ymd";
let heartbeatOn = false;

const schedule = (fn, delay) => {
  const id = setTimeout(fn, delay);
  timers.push(id);
};

const clearTimers = () => {
  while (timers.length) {
    clearTimeout(timers.pop());
  }
};

const createTapHeart = (x, y) => {
  const heart = document.createElement("span");
  heart.className = "tap-heart";
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heart.style.setProperty("--scale", randomFloat(0.8, 1.3));
  document.body.appendChild(heart);
  setTimeout(() => {
    heart.remove();
  }, 1600);
};

const showScreen = (index) => {
  clearTimers();
  screens.forEach((screen, i) => {
    screen.classList.toggle("active", i === index);
  });

  const screen = screens[index];
  const lines = linesByScreen.get(screen) || [];
  const reveals = revealsByScreen.get(screen) || [];
  const photos = photosByScreen.get(screen) || [];
  const media = mediaByScreen.get(screen) || [];
  const hasVisited = visitedScreens.has(index);

  lines.forEach((line) => line.classList.remove("show"));
  reveals.forEach((item) => item.classList.remove("show"));
  media.forEach((item) => item.classList.remove("show"));
  photos.forEach((photo) => photo.classList.remove("show"));

  if (hasVisited) {
    lines.forEach((line) => line.classList.add("show"));
    reveals.forEach((item) => item.classList.add("show"));
    photos.forEach((photo) => photo.classList.add("show"));
    media.forEach((item) => item.classList.add("show"));
  } else {
    lines.forEach((line) => {
      const delay = Number(line.dataset.delay || 0);
      schedule(() => line.classList.add("show"), delay);
    });

    reveals.forEach((item) => {
      const delay = Number(item.dataset.delay || 0);
      schedule(() => item.classList.add("show"), delay);
    });

    media.forEach((item) => {
      const delay = Number(item.dataset.delay || 0);
      schedule(() => item.classList.add("show"), delay);
    });

    photos.forEach((photo) => {
      const delay = Number(photo.dataset.delay || 0);
      schedule(() => photo.classList.add("show"), delay);
    });

    visitedScreens.add(index);
  }

  if (index === endingIndex) {
    startConfetti();
  } else {
    stopConfetti();
  }
};

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const getDurationSince = (start, end) => {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    const prevMonth = end.getMonth() - 1;
    const prevYear = prevMonth < 0 ? end.getFullYear() - 1 : end.getFullYear();
    const prevMonthIndex = (prevMonth + 12) % 12;
    days += daysInMonth(prevYear, prevMonthIndex);
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
};

const formatUnit = (value, label) => `${value} ${label}${value === 1 ? "" : "s"}`;

const updateLoveCounter = () => {
  if (!counterNode) return;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (counterMode === "days") {
    const totalDays = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
    counterNode.textContent = `${formatUnit(totalDays, "day")}`;
  } else {
    const diff = getDurationSince(startDate, now);
    counterNode.textContent = `${formatUnit(diff.years, "year")} ${formatUnit(diff.months, "month")} ${formatUnit(diff.days, "day")}`;
  }
};

const scheduleMidnightUpdate = () => {
  if (!counterNode) return;
  if (midnightTimerId) {
    clearTimeout(midnightTimerId);
  }
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const msUntil = nextMidnight.getTime() - now.getTime();
  midnightTimerId = setTimeout(() => {
    updateLoveCounter();
    scheduleMidnightUpdate();
  }, msUntil);
};

const setup = () => {
  const contentCards = Array.from(document.querySelectorAll(".content"));

  screens.forEach((screen) => {
    linesByScreen.set(screen, Array.from(screen.querySelectorAll(".line")));
    revealsByScreen.set(screen, Array.from(screen.querySelectorAll(".reveal")));
    photosByScreen.set(screen, Array.from(screen.querySelectorAll(".photo")));
    mediaByScreen.set(screen, Array.from(screen.querySelectorAll(".video-box")));
  });

  contentCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--glow-x", `${x}%`);
      card.style.setProperty("--glow-y", `${y}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--glow-x", "50%");
      card.style.setProperty("--glow-y", "30%");
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const activeIndex = screens.findIndex((screen) => screen.classList.contains("active"));

    if (action === "next") {
      showScreen(Math.min(activeIndex + 1, screens.length - 1));
    }

    if (action === "prev") {
      showScreen(Math.max(activeIndex - 1, 0));
    }

    if (action === "final") {
      const targetIndex = endingIndex >= 0 ? endingIndex : screens.length - 1;
      showScreen(targetIndex);
    }

    if (action === "replay") {
      visitedScreens.clear();
      showScreen(0);
    }

    if (action === "not-ready") {
      const message = document.getElementById("not-ready-msg");
      if (message) {
        message.classList.add("show", "alert");
      }
      target.classList.add("hidden");
    }

    if (action === "heartbeat") {
      heartbeatOn = !heartbeatOn;
      document.body.classList.toggle("heartbeat-on", heartbeatOn);
      target.setAttribute("aria-pressed", heartbeatOn ? "true" : "false");
    }

    if (action === "surprise") {
      if (surpriseMessage) {
        surpriseMessage.classList.add("show");
      }
      target.classList.add("hidden");
    }

    if (action === "no") {
      noClickCount += 1;
      if (noMessage) {
        noMessage.classList.add("show", "compact", "alert");
      }
      if (yesButton) {
        yesButton.style.transform = `scale(${1 + noClickCount * 0.08})`;
      }
      if (noButton) {
        const shrinkScale = Math.max(0, 1 - noClickCount * 0.12);
        const offsetX = randomOffset(40);
        const offsetY = randomOffset(24);
        if (shrinkScale <= 0.3) {
          noButton.classList.add("hidden");
        } else {
          noButton.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${shrinkScale})`;
        }
      }
    }
  });

  if (counterNode) {
    counterNode.addEventListener("click", () => {
      counterMode = counterMode === "ymd" ? "days" : "ymd";
      updateLoveCounter();
    });

    counterNode.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        counterMode = counterMode === "ymd" ? "days" : "ymd";
        updateLoveCounter();
      }
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    createTapHeart(event.clientX, event.clientY);
  });

  updateLoveCounter();
  scheduleMidnightUpdate();
  showScreen(0);
};

let confettiId = null;
let confettiParticles = [];

const startConfetti = () => {
  const canvas = document.getElementById("confetti");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resize();
  window.addEventListener("resize", resize);

  if (!confettiParticles.length) {
    confettiParticles = Array.from({ length: 80 }, () => createParticle(canvas));
  }

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach((particle) => updateParticle(ctx, particle, canvas));
    confettiId = requestAnimationFrame(render);
  };

  render();
};

const stopConfetti = () => {
  if (confettiId) {
    cancelAnimationFrame(confettiId);
    confettiId = null;
  }
};

const createParticle = (canvas) => ({
  x: Math.random() * canvas.width,
  y: Math.random() * -canvas.height,
  size: 6 + Math.random() * 6,
  speed: 1.2 + Math.random() * 1.8,
  tilt: Math.random() * 10 - 5,
  color: Math.random() > 0.5 ? "#ff5f8a" : "#ffd0a6",
});

const updateParticle = (ctx, particle, canvas) => {
  particle.y += particle.speed;
  particle.x += particle.tilt * 0.3;

  if (particle.y > canvas.height + 20) {
    particle.y = -20;
    particle.x = Math.random() * canvas.width;
  }

  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.ellipse(particle.x, particle.y, particle.size * 0.5, particle.size, 0, 0, Math.PI * 2);
  ctx.fill();
};

setup();
