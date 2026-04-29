const gpuOptions = ["all", "h100", "a100", "h200", "a6000", "3090", "l40s"];

const fallbackFreeRows = [
  {
    cluster: "granite",
    partition: "granite-gpu",
    node: "grn008",
    free: "4/8",
    freeCount: 4,
    cores: 64,
    maxTime: "3-00:00:00",
    gpuType: "h100nvl",
    account: "hall",
    qos: "granite-gpu-freecycle",
  },
  {
    cluster: "notchpeak",
    partition: "notchpeak-gpu-guest",
    node: "notch501",
    free: "1/4",
    freeCount: 1,
    cores: 32,
    maxTime: "3-00:00:00",
    gpuType: "h100nvl",
    account: "owner-gpu-guest",
    qos: "notchpeak-gpu-guest",
  },
  {
    cluster: "notchpeak",
    partition: "soc-gpu-np",
    node: "notch501",
    free: "1/4",
    freeCount: 1,
    cores: 32,
    maxTime: "12:00:00",
    gpuType: "h100nvl",
    account: "soc-gpu-np",
    qos: "soc-gpushort-np",
  },
  {
    cluster: "notchpeak",
    partition: "notchpeak-gpu",
    node: "notch293",
    free: "2/4",
    freeCount: 2,
    cores: 64,
    maxTime: "3-00:00:00",
    gpuType: "a100",
    account: "notchpeak-shared-short",
    qos: "notchpeak-shared-short",
  },
  {
    cluster: "kingspeak",
    partition: "kingspeak-gpu",
    node: "kp123",
    free: "1/2",
    freeCount: 1,
    cores: 64,
    maxTime: "1-00:00:00",
    gpuType: "h200",
    account: "kingspeak-gpu",
    qos: "kingspeak-gpu",
  },
];

const fallbackHoggingRows = [
  {
    cluster: "granite",
    node: "grn008",
    userId: "u1777000",
    fullName: "Annie Case",
    advisor: "hall",
    running: "00:57",
    wallLimit: "3-00:00:00",
    gpuUsed: "h100nvlx4",
    gpuType: "h100",
    gpuCount: 4,
    jobName: "pretrain-stage3",
  },
  {
    cluster: "notchpeak",
    node: "notch501",
    userId: "u1418973",
    fullName: "Sameer Joshi",
    advisor: "soc-gpu-np",
    running: "02:14",
    wallLimit: "12:00:00",
    gpuUsed: "h100nvlx1",
    gpuType: "h100",
    gpuCount: 1,
    jobName: "llm-eval",
  },
  {
    cluster: "notchpeak",
    node: "notch293",
    userId: "u1890001",
    fullName: "Rahul Patel",
    advisor: "notchpeak-share",
    running: "18:42",
    wallLimit: "3-00:00:00",
    gpuUsed: "a100x2",
    gpuType: "a100",
    gpuCount: 2,
    jobName: "vision-ft",
  },
];

const analysisOptions = {
  free: [
    { key: "free", label: "Most Free" },
    { key: "gpuType", label: "GPU Type" },
    { key: "cluster", label: "Cluster" },
    { key: "maxTime", label: "Longest Time" },
  ],
  hogging: [
    { key: "gpuUsed", label: "Most GPUs" },
    { key: "running", label: "Longest Running" },
    { key: "userId", label: "User" },
    { key: "cluster", label: "Cluster" },
  ],
};

const primaryTitle = document.getElementById("primaryTitle");
const summaryTitle = document.getElementById("summaryTitle");
const resultMeta = document.getElementById("resultMeta");
const viewHint = document.getElementById("viewHint");
const tabNav = document.getElementById("tabNav");
const gpuFilters = document.getElementById("gpuFilters");
const analysisFilters = document.getElementById("analysisFilters");
const statsGrid = document.getElementById("statsGrid");
const primaryHead = document.getElementById("primaryHead");
const primaryBody = document.getElementById("primaryBody");
const summaryPanel = document.getElementById("summaryPanel");
const summaryHead = document.getElementById("summaryHead");
const summaryBody = document.getElementById("summaryBody");
const sallocCommand = document.getElementById("sallocCommand");
const dataStamp = document.getElementById("dataStamp");
const refreshButton = document.getElementById("refreshButton");

