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
  .b-red { background: #fee2e2; border-left: 6px solid #dc2626; color: #7f1d1d; }
  
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

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .timeline { display: flex; gap: 15px; align-items: center; margin-top: 50px; }
  .t-step { flex: 1; text-align: center; background: #fff; padding: 20px 10px; border-radius: 12px; border-top: 6px solid #0284c7; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; }
  .t-step .icon { background: #0284c7; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto; font-weight: bold; font-size: 20px; }
  .t-arrow { font-size: 24px; color: #94a3b8; }

  .team-card { display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); gap: 15px; align-items: center; }
  .team-avatar { width: 60px; height: 60px; background: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; font-weight: bold; flex-shrink: 0; }
  .team-info { flex: 2; }
  .team-info h3 { margin: 0 0 5px 0; color: #0f172a; font-size: 20px; }
  .team-info p { margin: 0; color: #475569; font-size: 14px; line-height: 1.4; }

  .chart-container { margin-top: 20px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .bar-row { display: flex; align-items: center; margin-bottom: 15px; }
  .bar-label { width: 120px; font-weight: bold; color: #334155; font-size: 14px; }
  .bar-track { flex: 1; background: #f1f5f9; border-radius: 8px; height: 25px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: #fff; font-weight: bold; font-size: 13px; }
  .bar-1 { width: 25%; }
  .bar-2 { width: 50%; }
  .bar-3 { width: 100%; }

  .ask-box { background: #1e293b; color: white; padding: 20px; border-radius: 12px; text-align: center; }
  .ask-amount { font-size: 32px; font-weight: bold; color: #fbbf24; margin: 10px 0; }
---

<!-- Slide 1: Title -->
<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center;">
  <h1 style="font-size: 64px; color: #c2410c; margin-bottom: 10px;">SAMARPAN</h1>
  <h2 style="border: none; font-size: 28px; color: #334155; margin-bottom: 30px;">The Future of Synchronized Multiplayer Learning</h2>
  <div class="box b-blue" style="font-size: 24px; font-weight: bold; display: inline-block;">"Engage. Compete. Learn."</div>
</div>

---

## 1. THE PROBLEM: WHAT'S MISSING TODAY?
<div class="subtitle">The Engagement Crisis in EdTech & Training Platforms</div>

<div class="grid-2">
  <div class="box b-red">
    <strong>1. Extreme Isolation</strong>
    Standard platforms (like Google Forms/Legacy LMS) are lonely and static. They fail to motivate users and have high drop-off rates.
  </div>
  <div class="box b-orange">
    <strong>2. Asynchronous Flaws</strong>
    Lack of real-time synchronized progression leads to unfair advantages, cheating, and race conditions during tests.
  </div>
  <div class="box b-purple">
    <strong>3. No Retention Hooks</strong>
    Existing tools lack social growth features. There are no shareable result cards or dynamic lobbies to build community.
  </div>
  <div class="box b-blue">
    <strong>4. The Missing Link</strong>
    A massive gap exists between casual games (which lack depth) and serious assessment tools (which lack engagement).
  </div>
</div>

---

## 2. THE SOLUTION: PROJECT SAMARPAN
<div class="subtitle">Turning assessment into a highly engaging, strictly synchronized multiplayer experience.</div>

<div class="arch-container">
  <div class="arch-row">
    <div class="arch-box main">
      🎮 Dynamic Lobbies<br>
      <span style="font-size:14px; font-weight:normal;">Real-time slots, team vs team, and live avatars for instant engagement.</span>
    </div>
    <div class="arch-arrow">➔</div>
    <div class="arch-box">
      ⚙️ Strictly Synchronized Engine<br>
      <span style="font-size:14px; font-weight:normal;">Server controls all timers & progression. Zero desync or race conditions.</span>
    </div>
  </div>
  <div class="arch-arrow" style="flex-direction: column;">⬇</div>
  <div class="arch-row">
    <div class="arch-box main" style="width: 350px;">
      🛡️ "No-Answer-Reveal" Mode<br>
      <span style="font-size:14px; font-weight:normal;">Enforces absolute fairness. Answers stay hidden until the round ends.</span>
    </div>
    <div class="arch-box main" style="width: 350px;">
      📊 Premium Host Analytics<br>
      <span style="font-size:14px; font-weight:normal;">Deep insights tracking speed, accuracy, and user drop-off.</span>
    </div>
  </div>
</div>

---

## 3. WHY THIS WILL BE A MASSIVE SUCCESS
<div class="subtitle">Built for Scale. Designed for Virality.</div>

<div class="flex-row">
  <div class="col">
    <div class="box b-blue"><strong>Product-Led Viral Growth</strong> Built-in shareable result cards and direct challenge invites create a natural organic viral loop.</div>
    <div class="box b-green"><strong>Enterprise-Grade Stability</strong> Handles network drops seamlessly with strict state versioning.</div>
    <div class="box b-orange"><strong>Modern Premium UX</strong> Tailored for Gen-Z and professionals with glassmorphism and micro-animations.</div>
  </div>
  <div class="col">
    <table class="table-custom">
      <tr>
        <th>Feature Matrix</th>
        <th>Legacy Tools</th>
        <th>Samarpan</th>
      </tr>
      <tr>
        <td>Real-time Server Sync</td>
        <td class="cross">❌ No</td>
        <td class="check">✅ Yes</td>
      </tr>
      <tr>
        <td>Strict Anti-Cheat</td>
        <td class="cross">❌ No</td>
        <td class="check">✅ Yes</td>
      </tr>
      <tr>
        <td>Built-in Viral Sharing</td>
        <td class="cross">❌ No</td>
        <td class="check">✅ Yes</td>
      </tr>
      <tr>
        <td>Actionable Host Analytics</td>
        <td class="warn">⚠️ Basic</td>
        <td class="check">✅ Deep</td>
      </tr>
    </table>
  </div>
</div>

---

## 4. BUSINESS MODEL & EARNING SYSTEM
<div class="subtitle">Transitioning from a free platform to a self-sustaining SaaS model.</div>

<div class="grid-2">
  <div class="box b-purple" style="margin-bottom: 0;">
    <strong>Monetization Tiers (Razorpay)</strong>
    <ul style="font-size: 15px;">
      <li><strong>Freemium:</strong> Free access capped at limited players to drive initial viral acquisition.</li>
      <li><strong>Pro Plans:</strong> Monthly subscriptions for hosts/creators unlocking premium analytics and higher caps.</li>
      <li><strong>Enterprise B2B:</strong> Custom pricing for schools/LMS API integrations.</li>
    </ul>
  </div>
  
  <div class="chart-container" style="margin-top: 0;">
    <strong style="color: #0f172a; margin-bottom: 10px; display:block; font-size: 16px;">Expected MRR Growth (Year 1)</strong>
    <div class="bar-row">
      <div class="bar-label">Month 3</div>
      <div class="bar-track"><div class="bar-fill bar-1">$500</div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label">Month 6</div>
      <div class="bar-track"><div class="bar-fill bar-2">$2,500</div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label">Month 12</div>
      <div class="bar-track"><div class="bar-fill bar-3">$5,000 (Goal)</div></div>
    </div>
  </div>
</div>

---

## 5. FUTURE ROADMAP
<div class="subtitle">How we plan to scale the platform and expand our offerings.</div>

<div class="timeline">
  <div class="t-step">
    <div class="icon">1</div>
    <strong>Core Engine</strong><br>
    <span style="font-size: 13px; color: #64748b;">Real-time sync, lobby logic, anti-cheat mechanisms.</span>
    <div style="color: #16a34a; font-weight: bold; margin-top: 5px; font-size: 12px;">✓ DONE</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">2</div>
    <strong>SaaS Gates</strong><br>
    <span style="font-size: 13px; color: #64748b;">Razorpay integration and tier-based feature gating.</span>
    <div style="color: #eab308; font-weight: bold; margin-top: 5px; font-size: 12px;">⏳ CURRENT</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">3</div>
    <strong>AI Gen</strong><br>
    <span style="font-size: 13px; color: #64748b;">Automated quiz generation from PDFs/Syllabus.</span>
    <div style="color: #64748b; font-weight: bold; margin-top: 5px; font-size: 12px;">📍 NEXT 6 MONTHS</div>
  </div>
  <div class="t-arrow">➔</div>
  
  <div class="t-step">
    <div class="icon">4</div>
    <strong>B2B API</strong><br>
    <span style="font-size: 13px; color: #64748b;">Integrating Samarpan engine into existing LMS platforms.</span>
    <div style="color: #64748b; font-weight: bold; margin-top: 5px; font-size: 12px;">📍 NEXT 12 MONTHS</div>
  </div>
</div>

---

## 6. THE TEAM
<div class="subtitle">The engineers dedicated to revolutionizing engagement.</div>

<div class="grid-2">
  <div class="team-card">
    <div class="team-avatar">AM</div>
    <div class="team-info">
      <h3>Aman Maurya</h3>
      <p><strong>Team Lead & Full Stack</strong><br>Architects the real-time engine and DB.</p>
    </div>
  </div>
  <div class="team-card">
    <div class="team-avatar">SK</div>
    <div class="team-info">
      <h3>Sumit Kumar</h3>
      <p><strong>UI/UX & Frontend</strong><br>Builds the responsive, premium interface.</p>
    </div>
  </div>
  <div class="team-card">
    <div class="team-avatar">AG</div>
    <div class="team-info">
      <h3>Anuneet Gupta</h3>
      <p><strong>Backend Architecture</strong><br>Manages APIs and Razorpay integrations.</p>
    </div>
  </div>
  <div class="team-card">
    <div class="team-avatar">JS</div>
    <div class="team-info">
      <h3>Janvi Sahu</h3>
      <p><strong>AI / ML Engineer</strong><br>Develops AI-assisted quiz generation.</p>
    </div>
  </div>
</div>

---

## 7. THE ASK: FUNDRAISING
<div class="subtitle">Join us in capturing the next generation of EdTech.</div>

<div class="flex-row">
  <div class="col" style="flex: 1.5; display: flex; align-items: center; justify-content: center;">
    <div class="ask-box" style="width: 100%;">
      <h3 style="margin: 0; color: #94a3b8; font-size: 20px; text-transform: uppercase;">Seed Funding Goal</h3>
      <div class="ask-amount">$50,000</div>
      <p style="margin: 0; font-size: 16px; color: #cbd5e1;">(₹40 Lakhs)</p>
    </div>
  </div>
  <div class="col" style="flex: 2;">
    <div class="box b-blue" style="height: 100%;">
      <strong>Use of Funds</strong>
      <ul style="font-size: 18px; margin-top: 15px;">
        <li><strong>50% Engineering & Scale:</strong> Server costs, WebSocket infrastructure scaling, and database optimizations.</li>
        <li><strong>30% Sales & Marketing:</strong> Direct B2B outreach to schools and executing the viral growth loop.</li>
        <li><strong>20% Operational Runway:</strong> Sustaining the team for the first 12-18 months of intensive scaling.</li>
      </ul>
    </div>
  </div>
</div>
