const scripts = {
  free: {
    installCommand:
      "mkdir -p ~/bin && curl -fsSL https://YOUR-USERNAME.github.io/YOUR-REPO/free_chpc_gpus.sh -o ~/bin/chpc-gpus && chmod +x ~/bin/chpc-gpus",
    runCommand: "~/bin/chpc-gpus",
    extraCommandLabel: "Interactive allocation template",
    extraCommand:
      "srun --cluster=<CLUSTER> --partition=<PARTITION> --account=<ACCOUNT> --qos=<QOS> --nodes=1 --ntasks=1 --cpus-per-task=4 --gres=gpu:<GPU_TYPE>:1 --time=1:00:00 --mem=32G --pty bash",
    requirements: [
      "Run this after logging into CHPC.",
      "The script depends on mychpc, sinfo, squeue, and bc.",
      "It only shows GPU partitions your account can actually use.",
    ],
    intro: "Use this when the main question is: where can I likely start a GPU job right now?",
    hint:
      "Pick a row that fits your work, then use those exact values in Open OnDemand or in the allocation template.",
    filters: true,
    columns: ["Cluster", "Partition", "Node", "Free", "Cores", "Max time", "GPU type", "Account", "QOS"],
    rows: [
      ["granite", "granite-gpu", "grn008", "4/8", "64", "3-00:00:00", "h100nvl", "hall", "granite-gpu-freecycle"],
      ["notchpeak", "notchpeak-gpu-guest", "notch501", "1/4", "32", "3-00:00:00", "h100nvl", "owner-gpu-guest", "notchpeak-gpu-guest"],
      ["notchpeak", "soc-gpu-np", "notch501", "1/4", "32", "12:00:00", "h100nvl", "soc-gpu-np", "soc-gpushort-np"],
      ["notchpeak", "notchpeak-gpu", "notch293", "2/4", "64", "3-00:00:00", "a100", "notchpeak-shared-short", "notchpeak-shared-short"],
      ["kingspeak", "kingspeak-gpu", "kp123", "1/2", "64", "1-00:00:00", "h200", "kingspeak-gpu", "kingspeak-gpu"],
    ],
  },
  hogging: {
    installCommand:
      "mkdir -p ~/bin && curl -fsSL https://YOUR-USERNAME.github.io/YOUR-REPO/whoishogging.sh -o ~/bin/whoishogging && chmod +x ~/bin/whoishogging",
    runCommand: "~/bin/whoishogging",
    extraCommandLabel: "Optional filter examples",
    extraCommand: "~/bin/whoishogging notchpeak\n~/bin/whoishogging owner-gpu-guest\n~/bin/whoishogging u1234567",
    requirements: [
      "Run this after logging into CHPC.",
      "The script depends on squeue, awk, grep, and sort.",
      "It reports active GPU jobs and then summarizes GPU usage by user.",
    ],
    intro: "Use this when the main question is: who is currently consuming the GPU slots I care about?",
    hint:
      "The real script first prints active GPU jobs, then a per-user summary sorted by GPU count. Filter by cluster, user, account, partition, or node if the list is noisy.",
    filters: false,
    columns: ["Cluster", "User", "Account", "Partition", "Node", "GPUs", "Runtime", "Limit", "State", "Job ID"],
    rows: [
      ["notchpeak", "u1418973", "owner-gpu-guest", "notchpeak-gpu-guest", "notch501", "1", "02:14", "3-00:00:00", "R", "8123456"],
      ["notchpeak", "u1890001", "notchpeak-shared-short", "notchpeak-gpu", "notch293", "2", "18:42", "3-00:00:00", "R", "8123499"],
      ["granite", "u1777000", "hall", "granite-gpu", "grn008", "4", "00:57", "3-00:00:00", "R", "9001123"],
      ["kingspeak", "u1555002", "kingspeak-gpu", "kingspeak-gpu", "kp123", "1", "05:11", "1-00:00:00", "R", "7456123"],
    ],
  },
};

const installCommand = document.getElementById("installCommand");
const runCommand = document.getElementById("runCommand");
const extraCommand = document.getElementById("extraCommand");
const extraCommandLabel = document.getElementById("extraCommandLabel");
const requirementsList = document.getElementById("requirementsList");
const outputIntro = document.getElementById("outputIntro");
const outputHead = document.getElementById("outputHead");
const outputBody = document.getElementById("outputBody");
const outputHint = document.getElementById("outputHint");
const filterBlock = document.getElementById("filterBlock");
const filterGroup = document.getElementById("filterGroup");
const scriptSwitcher = document.getElementById("scriptSwitcher");
const copyButtons = document.querySelectorAll(".copyButton");

const state = {
  script: "free",
  filter: "",
};

function renderRequirements(items) {
  requirementsList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    requirementsList.appendChild(li);
  });
}

function renderTable(config) {
  outputHead.innerHTML = "";
  outputBody.innerHTML = "";

  config.columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    outputHead.appendChild(th);
  });

  let rows = config.rows;
  if (state.script === "free" && state.filter) {
    rows = rows.filter((row) => row[6].toLowerCase().includes(state.filter));
  }

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = config.columns.length;
    td.className = "emptyState";
    td.textContent = "No example rows for this filter. The real script may still find matches on CHPC.";
    tr.appendChild(td);
    outputBody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    outputBody.appendChild(tr);
  });
}

function renderScriptCards(activeScript) {
  document.querySelectorAll(".scriptChip").forEach((button) => {
    button.classList.toggle("active", button.dataset.script === activeScript);
  });
  document.querySelectorAll(".scriptCard").forEach((card) => {
    card.classList.toggle("active", card.dataset.scriptCard === activeScript);
  });
}

function render() {
  const config = scripts[state.script];
  installCommand.textContent = config.installCommand;
  runCommand.textContent =
    state.script === "free" && state.filter ? `${config.runCommand} ${state.filter}` : config.runCommand;
  extraCommandLabel.textContent = config.extraCommandLabel;
  extraCommand.textContent = config.extraCommand;
  outputIntro.textContent = config.intro;
  outputHint.textContent =
    state.script === "free" && state.filter
      ? `Showing an example filtered to "${state.filter}". ${config.hint}`
      : config.hint;

  filterBlock.classList.toggle("hidden", !config.filters);
  renderRequirements(config.requirements);
  renderTable(config);
  renderScriptCards(state.script);
}

function setScript(scriptName) {
  state.script = scriptName;
  if (scriptName !== "free") {
    state.filter = "";
  }
  render();
}

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll(".filterChip").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  render();
}

async function copyText(targetId, button) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.textContent);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch (error) {
    console.error("Clipboard copy failed", error);
  }
}

scriptSwitcher.addEventListener("click", (event) => {
  const button = event.target.closest(".scriptChip");
  if (!button) return;
  setScript(button.dataset.script);
});

document.querySelectorAll(".scriptCard").forEach((card) => {
  card.addEventListener("click", () => {
    setScript(card.dataset.scriptCard);
  });
});

filterGroup.addEventListener("click", (event) => {
  const button = event.target.closest(".filterChip");
  if (!button) return;
  setFilter(button.dataset.filter);
});

copyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    copyText(button.dataset.copyTarget, button);
  });
});

render();
