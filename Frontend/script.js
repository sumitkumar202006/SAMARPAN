// -------------------- DUMMY LEADERBOARD DATA --------------------
const dummyLeaderboard = [
  { rank: 1, name: "MindBreaker", rating: 1842, quizzes: 127, avgScore: "92%", bestRank: "#1" },
  { rank: 2, name: "QuizSniper", rating: 1765, quizzes: 119, avgScore: "89%", bestRank: "#1" },
  { rank: 3, name: "NightCrawler", rating: 1710, quizzes: 102, avgScore: "87%", bestRank: "#2" },
  { rank: 4, name: "RaptorX", rating: 1669, quizzes: 98, avgScore: "85%", bestRank: "#3" },
  { rank: 5, name: "ShadowWizard", rating: 1622, quizzes: 110, avgScore: "84%", bestRank: "#4" },
  { rank: 6, name: "NeonSamurai", rating: 1592, quizzes: 88, avgScore: "81%", bestRank: "#4" },
  { rank: 7, name: "Brainiac_07", rating: 1544, quizzes: 73, avgScore: "79%", bestRank: "#5" },
  { rank: 8, name: "QuizMachine", rating: 1520, quizzes: 91, avgScore: "77%", bestRank: "#6" },
  { rank: 9, name: "HyperNova", rating: 1488, quizzes: 68, avgScore: "75%", bestRank: "#7" },
  { rank: 10, name: "BlitzPanda", rating: 1455, quizzes: 80, avgScore: "72%", bestRank: "#8" }
];
(function () {
  // ======================
  // Basic configuration
  // ======================
  const API_BASE = (function() {
    // If running on Vercel production domain, use your Render backend
    if (location.hostname === "samarpan-quiz.vercel.app") {
      return "https://samarpan-9rt8.onrender.com";
    }
    // fallback to localhost (dev)
    return "http://127.0.0.1:5000";
  })();

  // ======================
  // Real-time (Socket.io)
  // ======================
  const socket = io(API_BASE);
  let currentRoomPin = null;
  let isHost = false; 

  socket.on("connect", () => {
    console.log("Connected to Samarpan real-time server");
  });

  socket.on("user_joined", (data) => {
    console.log("Room players update:", data.players);
    renderPlayerList(data.players);
  });

  socket.on("player_list_update", (data) => {
    renderPlayerList(data.players);
  });

  socket.on("kicked", (data) => {
    alert(data.message || "You were kicked from the lobby.");
    showView("dashboard");
    currentRoomPin = null;
    isHost = false;
  });

  socket.on("next_question", (data) => {
    console.log("Host triggered next question:", data.index);
    playerIndex = data.index;
    
    // Hide leaderboard if visible
    const lb = document.getElementById("liveLeaderboardOverlay");
    if (lb) lb.style.display = "none";

    // Reset host stats if host
    const statsContainer = document.getElementById("hostStatsContainer");
    if (statsContainer) statsContainer.innerHTML = "";
    
    renderPlayerQuestion();
  });

  socket.on("stats_update", (data) => {
    if (!isHost) return;
    const statsContainer = document.getElementById("hostStatsContainer");
    if (!statsContainer) return;

    const total = data.stats.reduce((a, b) => a + b, 0);
    statsContainer.innerHTML = `<p style="font-size:0.8rem; color:#9ca3af; margin-bottom:5px;">Responses: ${total}</p>` + 
      data.stats.map((count, i) => `
      <div style="height:8px; background:#1f2937; border-radius:4px; margin-bottom:4px; overflow:hidden;">
        <div style="width:${total > 0 ? (count/total)*100 : 0}%; height:100%; background:var(--accent-neon); transition:width 0.3s ease;"></div>
      </div>
    `).join("");
  });

  socket.on("sync_leaderboard", (data) => {
    const lb = document.getElementById("liveLeaderboardOverlay");
    if (!lb) return;
    
    if (data.visible) {
      const list = document.getElementById("liveLeaderboardList");
      if (list) {
        list.innerHTML = data.leaderboard
          .map((p, i) => `<li><span>${i+1}. ${p.name}</span><strong>${p.score}</strong></li>`)
          .join("");
      }
      lb.style.display = "flex";
    } else {
      lb.style.display = "none";
    }
  });

  socket.on("game_started", () => {
    console.log("Game is starting for everyone!");
  });

  // ======================
  // Shared Hosting Logic
  // ======================

    function renderPlayerList(players) {
      const grid = document.getElementById("lobbyPlayerGrid");
      const countEl = document.getElementById("playerCount");
      const btnStart = document.getElementById("btnStartGame");

      if (!grid) return;
      grid.innerHTML = "";

      const playerEntries = Object.entries(players);
      if (playerEntries.length === 0) {
        grid.innerHTML = '<div class="empty-lobby-msg">Waiting for players to join...</div>';
      }

      playerEntries.forEach(([id, p]) => {
        const bubble = document.createElement("div");
        bubble.className = "player-bubble";
        bubble.style.position = "relative";
        bubble.textContent = p.name;

        // If I am the host, I can moderate others
        if (isHost && id !== socket.id) {
          const modOverlay = document.createElement("div");
          modOverlay.style.cssText = "position:absolute; top:-10px; right:-10px; display:flex; gap:4px;";
          
          const kickBtn = document.createElement("span");
          kickBtn.textContent = "✖";
          kickBtn.title = "Kick player";
          kickBtn.style.cssText = "cursor:pointer; background:#ef4444; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; border:1px solid #000;";
          kickBtn.onclick = (e) => {
            e.stopPropagation();
            window.kickPlayer(id);
          };

          const banBtn = document.createElement("span");
          banBtn.textContent = "🚫";
          banBtn.title = "Ban player";
          banBtn.style.cssText = "cursor:pointer; background:var(--accent-red); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; border:1px solid #000;";
          banBtn.onclick = (e) => {
            e.stopPropagation();
            window.banPlayer(id, p.name);
          };

          modOverlay.appendChild(kickBtn);
          modOverlay.appendChild(banBtn);
          bubble.appendChild(modOverlay);
        }
        grid.appendChild(bubble);
      });

      if (countEl) countEl.textContent = playerEntries.length;
      if (btnStart) btnStart.disabled = playerEntries.length === 0;
    }

    // Global moderation functions
    window.kickPlayer = (id) => {
      socket.emit("host_kick", { pin: currentRoomPin, playerId: id });
    };
    window.banPlayer = (id, name) => {
      if(confirm(`Permanently ban ${name}?`)) {
        socket.emit("host_ban", { pin: currentRoomPin, playerId: id, name });
      }
    };

    // ======================
    // Shared Quiz/Battle Handlers (Moved to Top-Level)
    // ======================
    
    // Join Battle Button
    const btnBattleJoin = document.getElementById("btnBattleJoin");
    if (btnBattleJoin) {
      btnBattleJoin.addEventListener("click", () => {
        const pin = document.getElementById("battleJoinPin")?.value.trim() || "";
        const name = document.getElementById("battleJoinName")?.value.trim() || "";

        if (!pin || !name) {
          alert("Please enter both the Battle PIN and your Name.");
          return;
        }

        console.log(">>> JOIN ATTEMPT:", { pin, name });
        
        // Emit join event via global socket
        socket.emit("join_room", { pin, name });

        // Transition to lobby (player view)
        setupPlayerLobby(pin, name);
      });
    }

    // Lobby: Start Game Button (Host ONLY)
    const btnStartGame = document.getElementById("btnStartGame");
    if (btnStartGame) {
      btnStartGame.addEventListener("click", () => {
        if (!currentRoomPin) {
          alert("No active session found.");
          return;
        }
        console.log(">>> HOST STARTING GAME:", currentRoomPin);
        socket.emit("start_game", currentRoomPin);
      });
    }

    // Socket: Game Started (Global Listener)
    socket.on("game_started", async () => {
      console.log(">>> RECEIVED GAME_STARTED FOR PIN:", currentRoomPin);
      if (!currentRoomPin) return;

      try {
        // Fetch the session data first to get the quiz questions
        const resp = await fetch(`${API_BASE}/api/host/session/${currentRoomPin}`);
        if (!resp.ok) throw new Error("Could not load session data");
        const session = await resp.json();
        
        if (session && session.quiz) {
          console.log(">>> STARTING QUIZ PLAYER FOR SESSION:", session._id);
          startQuizPlayer(session.quiz);
        } else {
          alert("Error: Quiz data missing in session.");
        }
      } catch (err) {
        console.error("Failed to transition to game:", err);
        alert("Wait... something went wrong while starting the game.");
      }
    });

    // Host Battle Button
    const btnBattleHost = document.getElementById("btnBattleHost");
    if (btnBattleHost) {
      btnBattleHost.addEventListener("click", async () => {
        if (!requireLogin("Please log in to host a battle.")) return;
        const user = getCurrentUser();
        const selectQuiz = document.getElementById("battle-quiz");
        const statusEl = document.getElementById("battleStatus");
        
        if (!selectQuiz || !selectQuiz.value) {
          alert("Please select a quiz first.");
          return;
        }

        const userKeyPart = user.userId || user._id || user.email;
        let key = selectQuiz.value === "manual-last" 
          ? `samarpanLastManualQuiz_${userKeyPart}` 
          : `samarpanLastAIQuiz_${userKeyPart}`;
        
        const raw = localStorage.getItem(key);
        const quiz = raw && safeParse(raw, null);
        
        // Validation: Ensure the quiz actually exists and has been saved to the database
        const quizId = quiz && (quiz._id || quiz.quizId);

        if (!quizId || String(quizId).length < 20) {
          console.warn("Attempted to host unsaved/invalid quiz:", { key, quizId });
          alert("This quiz isn't saved to your account yet. Please go to the Creator section, 'Save' your manual quiz, and then try hosting it!");
          return;
        }

        try {
          if (statusEl) statusEl.textContent = "Creating battle...";
          const res = await fetch(`${API_BASE}/api/host/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId,
              hostEmail: user.email,
              mode: "battle",
              battleType: document.getElementById("battle-type")?.value || "2v2",
              timerSeconds: document.getElementById("battle-timer")?.value || 30,
              rated: document.getElementById("battle-rated")?.value === "rated"
            }),
          });
          const data = await res.json();
          if (res.ok) {
            isHost = true; // I created it, I am host
            setupHostLobby(data.pin);
          } else {
            alert("Host Error: " + (data.error || "Failed to start"));
          }
        } catch (err) {
          console.error("Host fetch error:", err);
          alert("Network error while hosting.");
        }
      });
    }

    // Host Quiz Button (from Host View)
    const btnHostStart = document.getElementById("btnHostStart");
    if (btnHostStart) {
      btnHostStart.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user) return;
        const selectQuiz = document.getElementById("host-quiz");
        const statusEl = document.getElementById("hostStatus");

        if (!selectQuiz || !selectQuiz.value) {
          alert("Select a quiz first.");
          return;
        }

        // Similar logic to Battle Host, consolidated here
        const userKeyPart = user.userId || user._id || user.email;
        let key = selectQuiz.value === "manual-last" 
          ? `samarpanLastManualQuiz_${userKeyPart}` 
          : `samarpanLastAIQuiz_${userKeyPart}`;
        
        const raw = localStorage.getItem(key);
        const quiz = raw && safeParse(raw, null);
        const quizId = quiz && (quiz._id || quiz.quizId);

        if (!quizId || String(quizId).length < 20) {
          alert("Quiz not found in our database. If you manually created this quiz, please 'Save' it first!");
          return;
        }

        try {
          if (statusEl) statusEl.textContent = "Starting session...";
          const res = await fetch(`${API_BASE}/api/host/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId, hostEmail: user.email, mode: "quiz"
            })
          });
          const data = await res.json();
          if (res.ok) setupHostLobby(data.pin);
          else alert(data.error || "Start failed");
        } catch (err) { console.error(err); alert("Network error"); }
      });
    }

  function setupHostLobby(pin) {
    console.log("Setting up host lobby for PIN:", pin);
    currentRoomPin = pin;
    const lobbyPinDisplay = document.getElementById("lobbyPinDisplay");
    const lobbyPlayerGrid = document.getElementById("lobbyPlayerGrid");
    const playerCount = document.getElementById("playerCount");
    const btnStart = document.getElementById("btnStartGame");

    if (lobbyPinDisplay) lobbyPinDisplay.textContent = pin;
    if (lobbyPlayerGrid) {
      lobbyPlayerGrid.innerHTML = '<div class="empty-lobby-msg">Waiting for players to join...</div>';
    }
    if (playerCount) playerCount.textContent = "0";
    if (btnStart) {
      btnStart.disabled = true;
      btnStart.style.display = "block"; // Ensure it shows for host
    }

    // Join the room as host
    socket.emit("join_room", { pin, name: "Host" });

    showView("lobby");
  }

  function setupPlayerLobby(pin, name) {
    console.log("Setting up player lobby for PIN:", pin, "as", name);
    currentRoomPin = pin; // CRITICAL: store the pin so we can transition when game starts
    const lobbyPinDisplay = document.getElementById("lobbyPinDisplay");
    const lobbyPlayerGrid = document.getElementById("lobbyPlayerGrid");
    const playerCount = document.getElementById("playerCount");
    const btnStart = document.getElementById("btnStartGame");
    const lobbyTitle = document.querySelector(".lobby-title");

    if (lobbyTitle) lobbyTitle.textContent = "Waiting for Host...";
    if (lobbyPinDisplay) lobbyPinDisplay.textContent = pin;
    if (lobbyPlayerGrid) {
      lobbyPlayerGrid.innerHTML = `<div class="player-bubble">${name} (You)</div>`;
    }
    if (playerCount) playerCount.textContent = "1";
    
    // Players cannot start the game
    if (btnStart) btnStart.style.display = "none";

    showView("lobby");
  }




  // ======================
  // Small helpers
  // ======================

  const safeParse = (s, fallback = null) => {
    try {
      return s ? JSON.parse(s) : fallback;
    } catch {
      return fallback;
    }
  };

  function getCurrentUser() {
    return safeParse(localStorage.getItem("samarpanUser"), null);
  }

  function setCurrentUser(obj) {
    if (!obj) return;
    localStorage.setItem("samarpanUser", JSON.stringify(obj));
  }

  function clearCurrentUser() {
    localStorage.removeItem("samarpanUser");
  }

  function showStatusText(el, message, color) {
    if (!el) return;
    el.style.color = color || "";
    el.textContent = message || "";
  }

  // Run callback once DOM is ready
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
// -------------------- INSERT DUMMY LEADERBOARD --------------------
function loadDummyLeaderboard() {
  const tableBody = document.getElementById("leaderboard-body") || document.getElementById("leaderboardBody");
  if (!tableBody) return;

  // clear existing rows (prevents duplicates on multiple calls)
  while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

  dummyLeaderboard.forEach(player => {
    // Normalize/sanitize values (avoid undefined)
    const rank = player.rank ?? "";
    // replace smart quotes with straight quotes to avoid weird encoding issues
    const name = String(player.name || "").replace(/[“”]/g, '"');
    const rating = player.rating ?? "";
    const quizzes = player.quizzes ?? "";
    const avgScore = player.avgScore ?? "";
    const bestRank = player.bestRank ?? "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${rank}</td>
      <td>${name}</td>
      <td>${rating}</td>
      <td>${quizzes}</td>
      <td>${avgScore}</td>
      <td>${bestRank}</td>
    `;
    tableBody.appendChild(row);
  });
}



  // ======================
  // View switching (SPA)
  // ======================
  function showView(name) {
    if (!name) return;
    const viewId = name.startsWith("view-") ? name : `view-${name}`;
    const next = document.getElementById(viewId);
    const views = Array.from(document.querySelectorAll(".view"));

    // Save to sessionStorage to preserve view across page reloads
    sessionStorage.setItem("samarpanCurrentView", name.replace(/^view-/, ""));

    // Hide all views
    views.forEach((v) => {
      v.classList.remove("view-active", "view-anim-in");
    });

    // Diagnostic Logging to UI (Temporary)
    const dbg = document.getElementById("debugConsole");
    if (dbg) {
      const line = document.createElement("div");
      line.textContent = `> showView: ${name} (ID: ${viewId}) - Found: ${!!next}`;
      dbg.prepend(line);
      if (dbg.childNodes.length > 5) dbg.removeChild(dbg.lastChild);
    }

    // Show selected view + entry animation
    if (next) {
      next.classList.add("view-active");
      void next.offsetWidth; // force reflow so animation restarts
      next.classList.add("view-anim-in");
    } else if (views[0]) {
      console.warn(`View ID ${viewId} not found, falling back to ${views[0].id}`);
      views[0].classList.add("view-active");
    }

    // Neon flash line under topbar
    const flash = document.getElementById("switchFlash");
    if (flash) {
      flash.classList.remove("flash-go");
      void flash.offsetWidth;
      flash.classList.add("flash-go");
    }

    // Background slight float/zoom on tab change
    const body = document.body;
    if (body) {
      body.classList.remove("bg-tab-float");
      void body.offsetWidth;
      body.classList.add("bg-tab-float");
    }

    // Staggered animation for cards / blocks in the new view
    if (next) {
      const blocks = next.querySelectorAll(
        ".card, .toolbar-list li, .templates-grid .card, .stats-row .card, .activity-list li"
      );

      blocks.forEach((el, index) => {
        el.classList.remove("stagger-in");
        el.style.animationDelay = `${index * 0.06}s`;
        void el.offsetWidth;
        el.classList.add("stagger-in");
      });
    }
  }

  // ======================
  // Auth modal helpers
  // ======================
  function openAuthModal() {
    const overlay = document.getElementById("authOverlay");
    const status = document.getElementById("authStatus");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    showStatusText(status, "", "#4b5563");
  }

  function closeAuthModal() {
    const overlay = document.getElementById("authOverlay");
    if (!overlay) return;
    overlay.classList.add("hidden");
  }

  // Gate features behind login and show modal if not logged in
  function requireLogin(message = "Please log in to use this feature.") {
    const user = getCurrentUser();
    if (!user) {
      openAuthModal();
      showStatusText(document.getElementById("authStatus"), message, "#b91c1c");
      return false;
    }
    return true;
  }

  // ===============================
  // Update UI when user logs in/out
  // ===============================
  function updateUIOnLogin(user) {
    const sidebarName = document.querySelector(".user-name");
    const sidebarRole = document.querySelector(".user-role");
    const sidebarAvatar = document.querySelector(".user-avatar");
    const avatarTop = document.getElementById("btnAvatarTop");
    const authBtnTop = document.getElementById("btnAuthTop");
    const btnLogout = document.getElementById("btnLogout");

    const profileDropdownWrapper = document.getElementById("profileDropdownWrapper");

    const displayName = (user && (user.name || user.email)) || "User";
    const firstLetter = displayName.charAt(0).toUpperCase();

    // Update all occurrences of user-name and user-role (e.g. in dropdown)
    document.querySelectorAll(".user-name").forEach(el => el.textContent = displayName);
    document.querySelectorAll(".user-role").forEach(el => el.textContent = user ? "Logged in" : "Host");

    if (avatarTop) {
      if (user && user.avatar) {
        avatarTop.innerHTML = `<img src="${user.avatar}" class="profile-img" alt="avatar">`;
      } else {
        avatarTop.textContent = firstLetter;
      }
    }

    if (authBtnTop) {
      if (user) {
        authBtnTop.style.display = "none";
      } else {
        authBtnTop.style.display = "inline-flex";
        authBtnTop.textContent = "Sign up / Log in";
      }
    }

    if (profileDropdownWrapper) {
      profileDropdownWrapper.style.display = user ? "inline-block" : "none";
    }

    // ---- PROFILE VIEW DATA ----
    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profileAvatar = document.getElementById("profileAvatar");

    if (profileName) {
      profileName.textContent = user?.name || user?.email || "User";
    }

    if (profileRole) {
      profileRole.textContent = "Host • Team Samarpan";
    }

    if (profileAvatar) {
      if (user?.avatar) {
        profileAvatar.innerHTML = `<img src="${user.avatar}" class="profile-img" />`;
      } else {
        profileAvatar.textContent =
          (user?.name || user?.email || "U").charAt(0).toUpperCase();
      }
    }

    // Sidebar avatar circle
    if (sidebarAvatar) {
      sidebarAvatar.innerHTML = "";

      if (user && user.avatar) {
        const img = document.createElement("img");
        img.src = user.avatar;
        img.alt = "avatar";
        img.className = "profile-img";
        sidebarAvatar.appendChild(img);
      } else {
        const letter = (user?.name || user?.email || "U")
          .charAt(0)
          .toUpperCase();
        sidebarAvatar.textContent = letter;
      }
    }
  }

  // ====================================
  // Social login token from redirect URL
  // ====================================
  function handleTokenInURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) return;

      const user = {
  token,
  userId: params.get("userId") || "",
  name: params.get("name") || "",
  email: params.get("email") || "",
  avatar: params.get("avatar") || "",
};

      setCurrentUser(user);
      updateUIOnLogin(user);

      const url = new URL(window.location);
      url.search = "";
      window.history.replaceState({}, document.title, url.toString());
    } catch (e) {
      console.warn("handleTokenInURL:", e);
    }
  }

  // ======================
  // Simple quiz player
  // ======================
  let playerQuiz = null;
  let playerIndex = 0;
  let playerCorrect = 0;
  let playerStartTime = 0;
  let playerQuestionStart = 0;
  let playerTimeLeft = 30;
  let playerInterval = null;

  function getPlayerEls() {
    return {
      title: document.getElementById("playerTitle"),
      subtitle: document.getElementById("playerSubtitle"),
      progress: document.getElementById("playerProgress"),
      timer: document.getElementById("playerTimer"),
      qText: document.getElementById("playerQuestionText"),
      options: document.getElementById("playerOptions"),
      status: document.getElementById("playerStatus"),
      nextBtn: document.getElementById("playerNextBtn"),
      resultCard: document.getElementById("playerResult"),
      scoreLine: document.getElementById("playerScoreLine"),
      timeLine: document.getElementById("playerTimeLine"),
      backBtn: document.getElementById("playerBackDashboard"),
      mainCard: document.getElementById("playerCard"),
    };
  }

  function startQuizPlayer(quiz) {
    const els = getPlayerEls();
    if (!els.qText) return; // view-player not in DOM

    if (!quiz || !quiz.questions || !quiz.questions.length) {
      els.qText.textContent = "Quiz data missing.";
      return;
    }

    playerQuiz = quiz;
    playerIndex = 0;
    playerCorrect = 0;
    playerStartTime = Date.now();
    playerQuestionStart = Date.now();
    playerTimeLeft = 30; // Default or from session metadata
    if (playerInterval) clearInterval(playerInterval);

    if (els.title) els.title.textContent = quiz.title || "Quiz player";
    if (els.subtitle) {
      els.subtitle.textContent = quiz.topic
        ? `Topic: ${quiz.topic}`
        : "Answer the questions.";
    }

    if (els.resultCard) els.resultCard.style.display = "none";
    if (els.mainCard) els.mainCard.style.display = "block";

    // Inject Host HUD if I am the host
    setupHostHUD();

    renderPlayerQuestion();
    showView("player");
  }

  function setupHostHUD() {
    const playerContainer = document.querySelector(".view-player-container") || document.getElementById("view-player");
    if (!playerContainer) return;

    // Remove old Hud if exists
    document.getElementById("hostControlHUD")?.remove();
    document.getElementById("liveLeaderboardOverlay")?.remove();

    // Create Leaderboard Overlay
    const lbOverlay = document.createElement("div");
    lbOverlay.id = "liveLeaderboardOverlay";
    lbOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; display:none; align-items:center; justify-content:center; flex-direction:column; padding:2rem;";
    lbOverlay.innerHTML = `
      <h2 style="color:var(--accent-neon); margin-bottom:1rem; text-shadow: var(--neon-glow);">LIVE RANKINGS</h2>
      <ul id="liveLeaderboardList" style="list-style:none; padding:0; width:100%; max-width:400px; color:#fff;"></ul>
      <p style="margin-top:2rem; color:#9ca3af; font-size:0.8rem;">Waiting for host to continue...</p>
    `;
    document.body.appendChild(lbOverlay);

    if (!isHost) return;

    // Create HUD for host
    const hud = document.createElement("div");
    hud.id = "hostControlHUD";
    hud.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--card-bg); border:1px solid var(--accent-neon); border-radius:12px; padding:1rem; display:flex; gap:10px; z-index:10000; box-shadow: var(--neon-glow);";
    
    const btnNext = document.createElement("button");
    btnNext.className = "btn btn-primary";
    btnNext.textContent = "Push Next Question";
    btnNext.onclick = () => socket.emit("host_next", currentRoomPin);

    const btnLB = document.createElement("button");
    btnLB.className = "btn btn-outline";
    btnLB.textContent = "Toggle Leaderboard";
    let lbVisible = false;
    btnLB.onclick = () => {
      lbVisible = !lbVisible;
      socket.emit("host_leaderboard", { pin: currentRoomPin, visible: lbVisible });
    };

    const btnEnd = document.createElement("button");
    btnEnd.className = "btn btn-text-only";
    btnEnd.textContent = "End Session";
    btnEnd.onclick = () => { if(confirm("End for all?")) showView("dashboard"); };

    hud.appendChild(btnNext);
    hud.appendChild(btnLB);
    hud.appendChild(btnEnd);

    const timerHUD = document.createElement("div");
    timerHUD.id = "hostTimerHUD";
    timerHUD.style.cssText = "margin-left:15px; padding-left:15px; border-left:1px solid #374151; display:flex; align-items:center; color:var(--accent-neon); font-family:monospace; font-weight:bold; font-size:1.2rem;";
    timerHUD.textContent = "30s";
    
    const statsArea = document.createElement("div");
    statsArea.id = "hostStatsContainer";
    statsArea.style.cssText = "margin-left:15px; min-width:120px; display:flex; flex-direction:column; justify-content:center;";

    hud.appendChild(timerHUD);
    hud.appendChild(statsArea);

    document.body.appendChild(hud);
  }

  function renderPlayerQuestion() {
    const els = getPlayerEls();
    if (!playerQuiz || !playerQuiz.questions) return;

    const q = playerQuiz.questions[playerIndex];
    if (!q) {
       finishPlayerQuiz();
       return;
    }

    if (els.progress) {
      els.progress.textContent = `Question ${playerIndex + 1} / ${
        playerQuiz.questions.length
      }`;
    }
    if (els.qText) els.qText.textContent = q.question || "";

    if (els.options) {
      els.options.innerHTML = "";
      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-outline player-option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => handlePlayerAnswer(idx));
        els.options.appendChild(btn);
      });
    }

    if (els.status) els.status.textContent = "";

    if (els.nextBtn) {
      els.nextBtn.disabled = true;
      if (currentRoomPin) {
        els.nextBtn.textContent = "Waiting for next question...";
        els.nextBtn.style.display = isHost ? "none" : "block"; 
      } else {
        els.nextBtn.textContent = playerIndex === playerQuiz.questions.length - 1 ? "Finish quiz" : "Next question";
      }
    }

    playerQuestionStart = Date.now();
    playerTimeLeft = 30; // 30s per question
    startQuestionTimer();
  }

  function startQuestionTimer() {
    const els = getPlayerEls();
    if (playerInterval) clearInterval(playerInterval);
    
    updateTimerUI();
    playerInterval = setInterval(() => {
      playerTimeLeft--;
      updateTimerUI();
      if (playerTimeLeft <= 0) {
        clearInterval(playerInterval);
        
        // AUTO-SKIP LOGIC: If I am host, I push everyone forward
        if (isHost && currentRoomPin) {
           console.log("Timer expired, host pushing next question automatically");
           socket.emit("host_next", currentRoomPin);
        } else {
           handlePlayerAnswer(-1); // Lock for participants
        }
      }
    }, 1000);
  }

  function updateTimerUI() {
    const els = getPlayerEls();
    if (els.timer) {
      els.timer.textContent = `${playerTimeLeft}s`;
      els.timer.style.color = playerTimeLeft < 10 ? "#ef4444" : "#e5e7eb";
    }
    // Update Host HUD timer if exists
    const hTimer = document.getElementById("hostTimerHUD");
    if (hTimer) {
      hTimer.textContent = `${playerTimeLeft}s`;
      hTimer.style.color = playerTimeLeft < 10 ? "#ef4444" : "var(--accent-neon)";
    }
  }

  function handlePlayerAnswer(idx) {
    const els = getPlayerEls();
    const q = playerQuiz?.questions?.[playerIndex];
    if (!q) return;

    const buttons = els.options?.querySelectorAll("button");
    buttons?.forEach((b, i) => {
      // In room mode, we DON'T disable immediately to allow re-selection
      if (!currentRoomPin) b.disabled = true;
      else b.classList.remove("btn-selected"); // clear previous selection visually
      
      // BLIND MODE: If in a room, don't show right/wrong immediately
      if (currentRoomPin) {
        if (i === idx) {
           b.classList.add("btn-selected"); // Just highlight what was picked
        }
      } else {
        // Classic mode: show right/wrong
        if (i === q.correctIndex) b.classList.add("btn-correct");
        if (i === idx && i !== q.correctIndex) b.classList.add("btn-wrong");
      }
    });

    if (playerInterval && !currentRoomPin) clearInterval(playerInterval);

    const timeForThis = (Date.now() - playerQuestionStart) / 1000;
    q._timeTakenSec = timeForThis;

    if (idx === q.correctIndex) {
      playerCorrect++;
    }

    // Classic mode text feedback
    if (!currentRoomPin && els.status) {
       if (idx === q.correctIndex) {
         els.status.textContent = "Correct!";
       } else {
         els.status.textContent = "Incorrect. Correct option: " + (q.options[q.correctIndex] || "");
       }
    }

    if (isHost || !currentRoomPin) {
      if (els.nextBtn) els.nextBtn.disabled = false;
    } else {
      // Participant: change text to confirm save
      if (els.nextBtn) els.nextBtn.textContent = "Submission Saved! Waiting...";
    }

    // Submit answer to server if in a room
    if (currentRoomPin) {
      socket.emit("submit_answer", { 
        pin: currentRoomPin, 
        isCorrect: idx === q.correctIndex, 
        timeTaken: timeForThis,
        optionIdx: idx
      });
    }
  }

  function finishPlayerQuiz() {
    const els = getPlayerEls();
    if (playerInterval) clearInterval(playerInterval);
    document.getElementById("hostControlHUD")?.remove();
    document.getElementById("hostTimerHUD")?.remove();
    
    if (!playerQuiz || !playerQuiz.questions) return;

    const totalQ = playerQuiz.questions.length;
    const totalTimeSec = (Date.now() - playerStartTime) / 1000;
    const avgTime = totalTimeSec / totalQ;

    if (els.scoreLine) {
      const percent = Math.round((playerCorrect / totalQ) * 100);
      els.scoreLine.textContent = `You scored ${playerCorrect} / ${totalQ} (${percent}%).`;
    }
    if (els.timeLine) {
      els.timeLine.textContent = `Total time ${totalTimeSec.toFixed(
        1
      )}s • Avg per question ${avgTime.toFixed(1)}s.`;
    }

    // If participant in room, don't show result card, show waiting screen
    if (currentRoomPin && !isHost) {
      if (els.mainCard) {
        els.mainCard.innerHTML = `
          <div style="text-align:center; padding:3rem;">
            <h2 style="color:var(--accent-neon); text-shadow: var(--neon-glow);">QUIZ FINISHED!</h2>
            <div style="font-size: 1.2rem; margin: 1.5rem 0; color: #e5e7eb;">
               Submissions closed. Waiting for the host to reveal the final results...
            </div>
            <p style="color:#9ca3af; font-size: 0.9rem;">Your response tally has been sent to the dashboard.</p>
            <div style="margin-top: 3rem; display: flex; gap: 10px; justify-content: center;">
               <button class="btn btn-outline" onclick="location.reload()">Back to Home</button>
            </div>
          </div>
        `;
      }
      return;
    }

    if (els.mainCard) els.mainCard.style.display = "block";
    if (els.resultCard) els.resultCard.style.display = "block";
    if (els.mainCard) els.mainCard.style.display = "none";

    // Host sees the final session results
    if (isHost && currentRoomPin) {
       socket.emit("host_leaderboard", { pin: currentRoomPin, visible: true });
    }
  }

  // ================================
  // Last AI quiz card in dashboard
  // ================================
  function renderLastAIQuizToDashboard() {
    try {
      const quizGrid =
        document.querySelector(".quiz-grid") ||
        document.getElementById("quizGrid");
      if (!quizGrid) return;

      const user = getCurrentUser && getCurrentUser();
      const keyPart =
        (user && (user.userId || user._id || user.email)) || "guest";
      const storageKey = `samarpanLastAIQuiz_${keyPart}`;

      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const quiz = safeParse(raw, null);
      if (!quiz) return;

      // Remove older AI card from local storage, if present
      const old = quizGrid.querySelector('[data-local-ai-card="1"]');
      if (old) old.remove();

      const card = document.createElement("div");
      card.className = "quiz-card";
      card.setAttribute("data-local-ai-card", "1");

      const qcount = (quiz.questions && quiz.questions.length) || 0;
      card.innerHTML = `
        <h4>${quiz.title || "AI Quiz"}</h4>
        <p>${qcount} questions • AI-generated</p>
        <div class="quiz-meta">
          <small>AI • just now</small>
          <div style="margin-top:6px">
            <button class="mini-btn ai-play">Play</button>
            <button class="mini-btn ai-edit">Edit</button>
          </div>
        </div>
      `;

      // Play via same quiz player
      card.querySelector(".ai-play").addEventListener("click", () => {
        localStorage.setItem("samarpanCurrentQuiz", JSON.stringify(quiz));
        startQuizPlayer(quiz);
      });

      // Edit: jump to create view (future: prefill manual editor)
      card.querySelector(".ai-edit").addEventListener("click", () => {
        localStorage.setItem("samarpanCurrentQuiz", JSON.stringify(quiz));
        showView("create");
      });

      quizGrid.prepend(card);
    } catch (e) {
      console.warn("renderLastAIQuizToDashboard error:", e);
    }
  }

  // ==================================
  // Last manual quiz card in dashboard
  // ==================================
  function renderLastManualQuizToDashboard() {
    try {
      const quizGrid =
        document.querySelector(".quiz-grid") ||
        document.getElementById("quizGrid");
      if (!quizGrid) return;

      const user = getCurrentUser && getCurrentUser();
      const keyPart =
        (user && (user.userId || user._id || user.email)) || "guest";
      const storageKey = `samarpanLastManualQuiz_${keyPart}`;

      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const quiz = safeParse(raw, null);
      if (!quiz) return;

      // Remove previous manual-quiz card
      const old = quizGrid.querySelector('[data-local-manual-card="1"]');
      if (old) old.remove();

      const card = document.createElement("div");
      card.className = "quiz-card";
      card.setAttribute("data-local-manual-card", "1");

      const qcount = (quiz.questions && quiz.questions.length) || 0;
      card.innerHTML = `
        <h4>${quiz.title || "My manual quiz"}</h4>
        <p>${qcount} questions • Manual</p>
        <div class="quiz-meta">
          <small>Created by you</small>
          <div style="margin-top:6px">
            <button class="mini-btn manual-play">Play</button>
            <button class="mini-btn manual-host">Host</button>
          </div>
        </div>
      `;

      // Play via quiz player
      card.querySelector(".manual-play").addEventListener("click", () => {
        localStorage.setItem("samarpanCurrentQuiz", JSON.stringify(quiz));
        startQuizPlayer(quiz);
      });

      // Host: open host view and preselect this quiz (manual-last)
      card.querySelector(".manual-host").addEventListener("click", () => {
        const hostSelect = document.getElementById("host-quiz");
        if (hostSelect) {
          let opt = Array.from(hostSelect.options).find(
            (o) => o.value === "manual-last"
          );
          if (!opt) {
            opt = document.createElement("option");
            opt.value = "manual-last";
            opt.textContent = quiz.title || "My last manual quiz";
            hostSelect.appendChild(opt);
          }
          hostSelect.value = "manual-last";
        }
        showView("host");
        const hostForm = document.querySelector(".host-form");
        if (hostForm) {
          hostForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      quizGrid.prepend(card);
    } catch (e) {
      console.warn("renderLastManualQuizToDashboard error:", e);
    }
  }

  // Hide full-page auth view (we use modal instead)
  function hideAuthView() {
    const authView = document.getElementById("view-auth");
    if (authView) {
      authView.style.display = "none";
    }
  }

  // ======================
  // Event bindings
  // ======================
  function attachHandlers() {
    // Sidebar is removed, but keeping a placeholder container logic if needed
    (function () {
      // Sidebar toggle no longer needed
    })();

    // All buttons/links having data-view attribute
    (function () {
      document.querySelectorAll("[data-view]").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          const view = el.getAttribute("data-view");
          const user = getCurrentUser();

          // If user is logged in and clicks auth view, send them to dashboard instead
          if ((view === "view-auth" || view === "view-login") && user) {
            showView("dashboard");
            return;
          }

          showView(view);

          // Navigation active state
          if (el.classList.contains("top-link")) {
            document
              .querySelectorAll(".top-link")
              .forEach((b) => b.classList.remove("active"));
            el.classList.add("active");
          }
        });
      });
    })();

    // ==========================
    // Auth modal core references
    // ==========================
    const authOverlay = document.getElementById("authOverlay");
    const authCloseBtn = document.getElementById("authCloseBtn");
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginPanel = document.getElementById("loginPanel");
    const signupPanel = document.getElementById("signupPanel");
    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");
    const authStatus = document.getElementById("authStatus");
    const authGoSignup = document.getElementById("authGoSignup");

    // Close modal (X button)
    if (authCloseBtn) {
      authCloseBtn.addEventListener("click", closeAuthModal);
    }

    // Click on dark overlay closes modal
    if (authOverlay) {
      authOverlay.addEventListener("click", (e) => {
        if (e.target === authOverlay) {
          closeAuthModal();
        }
      });
    }

    // Escape key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    });

    // ==========================
    // Auth tabs (Login / Signup)
    // ==========================
    if (tabLogin && tabSignup && loginPanel && signupPanel) {
      tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("auth-tab-active");
        tabSignup.classList.remove("auth-tab-active");
        loginPanel.style.display = "block";
        signupPanel.style.display = "none";
        if (authTitle) authTitle.textContent = "Log in";
        if (authSubtitle)
          authSubtitle.textContent = "Sign in to continue using Samarpan.";
        if (authStatus) authStatus.textContent = "";
      });

      tabSignup.addEventListener("click", () => {
        tabSignup.classList.add("auth-tab-active");
        tabLogin.classList.remove("auth-tab-active");
        loginPanel.style.display = "none";
        signupPanel.style.display = "block";
        if (authTitle) authTitle.textContent = "Create your Samarpan account";
        if (authSubtitle)
          authSubtitle.textContent =
            "Tournaments, quizzes and rating in one place.";
        if (authStatus) authStatus.textContent = "";
      });
    }

    // “Don’t have an account? Sign up” shortcut
    if (authGoSignup && tabSignup) {
      authGoSignup.addEventListener("click", (e) => {
        e.preventDefault();
        tabSignup.click();
      });
    }

    // ======================
    // Signup (email/password)
    // ======================
    (function () {
      const signupBtn = document.getElementById("signupSubmit");
      if (!signupBtn) return;

      signupBtn.addEventListener("click", async () => {
        const name = document.getElementById("signupName")?.value.trim();
        const email = document.getElementById("signupEmail")?.value.trim();
        const password = document
          .getElementById("signupPassword")
          ?.value.trim();

        if (!name || !email || !password) {
          showStatusText(authStatus, "Please fill all fields.", "#b91c1c");
          return;
        }
        showStatusText(authStatus, "Creating account...", "#4b5563");

        try {
          const res = await fetch(`${API_BASE}/api/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            showStatusText(
              authStatus,
              data.error || "Signup failed.",
              "#b91c1c"
            );
            return;
          }
          showStatusText(
            authStatus,
            "Signup successful! You can log in now.",
            "#16a34a"
          );
          tabLogin?.click();
        } catch (err) {
          console.error("Signup error:", err);
          showStatusText(
            authStatus,
            "Network error. Please try again.",
            "#b91c1c"
          );
        }
      });
    })();

    // ======================
    // Login (email/password)
    // ======================
    (function () {
      const loginBtn = document.getElementById("loginSubmit");
      if (!loginBtn) return;

      loginBtn.addEventListener("click", async () => {
        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document
          .getElementById("loginPassword")
          ?.value.trim();

        if (!email || !password) {
          showStatusText(
            authStatus,
            "Enter email and password.",
            "#b91c1c"
          );
          return;
        }
        showStatusText(authStatus, "Logging in...", "#4b5563");

        try {
          const res = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();
          if (!res.ok) {
            showStatusText(
              authStatus,
              data.error || "Login failed.",
              "#b91c1c"
            );
            return;
          }

          // Success
          showStatusText(authStatus, "Login successful!", "#16a34a");

          localStorage.setItem("samarpanUser", JSON.stringify(data));
          updateUIOnLogin(data);
          hideAuthView();

          if (document.getElementById("view-dashboard")) {
            showView("dashboard");
          }

          setTimeout(() => {
            closeAuthModal();
          }, 700);
        } catch (err) {
          console.error("Login error:", err);
          showStatusText(
            authStatus,
            "Network error. Please try again.",
            "#b91c1c"
          );
        }
      });
    })();

    // ======================
    // Social login buttons
    // ======================
    (function () {
      const socialGoogle = document.getElementById("socialGoogle");
      if (socialGoogle) {
        socialGoogle.addEventListener("click", () => {
          window.location.href = `${API_BASE}/auth/google`;
        });
      }
      const socialFacebook = document.getElementById("socialFacebook");
      if (socialFacebook) {
        socialFacebook.addEventListener("click", () => {
          window.location.href = `${API_BASE}/auth/facebook`;
        });
      }
    })();

    // ======================
    // AI quiz generation
    // ======================
    (function () {
      const aiGenerateBtn = document.getElementById("aiGenerateBtn");
      const pdfUploadBtn = document.getElementById("pdfUploadBtn");
      const pdfUploadInput = document.getElementById("pdfUploadInput");
      const aiStatus = document.getElementById("aiStatus");
      const aiPlayBtn = document.getElementById("aiPlayBtn");
      const aiTopicInput = document.getElementById("aiTopic");
      const pdfFileIndicator = document.getElementById("pdfFileIndicator");
      
      let selectedPdfFile = null;

      if (!aiGenerateBtn) return;

      // Handle PDF Upload Button Click (File selection only)
      if (pdfUploadBtn && pdfUploadInput) {
        pdfUploadBtn.addEventListener("click", () => {
          if (!requireLogin("Please log in to upload PDFs.")) return;
          pdfUploadInput.click();
        });

        pdfUploadInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) {
            selectedPdfFile = null;
            if (pdfFileIndicator) pdfFileIndicator.style.display = "none";
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Max size is 5MB.");
            pdfUploadInput.value = "";
            return;
          }

          selectedPdfFile = file;
          
          if (pdfFileIndicator) {
            pdfFileIndicator.textContent = `File uploaded successfully!! (${file.name})`;
            pdfFileIndicator.style.display = "block";
          }
          if (aiTopicInput && !aiTopicInput.value) {
            aiTopicInput.value = file.name.replace(".pdf", "");
          }
        });
      }

      // Handle "Create using AI" (Supports both Topic and PDF)
      aiGenerateBtn.addEventListener("click", async () => {
        if (!requireLogin("Please log in to generate AI quizzes.")) return;

        const currentUser = getCurrentUser();
        const titleRaw = document.getElementById("aiTitle")?.value.trim();
        const topic = document.getElementById("aiTopic")?.value.trim();
        const difficulty = document.getElementById("aiDifficulty")?.value || "medium";
        const questionCount = Number(document.getElementById("aiCount")?.value) || 5;
        const title = titleRaw || (selectedPdfFile ? "AI PDF Quiz" : "AI Quiz");

        if (!topic && !selectedPdfFile) {
          showStatusText(aiStatus, "Please enter a topic or upload a PDF.", "#b91c1c");
          return;
        }

        // --- PATH 1: GENERATE FROM PDF ---
        if (selectedPdfFile) {
          showStatusText(aiStatus, `Reading ${selectedPdfFile.name} & generating quiz...`, "#4b5563");

          const formData = new FormData();
          formData.append("title", title);
          formData.append("difficulty", difficulty);
          formData.append("count", questionCount);
          formData.append("userId", currentUser?.userId || currentUser?._id || currentUser?.email);
          formData.append("pdf", selectedPdfFile);

          try {
            const res = await fetch(`${API_BASE}/api/ai/generate-from-pdf`, {
              method: "POST",
              body: formData,
            });

            const data = await res.json();
            handleAIResponse(data);
            
            // Clean up UI after success
            selectedPdfFile = null;
            pdfUploadInput.value = "";
            if (pdfFileIndicator) pdfFileIndicator.style.display = "none";
          } catch (err) {
            console.error("PDF AI Quiz Error:", err);
            showStatusText(aiStatus, "Network error while processing PDF.", "#b91c1c");
          }
          return;
        }

        // --- PATH 2: GENERATE FROM TOPIC ---
        showStatusText(aiStatus, "Generating AI quiz...", "#4b5563");
        try {
          const res = await fetch(`${API_BASE}/api/ai/generate-quiz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              topic,
              difficulty,
              count: questionCount,
              userId: currentUser?.userId || currentUser?._id || currentUser?.email,
              tags: [topic.toLowerCase()],
            }),
          });

          const data = await res.json();
          handleAIResponse(data);
        } catch (err) {
          console.error("AI Quiz Error:", err);
          showStatusText(aiStatus, "Network error while generating quiz.", "#b91c1c");
        }
      });

      // Voice Input Setup
      const voiceInputBtn = document.getElementById("voiceInputBtn");
      const micIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color: var(--text-soft);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>`;
      const recordingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /><circle cx="18" cy="6" r="3" fill="#ef4444" /></svg>`;

      if (voiceInputBtn && aiTopicInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            voiceInputBtn.innerHTML = recordingSvg;
            voiceInputBtn.title = 'Listening...';
          };

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            aiTopicInput.value = transcript;
            
            // Revert state
            voiceInputBtn.innerHTML = micIconSvg;
            voiceInputBtn.title = 'Use voice to input topic';
            
            // Clear any staged PDF if they use voice
            selectedPdfFile = null;
            if (document.getElementById("pdfFileIndicator")) {
              document.getElementById("pdfFileIndicator").style.display = "none";
            }
          };

          recognition.onerror = (event) => {
            console.error(event.error);
            alert("Voice recognition error: " + event.error);
            voiceInputBtn.innerHTML = micIconSvg;
          };

          recognition.onend = () => {
            voiceInputBtn.innerHTML = micIconSvg;
            voiceInputBtn.title = 'Use voice to input topic';
          };

          voiceInputBtn.addEventListener("click", (e) => {
            e.preventDefault();
            try {
              recognition.start();
            } catch (err) {
              console.warn("Recognition already started");
            }
          });
        } else {
          voiceInputBtn.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Your browser does not support Voice Recognition. Please use Chrome or Edge.");
          });
        }
      }

      // Helper to handle both topic and PDF responses
      function handleAIResponse(data) {
        if (data.error) {
          showStatusText(aiStatus, data.error, "#b91c1c");
          return;
        }

        if (data.quiz) {
          const u = getCurrentUser();
          const keyPart = (u && (u.userId || u._id || u.email)) || "guest";
          const storageKey = `samarpanLastAIQuiz_${keyPart}`;
          localStorage.setItem(storageKey, JSON.stringify(data.quiz));

          showStatusText(aiStatus, "AI quiz generated successfully!", "#16a34a");
          renderLastAIQuizToDashboard();

          if (aiPlayBtn) {
            aiPlayBtn.style.display = "inline-flex";
            aiPlayBtn.onclick = () => {
              startQuizPlayer(data.quiz);
            };
          }
        }
      }
    })();

    // ======================
    // Quiz player buttons
    // ======================
    (function () {
      const nextBtn = document.getElementById("playerNextBtn");
      const backBtn = document.getElementById("playerBackDashboard");

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          if (!playerQuiz || !playerQuiz.questions) return;

          if (playerIndex < playerQuiz.questions.length - 1) {
            playerIndex++;
            renderPlayerQuestion();
          } else {
            finishPlayerQuiz();
          }
        });
      }

      if (backBtn) {
        backBtn.addEventListener("click", () => {
          showView("dashboard");
        });
      }
    })();

    // ==================================
    // Manual quiz editor (create view)
    // ==================================
    (function () {
      let manualQuestions = [];

      const addBtn = document.getElementById("btnAddQuestion");
      const saveBtn = document.getElementById("btnSaveManualQuiz");
      const listEl = document.getElementById("manualQuestionList");
      const statusEl = document.getElementById("manualEditorStatus");

      const titleInput = document.getElementById("manualTitle");
      const topicInput = document.getElementById("manualTopic");
      const diffSelect = document.getElementById("manualDifficulty");

      if (!addBtn || !saveBtn) {
        console.warn("Manual editor buttons not found in DOM.");
        return;
      }

      const API =
        typeof API_BASE !== "undefined" ? API_BASE : "http://localhost:5000";

      function setStatus(msg, color = "#e5e7eb") {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = color;
      }

      function renderQuestionList() {
        if (!listEl) return;

        if (!manualQuestions.length) {
          listEl.innerHTML =
            '<p style="margin:0; color:#9ca3af;">No questions added yet.</p>';
          return;
        }

        const html = manualQuestions
          .map((q, idx) => {
            const safeText =
              q.question.length > 80
                ? q.question.slice(0, 77) + "..."
                : q.question;
            return `
              <div style="
                border:1px solid #1f2937;
                border-radius:8px;
                padding:0.4rem 0.6rem;
                margin-bottom:0.4rem;
                font-size:0.82rem;
              ">
                <strong>Q${idx + 1}.</strong> ${safeText}<br/>
                <span style="color:#9ca3af;">Options: ${
                  q.options.length
                }, Correct: ${q.correctIndex + 1}, Diff: ${q.difficulty}</span>
              </div>
            `;
          })
          .join("");

        listEl.innerHTML = html;
      }

      // Add a single question to the in-memory quiz
      addBtn.addEventListener("click", () => {
        const qTextEl = document.getElementById("qText");
        const opt0El = document.getElementById("opt0");
        const opt1El = document.getElementById("opt1");
        const opt2El = document.getElementById("opt2");
        const opt3El = document.getElementById("opt3");
        const corrEl = document.getElementById("correctIndex");
        const explEl = document.getElementById("qExplanation");

        if (!qTextEl || !opt0El || !opt1El || !corrEl) {
          console.error("Manual editor inputs missing in DOM.");
          return;
        }

        const question = qTextEl.value.trim();
        const o0 = opt0El.value.trim();
        const o1 = opt1El.value.trim();
        const o2 = opt2El?.value.trim() || "";
        const o3 = opt3El?.value.trim() || "";
        const explanation = explEl?.value.trim() || "";
        const correctIndex = Number(corrEl.value || "0");

        if (!question) {
          setStatus("Please enter a question.", "#b91c1c");
          return;
        }
        if (!o0 || !o1) {
          setStatus("Please enter at least two options.", "#b91c1c");
          return;
        }

        const options = [o0, o1];
        if (o2) options.push(o2);
        if (o3) options.push(o3);

        if (correctIndex < 0 || correctIndex >= options.length) {
          setStatus(
            "Correct option index does not match filled options.",
            "#b91c1c"
          );
          return;
        }

        const difficulty = diffSelect?.value || "medium";

        const newQ = {
          question,
          options,
          correctIndex,
          explanation,
          difficulty,
        };

        manualQuestions.push(newQ);

        qTextEl.value = "";
        opt0El.value = "";
        opt1El.value = "";
        if (opt2El) opt2El.value = "";
        if (opt3El) opt3El.value = "";
        if (explEl) explEl.value = "";
        corrEl.value = "0";

        setStatus(
          `Question added (${manualQuestions.length} in quiz).`,
          "#16a34a"
        );
        renderQuestionList();
      });

      // Save the quiz to backend + localStorage
      saveBtn.addEventListener("click", async () => {
        const title = titleInput?.value.trim() || "";
        const topic = topicInput?.value.trim() || "";

        if (!title) {
          setStatus("Please enter a quiz title before saving.", "#b91c1c");
          return;
        }
        if (!manualQuestions.length) {
          setStatus("Add at least one question before saving.", "#b91c1c");
          return;
        }

        let user = null;
        if (typeof getCurrentUser === "function") {
          user = getCurrentUser();
        }
        if (!user) {
          if (typeof requireLogin === "function") {
            requireLogin("Please log in to save a quiz.");
          }
          setStatus("You must be logged in to save quizzes.", "#b91c1c");
          return;
        }

        const authorId = user.userId || user._id || user.email;

        const payload = {
          title,
          topic,
          authorId,
          questions: manualQuestions,
          aiGenerated: false,
          tags: topic ? [topic.toLowerCase()] : [],
        };

        setStatus("Saving quiz...", "#4b5563");

        try {
          const res = await fetch(`${API}/api/quizzes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (!res.ok) {
            console.error("Save quiz error:", data);
            setStatus(data.error || "Failed to save quiz.", "#b91c1c");
            return;
          }

          setStatus("Quiz saved successfully to Samarpan!", "#16a34a");
          console.log("Saved quiz:", data);

          // Persist last manual quiz per user
          try {
            const quizToStore = data.quiz || data.quizDoc || data;

            const u =
              typeof getCurrentUser === "function" ? getCurrentUser() : null;
            const userKeyPart =
              (u && (u.userId || u._id || u.email)) || "guest";

            const storageKey = `samarpanLastManualQuiz_${userKeyPart}`;
            localStorage.setItem(storageKey, JSON.stringify(quizToStore));
          } catch (e) {
            console.warn("Could not store last manual quiz:", e);
          }

          // Update dashboard card
          renderLastManualQuizToDashboard();

          // Reset local state
          manualQuestions = [];
          renderQuestionList();
          if (titleInput) titleInput.value = "";
          if (topicInput) topicInput.value = "";
          if (diffSelect) diffSelect.value = "medium";
        } catch (err) {
          console.error("Network error while saving quiz:", err);
          setStatus("Network error while saving quiz.", "#b91c1c");
        }
      });

      renderQuestionList();
    })();

    // Add "My last manual quiz" into host dropdown on load (if exists)
    (function () {
      const select = document.getElementById("host-quiz");
      if (!select) return;

      const user =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      const userKeyPart =
        (user && (user.userId || user._id || user.email)) || "guest";

      const storageKey = `samarpanLastManualQuiz_${userKeyPart}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const quiz = safeParse(raw, null);
      if (!quiz) return;

      const already = Array.from(select.options).some(
        (opt) => opt.value === "manual-last"
      );
      if (already) return;

      const opt = document.createElement("option");
      opt.value = "manual-last";
      opt.textContent = quiz.title || "My last manual quiz";
      select.appendChild(opt);
    })();

    // ======================
    // Legacy leaderboard / explore / rating history (UI hooks)
    // ======================
    (function () {
      const btn = document.getElementById("leaderboardBtn");
      if (!btn) return;
      btn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${API_BASE}/leaderboard`);
          if (!res.ok) {
            alert("Failed to fetch leaderboard");
            return;
          }
          const data = await res.json();
          const container = document.getElementById("leaderboardContainer");
          if (container) {
            container.innerHTML = (data.scores || [])
              .map(
                (s) =>
                  `<div class="leader-item"><span>${s.name}</span><span>${s.score}</span></div>`
              )
              .join("");
          }
          showView("leaderboard");
        } catch (err) {
          console.error("leaderboard err:", err);
          alert("Error loading leaderboard");
        }
      });
    })();

    (function () {
      const btn = document.getElementById("exploreBtn");
      if (!btn) return;
      btn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${API_BASE}/quizzes/public`);
          if (!res.ok) {
            alert("Failed to fetch public quizzes");
            return;
          }
          const data = await res.json();
          const container = document.getElementById("exploreContainer");
          if (container) {
            container.innerHTML = (data.quizzes || [])
              .map(
                (q) =>
                  `<div class="explore-item"><h4>${q.title}</h4><p>${
                    (q.questions && q.questions.length) || 0
                  } questions</p></div>`
              )
              .join("");
          }
          showView("explore");
        } catch (err) {
          console.error("explore err:", err);
          alert("Error loading explore");
        }
      });
    })();

    (function () {
      const btn = document.getElementById("ratingHistoryBtn");
      if (!btn) return;
      btn.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user) {
          alert("Please login first");
          return;
        }
        try {
          const res = await fetch(
            `${API_BASE}/ratings/${encodeURIComponent(user.email)}`
          );
          if (!res.ok) {
            alert("Could not fetch rating history");
            return;
          }
          const data = await res.json();
          const modal = document.getElementById("ratingModal");
          const container = document.getElementById("ratingHistoryContainer");
          if (!modal || !container) {
            alert("Rating UI not present");
            return;
          }
          container.innerHTML = (data.history || [])
            .map(
              (h) =>
                `<div class="rating-item"><strong>${h.rating}</strong> — ${new Date(
                  h.date
                ).toLocaleString()}</div>`
            )
            .join("");
          modal.style.display = "block";
        } catch (err) {
          console.error("rating history err:", err);
          alert("Failed to fetch rating history");
        }
      });
    })();

    // ======================
    // Profile + logout button
    // ======================
    (function () {
      const profileBtn = document.getElementById("profileBtn");
      if (profileBtn) {
        profileBtn.addEventListener("click", () => {
          const user = getCurrentUser();
          if (!user) {
            openAuthModal();
            return;
          }
          const profileName = document.getElementById("profileName");
          const profileEmail = document.getElementById("profileEmail");
          if (profileName) profileName.textContent = user.name || "";
          if (profileEmail) profileEmail.textContent = user.email || "";
          showView("profile");
        });
      }

      const btnLogout = document.getElementById("btnLogout");
      if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
          e.preventDefault();
          clearCurrentUser();
          updateUIOnLogin(null);
          showView("dashboard");
        });
      }
    })();

    // ======================
    // Dashboard toolbar shortcuts
    // ======================
    (function () {
      const toolCreateManual = document.getElementById("toolCreateManual");
      const toolCreateAI = document.getElementById("toolCreateAI");
      const toolLiveTournaments =
        document.getElementById("toolLiveTournaments");
      const hostSelect = document.getElementById("host-quiz");

      // Manual create from toolbar
      if (toolCreateManual) {
        toolCreateManual.addEventListener("click", () => {
          if (!requireLogin("Please log in to create a quiz.")) return;
          showView("create");

          const btnOpenEditor = document.getElementById("btnOpenManualEditor");
          if (btnOpenEditor) {
            btnOpenEditor.click();
          }
        });
      }

      // AI create from toolbar
      if (toolCreateAI) {
        toolCreateAI.addEventListener("click", () => {
          if (!requireLogin("Please log in to use AI quizzes.")) return;

          showView("create");

          const aiCard = document.querySelector(
            "#view-create .create-card:nth-of-type(2)"
          );
          if (aiCard) {
            aiCard.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }

      // Live tournaments -> redirect to host view for now
      if (toolLiveTournaments) {
        toolLiveTournaments.addEventListener("click", () => {
          if (!requireLogin("Please log in to host tournaments.")) return;
          showView("host");

          const hostForm = document.querySelector(".host-form");
          if (hostForm) {
            hostForm.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }

      // “Host again” buttons inside dashboard quiz cards
      const hostAgainButtons = Array.from(
        document.querySelectorAll(".quiz-card .mini-btn")
      ).filter((btn) =>
        (btn.textContent || "").toLowerCase().includes("host again")
      );

      hostAgainButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!requireLogin("Please log in to host a quiz.")) return;

          const card = btn.closest(".quiz-card");
          const title = card?.querySelector("h4")?.textContent?.trim();

          if (hostSelect && title) {
            const match = Array.from(hostSelect.options).find(
              (opt) => opt.textContent.trim() === title
            );
            if (match) {
              hostSelect.value = match.value;
            }
          }

          showView("host");

          const hostForm = document.querySelector(".host-form");
          if (hostForm) {
            hostForm.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    })();



    // ======================
    // Topbar auth / host buttons
    // ======================
    (function () {
      const btnAuthTop = document.getElementById("btnAuthTop");
      const btnAvatarTop = document.getElementById("btnAvatarTop");
      const btnHostTop = document.getElementById("btnHostTop");

      function handleAuthClick(e) {
        e.preventDefault();
        const user = getCurrentUser();
        if (user) {
          showView("profile");
        } else {
          openAuthModal();
        }
      }

      if (btnAuthTop) {
        btnAuthTop.addEventListener("click", handleAuthClick);
      }
      if (btnAvatarTop) {
        const profileDropdownMenu = document.getElementById("profileDropdownMenu");
        btnAvatarTop.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          profileDropdownMenu.classList.toggle("show");
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
          if (!btnAvatarTop.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
            profileDropdownMenu.classList.remove("show");
          }
        });

        // Dropdown actions
        const btnLogoutDropdown = document.getElementById("btnLogoutDropdown");
        if (btnLogoutDropdown) {
          btnLogoutDropdown.addEventListener("click", (e) => {
            e.preventDefault();
            clearCurrentUser();
            window.location.reload(); // Refresh to clear state
          });
        }

        const dropdownItems = profileDropdownMenu.querySelectorAll(".dropdown-item[data-view]");
        dropdownItems.forEach(item => {
          item.addEventListener("click", () => {
            const view = item.getAttribute("data-view");
            if (view) showView(view);
            profileDropdownMenu.classList.remove("show");
          });
        });
      }

      if (btnHostTop) {
        btnHostTop.addEventListener("click", (e) => {
          e.preventDefault();
          if (!getCurrentUser()) {
            openAuthModal();
          } else {
            showView("host");
          }
        });
      }
    })();
  }

  // ======================
  // Initial boot
  // ======================
  onReady(() => {
    // Handle redirect token from Google/Facebook
    handleTokenInURL();

    // Restore user if already logged in
    const existing = getCurrentUser();
    if (existing) {
      updateUIOnLogin(existing);
    }

    // Bind all events
    attachHandlers();

    // Show last AI / manual quiz cards if present
    renderLastAIQuizToDashboard();
    renderLastManualQuizToDashboard();

    // Restore previous view or default to dashboard
    const savedView = sessionStorage.getItem("samarpanCurrentView") || "dashboard";
    if (document.getElementById(`view-${savedView}`)) {
      showView(savedView);
    } else if (document.getElementById("view-dashboard")) {
      showView("dashboard");
    }
    loadDummyLeaderboard();
  });

  // ======================
  // Manual editor open button
  // ======================
  (function () {
    const openBtn = document.getElementById("btnOpenManualEditor");
    const editor = document.getElementById("manualEditor");

    if (!openBtn || !editor) return;

    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      editor.style.display = "block";
      editor.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  })();

  // ======================
  // Simple debug handle
  // ======================
  window.Samarpan = {
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    showView,
    renderLastAIQuizToDashboard,
  };
  // Mobile nav binding (safe to place at end of script.js)
(function() {
  const nav = document.getElementById("mobileNav");
  if (!nav) return;

  function setActive(viewName) {
    const buttons = nav.querySelectorAll(".mob-btn");
    buttons.forEach(b => {
      const v = b.getAttribute("data-view");
      if (!v) return;
      b.classList.toggle("active", v === viewName);
    });
  }

  // click handler (calls existing data-view logic if present)
  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".mob-btn");
    if (!btn) return;
    const view = btn.getAttribute("data-view");
    if (!view) return;

    // prefer the central SPA handler (data-view) if it's wired; otherwise call showView directly
    const el = document.querySelector(`[data-view="${view}"]`);
    if (el && typeof el.click === "function") {
      el.click();
    } else if (typeof window.showView === "function") {
      window.showView(view);
    } else if (window.Samarpan && typeof window.Samarpan.showView === "function") {
      window.Samarpan.showView(view);
    }

    setActive(view);
  });

  // update active on route change
  const origShow = window.showView || (window.Samarpan && window.Samarpan.showView);
  if (origShow && typeof origShow === "function") {
    const patched = function(name) {
      try { origShow(name); } catch(e){ console.warn(e); }
      setActive(name.replace(/^view-/, ""));
    };
    // assign back to both references so other code still calls patched
    window.showView = patched;
    if (window.Samarpan) window.Samarpan.showView = patched;
  }

  // set default active (dashboard)
  // set default active (dashboard)
  setActive("dashboard");
})();

// Main IIFE Closure Correction
})();

// =============================================
// CUSTOM NEON CURSOR — dot + ring + hover scale
// =============================================
(function () {
  // Only activate on devices with a fine pointer (mouse)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  // Track mouse position
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows instantly
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  // Ring follows with a smooth trail (lerp)
  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';

    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover detection on interactive elements
  const hoverSelectors = 'a, button, input, select, textarea, .btn, .chip, .mini-btn, .side-link, .top-link, .top-btn, .top-profile, .quiz-card, .template-card, .cat-card, .toolbar-list li, label[for], [data-view], [onclick]';

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(hoverSelectors)) {
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(hoverSelectors)) {
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    }
  });

  // Click pulse
  document.addEventListener('mousedown', function () {
    ring.classList.add('cursor-click');
  });

  document.addEventListener('mouseup', function () {
    ring.classList.remove('cursor-click');
  });

  // Hide cursor when mouse leaves the viewport
  document.addEventListener('mouseleave', function () {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function () {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
})();
