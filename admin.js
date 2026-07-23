<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#006b73"><link rel="icon" href="icons/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="stylesheet" href="styles.css"><title>Espace QSE | SERINDUS</title>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="index.html"><span class="brand-mark">S</span><span><strong>SERINDUS</strong><small>Espace QSE</small></span></a>
    <a class="admin-link" href="index.html">Nouvelle remontée</a>
  </header>
  <main class="admin-main">
    <section id="loginCard" class="card login-card">
      <p class="eyebrow">ACCÈS RÉSERVÉ</p><h1>Espace administrateur QSE</h1>
      <p>Entrez le code administrateur défini dans le fichier de configuration.</p>
      <form id="loginForm"><label>Code d’accès<input id="adminCode" type="password" required></label><button class="primary" type="submit">Se connecter</button></form>
      <p class="demo-note">Code de démonstration : <code>QSE2026</code>. À modifier avant diffusion.</p>
    </section>
    <section id="dashboard" hidden>
      <div class="dashboard-head"><div><p class="eyebrow">PILOTAGE QSE</p><h1>Remontées terrain</h1></div><button id="logout" class="secondary">Déconnexion</button></div>
      <div class="stats">
        <article><span>Total</span><strong id="statTotal">0</strong></article>
        <article><span>Nouvelles</span><strong id="statNew">0</strong></article>
        <article class="red"><span>Priorité 1</span><strong id="statP1">0</strong></article>
        <article class="orange"><span>À traiter</span><strong id="statOpen">0</strong></article>
      </div>
      <div class="card filters">
        <label>Rechercher<input id="searchFilter" placeholder="Client, chantier, déclarant…"></label>
        <label>Société<select id="companyFilter"><option value="">Toutes</option><option>SETIA</option><option>SASI</option><option>SIMEC</option><option>TILCO</option><option>RICOM</option><option>PROCESS</option><option>OBTEL</option></select></label>
        <label>Priorité<select id="priorityFilter"><option value="">Toutes</option><option value="1">Priorité 1</option><option value="2">Priorité 2</option><option value="3">Priorité 3</option></select></label>
        <button id="exportCsv" class="secondary">Exporter en CSV</button>
      </div>
      <div id="reportsList" class="reports-list"></div>
      <div id="emptyState" class="card empty"><h2>Aucune remontée</h2><p>Les remontées envoyées apparaîtront ici.</p></div>
    </section>
  </main>
  <dialog id="reportDialog"><button class="dialog-close" aria-label="Fermer">×</button><div id="reportDetail"></div></dialog>
  <div id="toast" class="toast" role="status"></div>
  <script src="config.js"></script><script src="admin.js"></script>
</body>
</html>
