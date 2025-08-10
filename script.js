<!-- tic-tac-toe.js (enhanced) -->
<script>
"use strict";

/**
 * Enhanced Tic‑Tac‑Toe:
 * - Clean state management (board[], currentPlayer, moves, gameOver)
 * - Draw detection + winner highlight
 * - Scoreboard with localStorage persistence
 * - New Game (keep scores) vs Reset All (clear scores)
 * - Accessibility: keyboard play (arrows/Enter), ARIA roles, live announcements
 * - Mobile haptics (vibrate) and graceful fallbacks
 * - Defensive selectors (supports legacy class names)
 */

(function () {
  // -----------------------------
  // DOM helpers & selectors
  // -----------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Support both old and improved class names
  const boxes = $$(".box");
  const resetBtn = $("#reset-btn");   // Reset ALL (scores + board)
  const newGameBtn = $("#newgm-btn"); // New game (board only)
  const msgContainer = document.querySelector(".msgcountainer") || $(".msg-container");
  const msg = $("#msg") || (function () {
    const el = document.createElement("div");
    el.id = "msg";
    msgContainer?.appendChild(el);
    return el;
  })();

  // Optional scoreboard elements (create if missing)
  const scoreXEl = $("#score-x");
  const scoreOEl = $("#score-o");
  const scoreDrawEl = $("#score-draw");

  // Build an aria-live region for screen readers
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("role", "status");
  live.style.position = "absolute";
  live.style.left = "-9999px";
  document.body.appendChild(live);

  if (!boxes.length) {
    console.warn("[TicTacToe] No .box elements found.");
    return;
  }

  // Attach indices & accessibility roles
  boxes.forEach((box, i) => {
    box.dataset.idx = String(i);
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", `Cell ${i + 1}, empty`);
    box.setAttribute("tabindex", "0");
  });

  // -----------------------------
  // Game constants & state
  // -----------------------------
  const WIN_PATTERNS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  const STORAGE_KEY = "ttt.scoreboard.v1";

  let board = Array(9).fill(""); // "", "X", "O"
  let currentPlayer = "X";
  let moves = 0;
  let gameOver = false;
  let scores = loadScores(); // {X, O, draws}

  updateScoreboard();
  hideMessage();

  // -----------------------------
  // Event wiring
  // -----------------------------
  boxes.forEach((box) => {
    box.addEventListener("click", onBoxClick);
    // Keyboard support: Enter/Space to play; arrows to move focus
    box.addEventListener("keydown", onBoxKeydown);
  });

  newGameBtn?.addEventListener("click", newGame);
  resetBtn?.addEventListener("click", resetAll);

  // Allow pressing "n" for new game, "r" for reset, "f" to focus first cell
  document.addEventListener("keydown", (e) => {
    if (e.key === "n" || e.key === "N") newGame();
    else if (e.key === "r" || e.key === "R") resetAll();
    else if (e.key === "f" || e.key === "F") boxes[0]?.focus();
  });

  // -----------------------------
  // Handlers
  // -----------------------------
  function onBoxClick(e) {
    const box = e.currentTarget;
    const idx = Number(box.dataset.idx);
    playAt(idx, box);
  }

  function onBoxKeydown(e) {
    const box = e.currentTarget;
    const idx = Number(box.dataset.idx);

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        playAt(idx, box);
        break;
      case "ArrowRight":
        e.preventDefault();
        focusNext(idx, +1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusNext(idx, -1);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusNext(idx, +3);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusNext(idx, -3);
        break;
    }
  }

  // -----------------------------
  // Core gameplay
  // -----------------------------
  function playAt(idx, box) {
    if (gameOver || board[idx]) return;

    board[idx] = currentPlayer;
    moves++;

    setBoxState(box, currentPlayer);

    vibrate(10);

    const win = getWin(board);
    if (win) {
      handleWin(win.winner, win.line);
      return;
    }
    if (moves === 9) {
      handleDraw();
      return;
    }

    // Switch player
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnMessage();
  }

  function getWin(state) {
    for (const line of WIN_PATTERNS) {
      const [a, b, c] = line;
      if (state[a] && state[a] === state[b] && state[b] === state[c]) {
        return { winner: state[a], line };
      }
    }
    return null;
  }

  function handleWin(winner, line) {
    gameOver = true;
    highlightWin(line);
    disableAllBoxes();

    scores[winner]++;
    persistScores();
    updateScoreboard();

    showMessage(`🎉 Congratulations! Player ${winner} wins!`);
    live.textContent = `Player ${winner} wins`;

    // Focus the first box in the winning line for keyboard users
    boxes[line[0]]?.focus();
  }

  function handleDraw() {
    gameOver = true;
    scores.draws++;
    persistScores();
    updateScoreboard();
    showMessage("🤝 It's a draw.");
    live.textContent = "Game ended in a draw";
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  function setBoxState(box, value) {
    box.textContent = value;
    setDisabled(box, true);
    box.setAttribute("aria-label", `Cell ${Number(box.dataset.idx) + 1}, ${value}`);
    box.classList.remove("win");
  }

  function enableAllBoxes() {
    boxes.forEach((b, i) => {
      b.textContent = board[i];
      setDisabled(b, Boolean(board[i]));
      b.classList.remove("win", "draw");
      b.setAttribute(
        "aria-label",
        `Cell ${i + 1}, ${board[i] ? board[i] : "empty"}`
      );
    });
  }

  function disableAllBoxes() {
    boxes.forEach((b) => setDisabled(b, true));
  }

  function highlightWin(line) {
    line.forEach((i) => boxes[i]?.classList.add("win"));
  }

  function focusNext(currentIdx, delta) {
    const next = (currentIdx + delta + 9) % 9;
    boxes[next]?.focus();
  }

  function showMessage(text) {
    if (!msgContainer) return;
    msg.textContent = text;
    msgContainer.classList.remove("hide");
  }

  function hideMessage() {
    msgContainer?.classList.add("hide");
    msg.textContent = "";
  }

  function updateTurnMessage() {
    // Optional live announcement; keep UI uncluttered
    live.textContent = `Turn: Player ${currentPlayer}`;
  }

  function setDisabled(el, value) {
    // Works for buttons & divs
    if ("disabled" in el) el.disabled = !!value;
    el.setAttribute("aria-disabled", value ? "true" : "false");
    el.classList.toggle("is-disabled", !!value);
  }

  function vibrate(ms) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }

  // -----------------------------
  // Scoreboard (persistent)
  // -----------------------------
  function loadScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          X: Number(parsed.X) || 0,
          O: Number(parsed.O) || 0,
          draws: Number(parsed.draws) || 0,
        };
      }
    } catch {}
    return { X: 0, O: 0, draws: 0 };
  }

  function persistScores() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }

  function updateScoreboard() {
    if (scoreXEl) scoreXEl.textContent = String(scores.X);
    if (scoreOEl) scoreOEl.textContent = String(scores.O);
    if (scoreDrawEl) scoreDrawEl.textContent = String(scores.draws);
  }

  // -----------------------------
  // Public actions
  // -----------------------------
  function newGame() {
    // resets only the board; keeps scores
    board.fill("");
    moves = 0;
    currentPlayer = Math.random() < 0.5 ? "X" : "O"; // randomize starter
    gameOver = false;
    hideMessage();
    enableAllBoxes();
    updateTurnMessage();
    boxes[0]?.focus();
  }

  function resetAll() {
    // clears board + scores
    newGame();
    scores = { X: 0, O: 0, draws: 0 };
    persistScores();
    updateScoreboard();
  }

  // Expose tiny API (optional)
  window.T3 = { newGame, resetAll, scores: () => ({ ...scores }) };

  // Start a new game on load
  newGame();
})();
</script>
