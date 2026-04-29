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
  {
    cluster: "lonepeak",
    partition: "lonepeak-a6000",
    node: "lp044",
    free: "2/4",
    freeCount: 2,
    cores: 48,
    maxTime: "2-00:00:00",
    gpuType: "a6000",
    account: "lonepeak-gpu",
    qos: "lonepeak-gpu",
  },
  {
    cluster: "notchpeak",
    partition: "notchpeak-3090",
    node: "notch612",
    free: "3/4",
    freeCount: 3,
    cores: 32,
    maxTime: "1-00:00:00",
    gpuType: "3090",
    account: "notchpeak-gpu",
    qos: "notchpeak-gpu",
  },
  {
    cluster: "granite",
    partition: "granite-l40s",
    node: "grn019",
    free: "2/4",
    freeCount: 2,
    cores: 64,
    maxTime: "2-00:00:00",
    gpuType: "l40s",
    account: "granite-gpu",
    qos: "granite-gpu",
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
    node: "notch501",
    userId: "u1884200",
    fullName: "Maya Chen",
    advisor: "owner-gpu-guest",
    running: "07:43",
    wallLimit: "3-00:00:00",
    gpuUsed: "h100nvlx2",
    gpuType: "h100",
    gpuCount: 2,
    jobName: "diffusion-sweep",
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
  {
    cluster: "kingspeak",
    node: "kp123",
    userId: "u1555002",
    fullName: "Elena Brooks",
    advisor: "kingspeak-gpu",
    running: "05:11",
    wallLimit: "1-00:00:00",
    gpuUsed: "h200x1",
    gpuType: "h200",
    gpuCount: 1,
    jobName: "checkpoint-merge",
  },
  {
    cluster: "lonepeak",
    node: "lp044",
    userId: "u1666005",
    fullName: "Jordan Kim",
    advisor: "lonepeak-gpu",
    running: "11:24",
    wallLimit: "2-00:00:00",
    gpuUsed: "a6000x2",
    gpuType: "a6000",
    gpuCount: 2,
    jobName: "segmentation-train",
  },
  {
    cluster: "notchpeak",
    node: "notch612",
    userId: "u1733001",
    fullName: "Priya Singh",
    advisor: "notchpeak-gpu",
    running: "03:05",
    wallLimit: "1-00:00:00",
    gpuUsed: "3090x1",
    gpuType: "3090",
    gpuCount: 1,
    jobName: "embedding-index",
  },
  {
    cluster: "granite",
    node: "grn019",
    userId: "u2000123",
    fullName: "Leo Martinez",
    advisor: "granite-gpu",
    running: "09:31",
    wallLimit: "2-00:00:00",
    gpuUsed: "l40sx2",
    gpuType: "l40s",
    gpuCount: 2,
    jobName: "inference-batch",
  },
];

const primaryTitle = document.getElementById("primaryTitle");
const tabNav = document.getElementById("tabNav");
const gpuFilters = document.getElementById("gpuFilters");
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
  if (parts.length === 2) {
    return days * 24 * 60 + parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
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
  let rows = [...freeRows];
  rows = [...state.freeRows];
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
  return rows.sort((a, b) => compareValues(a[sortState.key], b[sortState.key], hoggingColumns.find((col) => col.key === sortState.key).type, sortState.direction));
}

function getSortedSummaryRows() {
  const rows = getSummaryRows();
  const sortState = state.sort.summary;
  return rows.sort((a, b) => compareValues(a[sortState.key], b[sortState.key], summaryColumns.find((col) => col.key === sortState.key).type, sortState.direction));
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
    button.textContent = gpu === "all" ? "All" : gpu.toUpperCase();
    gpuFilters.appendChild(button);
  });
}

function formatGeneratedAt(value) {
  if (!value) return "Using bundled sample data.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `Updated: ${value}`;
  return `Updated: ${date.toLocaleString()}`;
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

function renderFreeTable() {
  const rows = getFilteredFreeRows();
  updateSelectedFreeNode(rows);
  renderHead(primaryHead, freeColumns, "free");

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

function render() {
  renderGpuFilters();

  document.querySelectorAll(".tabButton").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  if (state.view === "free") {
    primaryTitle.textContent = "Find GPUs";
    dataStamp.textContent = formatGeneratedAt(state.freeGeneratedAt);
    summaryPanel.classList.add("hidden");
    renderFreeTable();
  } else {
    primaryTitle.textContent = "Find Who Is Hogging GPUs";
    dataStamp.textContent = formatGeneratedAt(state.hoggingGeneratedAt);
    summaryPanel.classList.remove("hidden");
    renderHoggingTable();
    renderSummaryTable();
  }

  renderSalloc();
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