const state = {
  view: "free",
  gpuFilter: "all",
  selectedFreeKey: null,
  freeRows: fallbackFreeRows,
  hoggingRows: fallbackHoggingRows,
  freeGeneratedAt: null,
  hoggingGeneratedAt: null,
  sort: {
    free: { key: "free", direction: "desc" },
    hogging: { key: "gpuUsed", direction: "desc" },
    summary: { key: "gpus", direction: "desc" },
  },
};

const freeColumns = [
  { key: "cluster", label: "CLUSTER", type: "text" },
  { key: "partition", label: "PARTITION", type: "text" },
  { key: "node", label: "NODE", type: "text" },
  { key: "free", label: "FREE", type: "freeCount" },
  { key: "cores", label: "CORES", type: "number" },
  { key: "maxTime", label: "MAX_TIME", type: "duration" },
  { key: "gpuType", label: "GPU_TYPE", type: "text" },
  { key: "account", label: "ACCOUNT", type: "text" },
  { key: "qos", label: "QOS", type: "text" },
];

const hoggingColumns = [
  { key: "cluster", label: "CLUSTER", type: "text" },
  { key: "node", label: "NODE", type: "text" },
  { key: "userId", label: "USER_ID", type: "text" },
  { key: "fullName", label: "FULL_NAME", type: "text" },
  { key: "advisor", label: "ADVISOR/PI", type: "text" },
  { key: "running", label: "RUNNING", type: "duration" },
  { key: "wallLimit", label: "WALL_LIMIT", type: "duration" },
  { key: "gpuUsed", label: "GPU(used)", type: "gpuUsed" },
  { key: "jobName", label: "JOB_NAME", type: "text" },
];

const summaryColumns = [
  { key: "userId", label: "USER_ID", type: "text" },
  { key: "fullName", label: "FULL_NAME", type: "text" },
  { key: "advisor", label: "ADVISOR/PI", type: "text" },
  { key: "gpus", label: "GPUs", type: "number" },
];

function normalizeGpuType(gpuType) {
  const lower = gpuType.toLowerCase();
  if (lower.includes("h100")) return "h100";
  if (lower.includes("a100")) return "a100";
  if (lower.includes("h200")) return "h200";
  if (lower.includes("a6000")) return "a6000";
  if (lower.includes("3090")) return "3090";
  if (lower.includes("l40s")) return "l40s";
  return lower;
}

function durationToMinutes(value) {
  const daySplit = value.split("-");
  let days = 0;
  let time = value;
  if (daySplit.length === 2) {
    days = Number.parseInt(daySplit[0], 10) || 0;
    time = daySplit[1];
  }
  const parts = time.split(":").map((part) => Number.parseInt(part, 10) || 0);
  if (parts.length >= 2) {
    return days * 24 * 60 + parts[0] * 60 + parts[1];
  }
  return 0;
}

