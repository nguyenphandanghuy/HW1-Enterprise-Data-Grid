
import "./style.css";

const audioInput = document.querySelector("#audio-input");
const addDemoButton = document.querySelector("#add-demo");
const clearQueueButton = document.querySelector("#clear-queue");
const queueList = document.querySelector("#queue-list");
const queueCount = document.querySelector("#queue-count");
const statusMessage = document.querySelector("#status-message");
const nowPlaying = document.querySelector("#now-playing");
const canvas = document.querySelector("#visualizer-canvas");
const ctx = canvas.getContext("2d");

const FFT_SIZE = 512;
const DEMO_DURATION_MS = 1800;

let audioContext = null;
let analyser = null;
let currentSource = null;
let animationId = null;
let currentTask = null;
let queue = [];
let nextTaskId = 1;
let isProcessing = false;
let destroyed = false;

function setStatus(message) {
  statusMessage.textContent = message;
}

function drawIdleVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bars = 64;
  const gap = 5;
  const barWidth = (canvas.width - gap * (bars - 1)) / bars;

  for (let i = 0; i < bars; i += 1) {
    const height = 5 + Math.abs(Math.sin(i * 0.32)) * 14;
    const x = i * (barWidth + gap);
    const y = canvas.height / 2 - height / 2;

    ctx.fillStyle = "#34466d";
    ctx.fillRect(x, y, barWidth, height);
  }
}

function renderVisualizer() {
  if (!analyser || destroyed) return;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bars = 64;
  const gap = 5;
  const barWidth = (canvas.width - gap * (bars - 1)) / bars;
  const step = Math.max(1, Math.floor(data.length / bars));

  for (let i = 0; i < bars; i += 1) {
    const value = data[i * step] / 255;
    const height = Math.max(4, value * canvas.height * 0.85);
    const x = i * (barWidth + gap);
    const y = (canvas.height - height) / 2;

    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, "#48d9a0");
    gradient.addColorStop(1, "#7c9cff");

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, height);
  }

  animationId = requestAnimationFrame(renderVisualizer);
}

function startVisualization() {
  stopVisualization();

  if (analyser) {
    renderVisualizer();
  } else {
    drawIdleVisualizer();
  }
}

function stopVisualization() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function renderQueue() {
  queueCount.textContent = `${queue.length + (currentTask ? 1 : 0)} tasks`;
  queueList.replaceChildren();

  if (queue.length === 0 && !currentTask) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Your queue is empty.";
    queueList.append(empty);
    return;
  }

  const tasks = [];

  if (currentTask) {
    tasks.push({ ...currentTask, displayStatus: "PROCESSING" });
  }

  queue.forEach((task) => {
    tasks.push({ ...task, displayStatus: "QUEUED" });
  });

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "queue-item";

    const details = document.createElement("div");

    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.name;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `Task #${task.id} · ${task.type}`;

    details.append(name, meta);

    const badge = document.createElement("span");
    badge.className = "task-status";
    badge.textContent = task.displayStatus;

    item.append(details, badge);
    queueList.append(item);
  });
}

function ensureAudioGraph() {
  if (audioContext) return;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("This browser does not support the Web Audio API.");
  }

  audioContext = new AudioContextClass();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.8;
  analyser.connect(audioContext.destination);
}

function enqueueTask(task) {
  if (destroyed) return;

  queue.push(task);
  renderQueue();
  setStatus(`Added "${task.name}" to the FIFO queue.`);
  processNextTask();
}

function addDemoTask() {
  enqueueTask({
    id: nextTaskId++,
    name: `Demo audio task ${nextTaskId - 1}`,
    type: "DEMO",
    file: null,
    cancelled: false,
  });
}

function addAudioFile(file) {
  if (!file) return;

  if (!file.type.startsWith("audio/")) {
    setStatus("Please select a valid audio file.");
    return;
  }

  const task = {
    id: nextTaskId++,
    name: file.name,
    type: "AUDIO",
    file,
    cancelled: false,
  };

  enqueueTask(task);
}

