---
marp: true
theme: default
size: 16:9
html: true
style: |
  section { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fafaf9; }
  h2 { color: #c2410c; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-size: 32px; border-bottom: 3px solid #fdba74; padding-bottom: 10px; margin-top: 0; }
  .subtitle { text-align: center; color: #64748b; font-size: 18px; margin-bottom: 20px; font-style: italic; }
  
  .flex-row { display: flex; gap: 20px; justify-content: space-between; align-items: stretch; height: 100%; }
  .col { flex: 1; display: flex; flex-direction: column; gap: 15px; }
  
  .box { padding: 15px; border-radius: 8px; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .box strong { display: block; margin-bottom: 5px; font-size: 20px; }
  .b-blue { background: #e0f2fe; border-left: 6px solid #0284c7; color: #0c4a6e; }
  .b-orange { background: #ffedd5; border-left: 6px solid #ea580c; color: #7c2d12; }
  .b-green { background: #dcfce7; border-left: 6px solid #16a34a; color: #14532d; }
  .b-purple { background: #f3e8ff; border-left: 6px solid #9333ea; color: #581c87; }
  
  .table-custom { width: 100%; border-collapse: collapse; font-size: 18px; text-align: center; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; }
  .table-custom th { background: #0f172a; color: #fff; padding: 15px; border: 1px solid #334155; }
  .table-custom td { padding: 12px; border: 1px solid #e2e8f0; }
  .table-custom tr:nth-child(even) { background: #f8fafc; }
  .check { color: #16a34a; font-weight: bold; }
  .cross { color: #dc2626; font-weight: bold; }
  .warn { color: #ca8a04; font-weight: bold; }

  .arch-container { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 20px; }
  .arch-row { display: flex; justify-content: center; gap: 40px; width: 100%; }
  .arch-box { text-align: center; padding: 20px; border-radius: 12px; font-weight: bold; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 250px; border: 2px solid #cbd5e1; }
  .arch-box.main { border-color: #0284c7; background: #f0f9ff; color: #0369a1; }
  .arch-arrow { display: flex; align-items: center; justify-content: center; font-size: 30px; color: #94a3b8; font-weight: bold; }
  .arch-arrow.down { flex-direction: column; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .timeline { display: flex; gap: 15px; align-items: center; margin-top: 50px; }
  .t-step { flex: 1; text-align: center; background: #fff; padding: 20px 10px; border-radius: 12px; border-top: 6px solid #0284c7; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; }
  .t-step .icon { background: #0284c7; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto; font-weight: bold; font-size: 20px; }
  .t-arrow { font-size: 24px; color: #94a3b8; }

  .team-card { display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); gap: 20px; align-items: center; }
  .team-avatar { width: 70px; height: 70px; background: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #fff; font-weight: bold; flex-shrink: 0; }
  .team-info { flex: 2; }
  .team-info h3 { margin: 0 0 5px 0; color: #0f172a; font-size: 22px; }
  .team-info p { margin: 0; color: #475569; font-size: 16px; line-height: 1.4; }
  .team-tech { flex: 1; text-align: right; font-size: 14px; color: #0284c7; background: #f0f9ff; padding: 15px; border-radius: 8px; font-weight: bold; }

  .chart-container { margin-top: 30px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .bar-row { display: flex; align-items: center; margin-bottom: 15px; }
  .bar-label { width: 150px; font-weight: bold; color: #334155; }
  .bar-track { flex: 1; background: #f1f5f9; border-radius: 8px; height: 30px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: #fff; font-weight: bold; font-size: 14px; transition: width 1s ease-in-out; }
  .bar-1 { width: 15%; }
  .bar-2 { width: 40%; }
  .bar-3 { width: 75%; }
  .bar-4 { width: 100%; background: linear-gradient(90deg, #10b981, #059669); }
---

## PROPOSED SOLUTION
<div class="subtitle">Our solution is a strictly synchronized, highly scalable multiplayer assessment engine.</div>

<div class="flex-row">
  <div class="col">
    <div class="box b-blue"><strong>AI Automation</strong> Automatically generates quizzes and adjusts difficulty based on performance metrics.</div>
    <div class="box b-orange"><strong>Integrated Multiplayer</strong> Real-time syncing, lobbies, and tournaments. Server controls all progression.</div>
    <div class="box b-green"><strong>Smart Analytics</strong> Tracks speed, accuracy, streaks, and drop-off rates for hosts.</div>
    <div class="box b-purple"><strong>Focus Mode & Fairness</strong> "No-answer-reveal" policy enforces fair play and zero cheating.</div>
  </div>
  <div class="col">
    <table class="table-custom">
      <tr>
        <th>Feature</th>
        <th>Basic Forms</th>
        <th>Kahoot</th>
        <th>Our Solution</th>
      </tr>
      <tr>
        <td>Real-time Server Sync</td>
        <td class="cross">❌</td>
        <td class="warn">⚠️</td>
        <td class="check">✅✅</td>
      </tr>
      <tr>
        <td>Strict Anti-Cheat</td>
        <td class="cross">❌</td>
        <td class="cross">❌</td>
        <td class="check">✅✅</td>
      </tr>
      <tr>
        <td>Host Deep Analytics</td>
        <td class="warn">⚠️</td>
        <td class="cross">❌</td>
        <td class="check">✅✅</td>
      </tr>
      <tr>
        <td>SaaS Subscription gating</td>
        <td class="cross">❌</td>
        <td class="check">✅</td>
        <td class="check">✅✅</td>
      </tr>
    </table>
    <div style="margin-top: 15px; text-align: center; font-style: italic; color: #64748b;">We are not just an alternative... we are an upgrade over legacy tools.</div>
  </div>
</div>

---

## TECHNICAL ARCHITECTURE
<div class="subtitle">Designed for enterprise-grade real-time synchronization and scale.</div>

<div class="arch-container">
  <div class="arch-row">
    <div class="arch-box main">
      🌐 FRONTEND (Next.js & React)<br><br>
      <span style="font-size:14px; font-weight:normal;">Tailwind CSS, Real-time Lobby UI, Host Dashboard</span>
    </div>
    <div class="arch-arrow">➔</div>
    <div class="arch-box">
      🤖 AI SERVICES<br><br>
      <span style="font-size:14px; font-weight:normal;">Quiz Generation, Adaptive Difficulty (OpenAI API)</span>
    </div>
  </div>
  <div class="arch-arrow down">⬇</div>
  <div class="arch-row">
    <div class="arch-box main" style="width: 500px;">
      ⚙️ BACKEND REAL-TIME ENGINE (Node.js + Socket.io)<br><br>
      <span style="font-size:14px; font-weight:normal;">Strict state versioning, timer management, Razorpay payment processing, player sync & anti-cheat logic.</span>
    </div>
  </div>
  <div class="arch-arrow down">⬇</div>
  <div class="arch-row">
    <div class="arch-box main">
      🗄️ DATABASE (MongoDB / Prisma)<br><br>
      <span style="font-size:14px; font-weight:normal;">User profiles, quiz content, analytics data, subscriptions</span>
    </div>
  </div>
</div>

---

## INNOVATIVE FEATURES
<div class="subtitle">A gaming-inspired design with heavy emphasis on educational retention.</div>

<div class="grid-2">
  <div class="box b-blue"><strong>Strict WebSocket Sync</strong> Server controls the pace of the quiz. Eliminates client-side hacks and desync issues completely.</div>
  <div class="box b-orange"><strong>Dynamic Lobbies & Teams</strong> Real-time joining via codes. Support for solo and team-based competition with live avatar visibility.</div>
  <div class="box b-green"><strong>Advanced Host Analytics</strong> Actionable insights for creators, including question-by-question drop-off rates and speed metrics.</div>
  <div class="box b-purple"><strong>Shareable Result Cards</strong> Built-in product-led growth. Users can generate beautiful cards to share on social media.</div>
  <div class="box b-blue"><strong>No-Answer-Reveal Mode</strong> Ensures fair play by keeping answers hidden during gameplay, unlocking only at the end.</div>
  <div class="box b-orange"><strong>Tier-based Monetization</strong> Razorpay integrated Freemium/Pro gating for API usage limits and advanced features.</div>
</div>

---

## TECHNICAL FEASIBILITY AND SCALABILITY
<div class="subtitle">Built with a modern, industry-standard technology stack ready for immense growth.</div>

<div class="flex-row">
  <div class="col" style="flex: 1.5;">
    <div class="box b-blue" style="height: 100%;">
      <strong>Feasibility</strong>
      <ul style="font-size: 16px; margin-top: 10px;">
        <li><strong>Real-time Comm:</strong> WebSockets (Socket.io) ensures sub-100ms latency for multiplayer.</li>
        <li><strong>Database Integrity:</strong> Prisma ORM provides strict type-safety and robust schema management.</li>
        <li><strong>UI Responsiveness:</strong> TailwindCSS allows rapid UI scaling across all devices.</li>
      </ul>
    </div>
  </div>
  <div class="col" style="flex: 1.5;">
    <div class="box b-green" style="height: 100%;">
      <strong>Scalability</strong>
      <ul style="font-size: 16px; margin-top: 10px;">
        <li><strong>Horizontal Scaling:</strong> Node.js architecture can be easily clustered across multiple instances.</li>
        <li><strong>High Read/Write:</strong> MongoDB natively handles massive concurrent document operations during live quizzes.</li>
        <li><strong>Global CDN:</strong> Next.js edge caching ensures lightning-fast asset delivery globally.</li>
      </ul>
    </div>
  </div>
  <div class="col" style="flex: 1; text-align: center;">
    <div class="box b-orange" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px;">
      <strong>Tech Stack</strong>
      <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">Next.js</div>
      <div style="font-size: 24px; font-weight: bold; color: #10b981;">Node.js</div>
      <div style="font-size: 24px; font-weight: bold; color: #0f172a;">Socket.io</div>
      <div style="font-size: 24px; font-weight: bold; color: #16a34a;">MongoDB</div>
      <div style="font-size: 24px; font-weight: bold; color: #2563eb;">Razorpay</div>
    </div>
  </div>
</div>

---

## BUSINESS MODEL & FINANCIAL PROJECTIONS
<div class="subtitle">A sustainable SaaS approach focusing on acquiring users via a Freemium funnel.</div>

<div class="grid-2">
  <div class="box b-purple">
    <strong>Revenue Streams</strong>
    <ul style="font-size: 16px;">
      <li><strong>Freemium Tier:</strong> Basic access (capped players/quizzes) to drive organic growth.</li>
      <li><strong>Pro Plan ($9/mo):</strong> Unlocks higher player limits, premium analytics, and no-ads.</li>
      <li><strong>Enterprise API ($99/mo):</strong> For schools/corporations to integrate into their LMS.</li>
    </ul>
  </div>
  <div class="box b-blue">
    <strong>Growth Strategy</strong>
    <ul style="font-size: 16px;">
      <li><strong>Viral Loops:</strong> Shareable result cards drive new signups automatically.</li>
      <li><strong>B2B Sales:</strong> Direct outreach to educational institutions.</li>
    </ul>
  </div>
</div>

<div class="chart-container">
  <strong style="display: block; margin-bottom: 15px; color: #0f172a;">Expected Monthly Recurring Revenue (MRR) Targets</strong>
  
  <div class="bar-row">
    <div class="bar-label">Month 3</div>
    <div class="bar-track"><div class="bar-fill bar-1">$500 (Beta Launch)</div></div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Month 6</div>
    <div class="bar-track"><div class="bar-fill bar-2">$2,500 (Pro Launch)</div></div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Month 12</div>
    <div class="bar-track"><div class="bar-fill bar-3">$5,000 (Enterprise)</div></div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Year 2 Goal</div>
    <div class="bar-track"><div class="bar-fill bar-4">$15,000 (Scale)</div></div>
  </div>
</div>

---

## ROADMAP
<div class="subtitle">Our strategic timeline from core development to enterprise scale.</div>

<div class="timeline">
  <div class="t-step">
    <div class="icon">1</div>
    <strong>Core Sync & Setup</strong><br>
    <span style="font-size: 13px; color: #64748b;">Real-time Socket engine, Next.js UI, strict state management.</span>
    <div style="color: #16a34a; font-weight: bold; margin-top: 5px; font-size: 12px;">✓ COMPLETED</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">2</div>
    <strong>Monetization</strong><br>
    <span style="font-size: 13px; color: #64748b;">Razorpay integration, Subscription tiers, Quota enforcement.</span>
    <div style="color: #eab308; font-weight: bold; margin-top: 5px; font-size: 12px;">⏳ IN PROGRESS</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">3</div>
    <strong>AI Integration</strong><br>
    <span style="font-size: 13px; color: #64748b;">Automated quiz generation from PDFs using OpenAI API.</span>
    <div style="color: #64748b; font-weight: bold; margin-top: 5px; font-size: 12px;">📍 Q3 2026</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">4</div>
    <strong>Enterprise B2B</strong><br>
    <span style="font-size: 13px; color: #64748b;">Public API release for LMS/HR software integrations.</span>
    <div style="color: #64748b; font-weight: bold; margin-top: 5px; font-size: 12px;">📍 Q4 2026</div>
  </div>
  <div class="t-arrow">➔</div>

  <div class="t-step">
    <div class="icon">5</div>
    <strong>Mobile App</strong><br>
    <span style="font-size: 13px; color: #64748b;">React Native launch for native iOS/Android experiences.</span>
    <div style="color: #64748b; font-weight: bold; margin-top: 5px; font-size: 12px;">📍 Q1 2027</div>
  </div>
</div>

---

## TEAM COMPOSITION AND SKILL ROLES
<div class="subtitle">The engineers turning this vision into reality.</div>

<div class="team-card">
  <div class="team-avatar">AM</div>
  <div class="team-info">
    <h3>Aman Maurya</h3>
    <strong>Team Lead & Full Stack Developer</strong>
    <p>Architects the scalable backend, real-time WebSocket sync, and database modeling. Oversees end-to-end functionality.</p>
  </div>
  <div class="team-tech">Node.js / Express / Socket.io / MongoDB</div>
</div>

<div class="team-card">
  <div class="team-avatar">SK</div>
  <div class="team-info">
    <h3>Sumit Kumar</h3>
    <strong>UI/UX & Frontend Developer</strong>
    <p>Designs modern, responsive UI using React. Focuses on user experience, animations, and visual branding.</p>
  </div>
  <div class="team-tech">React.js / Next.js / TailwindCSS / Figma</div>
</div>

<div class="grid-2">
  <div class="team-card" style="margin-bottom: 0;">
    <div class="team-avatar" style="width: 50px; height: 50px; font-size: 20px;">AG</div>
    <div class="team-info">
      <h3 style="font-size: 18px;">Anuneet Gupta</h3>
      <strong style="font-size: 14px;">Backend Architecture</strong>
      <p style="font-size: 13px;">Manages API routes and Razorpay integration.</p>
    </div>
  </div>
  
  <div class="team-card" style="margin-bottom: 0;">
    <div class="team-avatar" style="width: 50px; height: 50px; font-size: 20px;">JS</div>
    <div class="team-info">
      <h3 style="font-size: 18px;">Janvi Sahu</h3>
      <strong style="font-size: 14px;">AI / ML Engineer</strong>
      <p style="font-size: 13px;">Builds the AI quiz generation models and APIs.</p>
    </div>
  </div>
</div>