function gpuUsedCount(value) {
  const match = value.match(/x(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function compareValues(a, b, type, direction) {
  let left = a;
  let right = b;

  if (type === "number") {
    left = Number(left);
    right = Number(right);
  } else if (type === "freeCount") {
    left = Number(String(left).split("/")[0]);
    right = Number(String(right).split("/")[0]);
  } else if (type === "duration") {
    left = durationToMinutes(left);
    right = durationToMinutes(right);
  } else if (type === "gpuUsed") {
    left = gpuUsedCount(left);
    right = gpuUsedCount(right);
  } else {
    left = String(left).toLowerCase();
    right = String(right).toLowerCase();
  }

  if (left < right) return direction === "asc" ? -1 : 1;
  if (left > right) return direction === "asc" ? 1 : -1;
  return 0;
}

function getSummaryRows() {
  const byUser = new Map();
  state.hoggingRows.forEach((row) => {
    const existing = byUser.get(row.userId) || {
      userId: row.userId,
      fullName: row.fullName,
      advisor: row.advisor,
      gpus: 0,
    };
    existing.gpus += row.gpuCount;
    byUser.set(row.userId, existing);
  });
  return Array.from(byUser.values());
}

function getFilteredFreeRows() {
  let rows = [...state.freeRows];
  if (state.gpuFilter !== "all") {
    rows = rows.filter((row) => normalizeGpuType(row.gpuType) === state.gpuFilter);
  }
  const sortState = state.sort.free;
  return rows.sort((a, b) =>
    compareValues(
      a[sortState.key],
      b[sortState.key],
      freeColumns.find((col) => col.key === sortState.key).type,
      sortState.direction,
    ),
  );
}

function getFilteredHoggingRows() {
  let rows = [...state.hoggingRows];
  if (state.gpuFilter !== "all") {
    rows = rows.filter((row) => row.gpuType === state.gpuFilter);
  }
  const sortState = state.sort.hogging;
  return rows.sort((a, b) =>
    compareValues(
      a[sortState.key],
      b[sortState.key],
      hoggingColumns.find((col) => col.key === sortState.key).type,
      sortState.direction,
    ),
  );
}

function getSortedSummaryRows() {
  const rows = getSummaryRows();
  const sortState = state.sort.summary;
  return rows.sort((a, b) =>
    compareValues(
      a[sortState.key],
      b[sortState.key],
      summaryColumns.find((col) => col.key === sortState.key).type,
      sortState.direction,
    ),
  );
}

function updateSelectedFreeNode(rows) {
  if (!rows.length) {
    state.selectedFreeKey = null;
    return;
  }

  if (!state.selectedFreeKey) {
    state.selectedFreeKey = `${rows[0].cluster}|${rows[0].partition}|${rows[0].node}`;
    return;
  }

  const current = rows.find(
    (row) => `${row.cluster}|${row.partition}|${row.node}` === state.selectedFreeKey,
  );
  if (!current) {
    state.selectedFreeKey = `${rows[0].cluster}|${rows[0].partition}|${rows[0].node}`;
  }
}

function renderGpuFilters() {
  gpuFilters.innerHTML = "";
  gpuOptions.forEach((gpu) => {
    const button = document.createElement("button");
    button.className = `filterButton ${state.gpuFilter === gpu ? "active" : ""}`;
    button.dataset.gpu = gpu;
    button.textContent = gpu === "all" ? "All GPUs" : gpu.toUpperCase();
    gpuFilters.appendChild(button);
  });
}

function renderAnalysisFilters() {
  analysisFilters.innerHTML = "";
  const options = analysisOptions[state.view];
  const activeSort = state.sort[state.view].key;
  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = `analysisButton ${activeSort === option.key ? "active" : ""}`;
    button.dataset.analysis = option.key;
    button.textContent = option.label;
    analysisFilters.appendChild(button);
  });
}

function renderHead(target, columns, tableName) {
  target.innerHTML = "";
  columns.forEach((column) => {
    const th = document.createElement("th");
    const button = document.createElement("button");
    const sortState = state.sort[tableName];
    const arrow = sortState.key === column.key ? (sortState.direction === "asc" ? " ↑" : " ↓") : "";
    button.className = "sortButton";
    button.dataset.table = tableName;
    button.dataset.key = column.key;
    button.textContent = `${column.label}${arrow}`;
    th.appendChild(button);
    target.appendChild(th);
  });
}

function formatGeneratedAt(value) {
  if (!value) return "Using bundled sample data.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `Updated: ${value}`;
  return `Updated: ${date.toLocaleString()}`;
}

function renderStats(cards) {
  statsGrid.innerHTML = "";
  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "statCard";
    article.innerHTML = `
      <div class="statLabel">${card.label}</div>
      <div class="statValue">${card.value}</div>
      <div class="statSubtext">${card.subtext}</div>
    `;
    statsGrid.appendChild(article);
  });
}

function buildFreeStats(rows) {
  const totalFree = rows.reduce((sum, row) => sum + Number(String(row.free).split("/")[0]), 0);
  const clusters = new Set(rows.map((row) => row.cluster)).size;
  const topRow = rows[0];
  return [
    {
      label: "Matching Rows",
      value: rows.length,
      subtext: state.gpuFilter === "all" ? "Showing every visible free GPU row." : `Filtered to ${state.gpuFilter.toUpperCase()}.`,
    },
    {
      label: "Free GPUs",
      value: totalFree,
      subtext: "Total free GPU count across the visible rows.",
    },
    {
      label: "Best Current Row",
      value: topRow ? `${topRow.node}` : "None",
      subtext: topRow ? `${topRow.gpuType} on ${topRow.cluster}` : "No matching rows.",
    },
    {
      label: "Clusters",
      value: clusters,
      subtext: "Distinct clusters represented in the filtered table.",
    },
  ];
}