function waitForDemo(task) {
  return new Promise((resolve, reject) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 220 + (task.id % 6) * 55;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(analyser);

    currentSource = oscillator;

    const startTime = audioContext.currentTime;
    oscillator.start();

    const timeoutId = window.setTimeout(() => {
      if (task.cancelled || destroyed) {
        reject(new Error("Task cancelled."));
        return;
      }

      resolve();
    }, DEMO_DURATION_MS);

    task.cleanup = () => {
      window.clearTimeout(timeoutId);

      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have stopped.
      }

      oscillator.disconnect();
      gain.disconnect();
    };

    task.startTime = startTime;
  });
}

async function playAudioFile(task) {
  const arrayBuffer = await task.file.arrayBuffer();

  if (task.cancelled || destroyed) {
    throw new Error("Task cancelled.");
  }

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (task.cancelled || destroyed) {
    throw new Error("Task cancelled.");
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);

  currentSource = source;

  return new Promise((resolve, reject) => {
    source.onended = () => {
      if (task.cancelled || destroyed) {
        reject(new Error("Task cancelled."));
      } else {
        resolve();
      }
    };

    task.cleanup = () => {
      source.onended = null;

      try {
        source.stop();
      } catch {
        // The source may already have stopped.
      }

      source.disconnect();
    };

    source.start();
  });
}

async function processTask(task) {
  ensureAudioGraph();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (task.cancelled || destroyed) {
    throw new Error("Task cancelled.");
  }

  if (task.type === "DEMO") {
    await waitForDemo(task);
  } else {
    await playAudioFile(task);
  }
}

async function processNextTask() {
  if (isProcessing || destroyed) return;

  const task = queue.shift();

  if (!task) {
    currentTask = null;
    renderQueue();
    nowPlaying.textContent = "No task is being processed.";
    return;
  }

  isProcessing = true;
  currentTask = task;
  renderQueue();
  nowPlaying.textContent = `Processing: ${task.name}`;
  setStatus(`Processing task #${task.id}...`);

  startVisualization();

  try {
    await processTask(task);

    if (!task.cancelled && !destroyed) {
      setStatus(`Completed "${task.name}".`);
    }
  } catch (error) {
    if (!task.cancelled && !destroyed) {
      setStatus(`Task failed: ${error.message}`);
    }
  } finally {
    task.cleanup?.();
    currentSource = null;
    currentTask = null;
    isProcessing = false;

    if (!destroyed) {
      renderQueue();
      processNextTask();
    }
  }
}

function clearQueue() {
  const queuedCount = queue.length;
  queue.forEach((task) => {
    task.cancelled = true;
  });
  queue = [];

  if (currentTask) {
    currentTask.cancelled = true;
    currentTask.cleanup?.();

    try {
      currentSource?.stop();
    } catch {
      // The source may already have stopped.
    }
  }

  stopVisualization();
  drawIdleVisualizer();
  renderQueue();

  if (currentTask) {
    setStatus(`Cancelled current task and cleared ${queuedCount} queued task(s).`);
  } else {
    setStatus(`Cleared ${queuedCount} queued task(s).`);
  }

  if (!currentTask) {
    nowPlaying.textContent = "No task is being processed.";
  }
}

function handlePageHide() {
  destroyed = true;
  queue.forEach((task) => {
    task.cancelled = true;
  });
  queue = [];

  if (currentTask) {
    currentTask.cancelled = true;
    currentTask.cleanup?.();
  }

  try {
    currentSource?.stop();
  } catch {
    // The source may already have stopped.
  }

  stopVisualization();

  if (audioContext && audioContext.state !== "closed") {
    void audioContext.close();
  }
}

addDemoButton.addEventListener("click", addDemoTask);

clearQueueButton.addEventListener("click", clearQueue);

audioInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (file) {
    addAudioFile(file);
  }

  audioInput.value = "";
});

window.addEventListener("pagehide", handlePageHide);

drawIdleVisualizer();
renderQueue();