function buildHoggingStats(rows) {
  const totalUsed = rows.reduce((sum, row) => sum + row.gpuCount, 0);
  const longest = [...rows].sort((a, b) => durationToMinutes(b.running) - durationToMinutes(a.running))[0];
  const largest = [...rows].sort((a, b) => b.gpuCount - a.gpuCount)[0];
  const users = new Set(rows.map((row) => row.userId)).size;
  return [
    {
      label: "Visible Jobs",
      value: rows.length,
      subtext: state.gpuFilter === "all" ? "All running jobs in the table." : `Filtered to ${state.gpuFilter.toUpperCase()}.`,
    },
    {
      label: "GPUs In Use",
      value: totalUsed,
      subtext: "Total GPUs consumed by the visible jobs.",
    },
    {
      label: "Longest Running",
      value: longest ? longest.running : "None",
      subtext: longest ? `${longest.userId} on ${longest.node}` : "No visible jobs.",
    },
    {
      label: "Biggest Visible Job",
      value: largest ? largest.gpuUsed : "None",
      subtext: largest ? `${largest.userId} on ${largest.cluster}` : "No visible jobs.",
    },
    {
      label: "Active Users",
      value: users,
      subtext: "Distinct users in the filtered table.",
    },
  ];
}

function renderFreeTable() {
  const rows = getFilteredFreeRows();
  updateSelectedFreeNode(rows);
  renderHead(primaryHead, freeColumns, "free");
  resultMeta.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  renderStats(buildFreeStats(rows));

  primaryBody.innerHTML = "";
  if (!rows.length) {
    primaryBody.innerHTML = '<tr><td class="emptyState" colspan="9">No rows for this GPU type.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const rowKey = `${row.cluster}|${row.partition}|${row.node}`;
    if (rowKey === state.selectedFreeKey) {
      tr.classList.add("selected");
    }
    tr.dataset.key = rowKey;
    tr.innerHTML = `
      <td>${row.cluster}</td>
      <td>${row.partition}</td>
      <td>${row.node}</td>
      <td>${row.free}</td>
      <td>${row.cores}</td>
      <td>${row.maxTime}</td>
      <td>${row.gpuType}</td>
      <td>${row.account}</td>
      <td>${row.qos}</td>
    `;
    primaryBody.appendChild(tr);
  });
}

function renderHoggingTable() {
  const rows = getFilteredHoggingRows();
  renderHead(primaryHead, hoggingColumns, "hogging");
  resultMeta.textContent = `${rows.length} visible job${rows.length === 1 ? "" : "s"}`;
  renderStats(buildHoggingStats(rows));

  primaryBody.innerHTML = "";
  if (!rows.length) {
    primaryBody.innerHTML = '<tr><td class="emptyState" colspan="9">No rows for this GPU type.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.cluster}</td>
      <td>${row.node}</td>
      <td>${row.userId}</td>
      <td>${row.fullName}</td>
      <td>${row.advisor}</td>
      <td>${row.running}</td>
      <td>${row.wallLimit}</td>
      <td>${row.gpuUsed}</td>
      <td>${row.jobName}</td>
    `;
    primaryBody.appendChild(tr);
  });
}

function renderSummaryTable() {
  renderHead(summaryHead, summaryColumns, "summary");
  const rows = getSortedSummaryRows();
  summaryBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.userId}</td>
      <td>${row.fullName}</td>
      <td>${row.advisor}</td>
      <td>${row.gpus}</td>
    `;
    summaryBody.appendChild(tr);
  });
}

function renderSalloc() {
  const rows = getFilteredFreeRows();
  updateSelectedFreeNode(rows);
  const selected =
    rows.find((row) => `${row.cluster}|${row.partition}|${row.node}` === state.selectedFreeKey) || rows[0];

  if (!selected) {
    sallocCommand.textContent =
      "salloc -N 1 -n 1 -A <ACCOUNT> -p <PARTITION> --gres=gpu:<GPU_TYPE>:1 -t 1:00:00";
    return;
  }

  sallocCommand.textContent =
    `salloc -M ${selected.cluster} -N 1 -n 1 -A ${selected.account} -p ${selected.partition} ` +
    `--qos=${selected.qos} --gres=gpu:${selected.gpuType}:1 -t 1:00:00`;
}

function annotateFreeRows(rows) {
  return rows.map((row) => ({
    ...row,
    freeCount: Number(String(row.free).split("/")[0]),
  }));
}

function annotateHoggingRows(rows) {
  return rows.map((row) => ({
    ...row,
    gpuType: normalizeGpuType(row.gpuUsed),
    gpuCount: gpuUsedCount(row.gpuUsed),
  }));
}

async function loadJson(path) {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadData() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";
  try {
    const [freeData, hoggingData] = await Promise.all([
      loadJson("./data/free_gpus.json"),
      loadJson("./data/whoishogging.json"),
    ]);
    state.freeRows = annotateFreeRows(freeData.rows || []);
    state.hoggingRows = annotateHoggingRows(hoggingData.rows || []);
    state.freeGeneratedAt = freeData.generated_at || null;
    state.hoggingGeneratedAt = hoggingData.generated_at || null;
  } catch (error) {
    console.error("Data load failed, using fallback rows.", error);
    state.freeRows = annotateFreeRows(fallbackFreeRows);
    state.hoggingRows = annotateHoggingRows(fallbackHoggingRows);
    state.freeGeneratedAt = null;
    state.hoggingGeneratedAt = null;
  }
  refreshButton.disabled = false;
  refreshButton.textContent = "Refresh";
  render();
}

function render() {
  renderGpuFilters();
  renderAnalysisFilters();

  document.querySelectorAll(".tabButton").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  if (state.view === "free") {
    primaryTitle.textContent = "Find GPUs";
    summaryPanel.classList.add("hidden");
    viewHint.textContent =
      "See every currently visible free GPU row first, then click the GPU filters to narrow the table to H100, A100, H200, and other types.";
    dataStamp.textContent = formatGeneratedAt(state.freeGeneratedAt);
    renderFreeTable();
  } else {
    primaryTitle.textContent = "Who Is Hogging GPUs";
    summaryTitle.textContent = "Top users by total GPU allocation";
    summaryPanel.classList.remove("hidden");
    viewHint.textContent =
      "Start from all running GPU jobs, then click GPU filters or analysis controls like Longest Running and Most GPUs to spot the heavy users quickly.";
    dataStamp.textContent = formatGeneratedAt(state.hoggingGeneratedAt);
    renderHoggingTable();
    renderSummaryTable();
  }

  renderSalloc();
}

tabNav.addEventListener("click", (event) => {
  const button = event.target.closest(".tabButton");
  if (!button) return;
  state.view = button.dataset.view;
  render();
});

gpuFilters.addEventListener("click", (event) => {
  const button = event.target.closest(".filterButton");
  if (!button) return;
  state.gpuFilter = button.dataset.gpu;
  render();
});

analysisFilters.addEventListener("click", (event) => {
  const button = event.target.closest(".analysisButton");
  if (!button) return;
  const table = state.view;
  const sortState = state.sort[table];
  if (sortState.key === button.dataset.analysis) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.key = button.dataset.analysis;
    sortState.direction = "desc";
  }
  render();
});

primaryHead.addEventListener("click", (event) => {
  const button = event.target.closest(".sortButton");
  if (!button) return;
  const tableName = button.dataset.table;
  const key = button.dataset.key;
  const sortState = state.sort[tableName];
  if (sortState.key === key) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.key = key;
    sortState.direction = "desc";
  }
  render();
});

summaryHead.addEventListener("click", (event) => {
  const button = event.target.closest(".sortButton");
  if (!button) return;
  const key = button.dataset.key;
  const sortState = state.sort.summary;
  if (sortState.key === key) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.key = key;
    sortState.direction = "desc";
  }
  render();
});

primaryBody.addEventListener("click", (event) => {
  if (state.view !== "free") return;
  const row = event.target.closest("tr");
  if (!row || !row.dataset.key) return;
  state.selectedFreeKey = row.dataset.key;
  render();
});

refreshButton.addEventListener("click", () => {
  loadData();
});

loadData();
