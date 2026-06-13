const authHeaders = () => {
  return {"Content-Type": "application/json"};
};

function toast(message, tone = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return alert(message);
  const item = document.createElement("div");
  item.className = `toast align-items-center text-bg-${tone} border-0`;
  item.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(item);
  new bootstrap.Toast(item).show();
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {...options, credentials: "same-origin", headers: {...authHeaders(), ...(options.headers || {})}});
  if (!response.ok) throw new Error((await response.json()).detail || "Request failed");
  if (response.status === 204) return null;
  return response.json();
}

function formBody(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll("input[type='checkbox']").forEach((input) => {
    body[input.name] = input.checked;
  });
  Object.keys(body).forEach((key) => {
    if (body[key] === "") delete body[key];
    if (key === "face_embedding" && typeof body[key] === "string") {
      body[key] = JSON.parse(body[key]);
    }
  });
  return body;
}

function currentLocationPayload(callback) {
  navigator.geolocation.getCurrentPosition((position) => {
    callback({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      device_info: navigator.userAgent,
      browser_fingerprint: `${screen.width}x${screen.height}-${navigator.language}`,
    });
  }, () => toast("Location permission is required", "danger"));
}

function tableCell(value) {
  const text = document.createTextNode(value ?? "");
  const cell = document.createElement("td");
  cell.appendChild(text);
  return cell;
}

function actionCell(item, table) {
  const cell = document.createElement("td");
  const editModal = table.dataset.editModal;
  if (!editModal || !item.id) {
    cell.textContent = "-";
    return cell;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-sm btn-outline-primary table-edit-button";
  button.dataset.api = `${table.dataset.api}/${item.id}`;
  button.dataset.modal = editModal;
  button.textContent = "Edit";
  cell.appendChild(button);
  return cell;
}

function tableUrl(table) {
  const params = new URLSearchParams(table.dataset.query || "");
  params.set("page", table.dataset.page || "1");
  params.set("page_size", table.dataset.pageSize || table.dataset.pageSizeDefault || "25");
  const query = params.toString();
  return `${table.dataset.api}${query ? `?${query}` : ""}`;
}

function ensurePager(table) {
  if (table.nextElementSibling?.classList.contains("table-pager")) {
    return table.nextElementSibling;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "table-pager";
  wrapper.innerHTML = `
    <div class="table-pager__left">
      <label class="form-label mb-0">Rows</label>
      <select class="form-select form-select-sm table-page-size"></select>
      <span class="table-page-summary"></span>
    </div>
    <div class="table-pager__right">
      <button class="btn btn-sm btn-outline-secondary table-prev" type="button">Prev</button>
      <span class="table-page-count"></span>
      <button class="btn btn-sm btn-outline-secondary table-next" type="button">Next</button>
    </div>`;
  table.insertAdjacentElement("afterend", wrapper);
  const select = wrapper.querySelector(".table-page-size");
  const sizes = (table.dataset.pageSizes || "25,50,75,100").split(",").map((size) => size.trim()).filter(Boolean);
  sizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    select.appendChild(option);
  });
  table.dataset.pageSizeDefault = table.dataset.pageSize || sizes[0] || "25";
  table.dataset.pageSize = table.dataset.pageSizeDefault;
  select.value = table.dataset.pageSize;
  select.addEventListener("change", () => {
    table.dataset.pageSize = select.value;
    table.dataset.page = "1";
    hydrateDataTable(table);
  });
  wrapper.querySelector(".table-prev").addEventListener("click", () => {
    table.dataset.page = String(Math.max(1, Number(table.dataset.page || "1") - 1));
    hydrateDataTable(table);
  });
  wrapper.querySelector(".table-next").addEventListener("click", () => {
    const maxPage = Number(table.dataset.maxPage || "1");
    table.dataset.page = String(Math.min(maxPage, Number(table.dataset.page || "1") + 1));
    hydrateDataTable(table);
  });
  return wrapper;
}

function renderPager(table, result) {
  const pager = table.nextElementSibling?.classList.contains("table-pager") ? table.nextElementSibling : ensurePager(table);
  const page = Number(result.page || table.dataset.page || 1);
  const pageSize = Number(result.page_size || table.dataset.pageSize || 25);
  const total = Number(result.total || 0);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  table.dataset.page = String(page);
  table.dataset.pageSize = String(pageSize);
  table.dataset.maxPage = String(maxPage);
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  pager.querySelector(".table-page-summary").textContent = `Showing ${start}-${end} of ${total}`;
  pager.querySelector(".table-page-count").textContent = `Page ${page} of ${maxPage}`;
  pager.querySelector(".table-prev").disabled = page <= 1;
  pager.querySelector(".table-next").disabled = page >= maxPage;
  pager.querySelector(".table-page-size").value = String(pageSize);
}

async function hydrateDataTable(table) {
  if (!table.dataset.page) table.dataset.page = "1";
  ensurePager(table);
  const columns = (table.dataset.columns || "").split(",").map((column) => column.trim()).filter(Boolean);
  const columnCount = table.querySelectorAll("thead th").length || columns.length || 1;
  const body = table.querySelector("tbody") || table.createTBody();
  body.innerHTML = "";
  try {
    const result = await apiFetch(tableUrl(table));
    renderPager(table, result);
    const items = result.items || [];
    const rows = columns.length
      ? items.map((item) => columns.map((column) => ({column, item, value: item[column] ?? ""})))
      : items.map((item) => Object.values(item).map((value) => ({column: "", item, value})));
    if (!rows.length) {
      const row = document.createElement("tr");
      const cell = tableCell("No records found");
      cell.colSpan = columnCount;
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }
    rows.forEach((values) => {
      const row = document.createElement("tr");
      values.forEach(({column, item, value}) => {
        row.appendChild(column === "actions" ? actionCell(item, table) : tableCell(value));
      });
      body.appendChild(row);
    });
  } catch (error) {
    const row = document.createElement("tr");
    const cell = tableCell(error.message || "Unable to load records");
    cell.colSpan = columnCount;
    row.appendChild(cell);
    body.appendChild(row);
  }
}

function optionLabel(item, kind) {
  if (kind === "branch") {
    return `${item.branch_name || "Branch"} (${item.branch_code || item.id})`;
  }
  if (kind === "employee") {
    return `${item.employee_code || "Employee"} - ${[item.first_name, item.last_name].filter(Boolean).join(" ") || item.email || item.id}`;
  }
  if (kind === "department") {
    return `${item.department_name || "Department"} (${item.department_code || item.id})`;
  }
  if (kind === "shift") {
    return `${item.shift_name || "Shift"} (${item.start_time || "--"}-${item.end_time || "--"})`;
  }
  if (kind === "company") {
    return `${item.company_name || "Company"} (${item.company_code || item.id})`;
  }
  return item.name || item.title || item.id;
}

async function loadSelectOptions() {
  const selects = document.querySelectorAll("select.option-loader");
  await Promise.all(Array.from(selects).map(async (select) => {
    try {
      const items = await loadOptionItems(select.dataset.source, select.dataset.loadAll === "true");
      const placeholder = select.querySelector("option[value='']")?.textContent || "Select";
      select.innerHTML = `<option value="">${placeholder}</option>`;
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = optionLabel(item, select.dataset.kind);
        if (select.dataset.kind === "company") {
          option.dataset.tenantId = item.tenant_id || "";
        }
        select.appendChild(option);
      });
      if (select.dataset.defaultValue !== undefined) {
        select.value = select.dataset.defaultValue;
      }
    } catch (error) {
      if (select.dataset.kind === "company") {
        const placeholder = select.querySelector("option[value='']")?.textContent || "Use current company";
        select.innerHTML = `<option value="">${placeholder}</option>`;
        return;
      }
      select.innerHTML = `<option value="">Unable to load options</option>`;
    }
  }));
}

async function loadDatalistOptions() {
  const inputs = document.querySelectorAll("input.option-datalist");
  await Promise.all(Array.from(inputs).map(async (input) => {
    try {
      const list = document.getElementById(input.getAttribute("list"));
      if (!list) return;
      const items = await loadOptionItems(input.dataset.source, input.dataset.loadAll === "true");
      const labelToId = {};
      list.innerHTML = "";
      items.forEach((item) => {
        const label = optionLabel(item, input.dataset.kind);
        labelToId[label] = item.id;
        const option = document.createElement("option");
        option.value = label;
        list.appendChild(option);
      });
      input.dataset.labelToId = JSON.stringify(labelToId);
    } catch (error) {
      input.placeholder = "Unable to load candidates";
    }
  }));
}

async function loadOptionItems(source, loadAll = false) {
  if (!loadAll) {
    const result = await apiFetch(source);
    return result.items || [];
  }
  const items = [];
  let page = 1;
  let total = 0;
  do {
    const separator = source.includes("?") ? "&" : "?";
    const result = await apiFetch(`${source}${separator}page=${page}&page_size=100`);
    items.push(...(result.items || []));
    total = Number(result.total || items.length);
    page += 1;
  } while (items.length < total);
  return items;
}

document.addEventListener("change", (event) => {
  if (event.target.matches("select.company-select")) {
    const selected = event.target.selectedOptions[0];
    const form = event.target.closest("form");
    const tenantInput = form?.querySelector("input[name='tenant_id']");
    if (tenantInput) tenantInput.value = selected?.dataset.tenantId || "";
  }
  if (event.target.matches("input.option-datalist")) {
    const hidden = document.querySelector(event.target.dataset.hiddenTarget);
    if (!hidden) return;
    const labelToId = JSON.parse(event.target.dataset.labelToId || "{}");
    hidden.value = labelToId[event.target.value] || "";
  }
});

function resetAjaxForm(form) {
  form.reset();
  form.dataset.method = "POST";
  form.dataset.api = form.dataset.createApi || form.dataset.api;
  form.querySelectorAll("input[type='hidden'][data-edit-id='true']").forEach((input) => input.remove());
}

function fillForm(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = form.elements[key];
    if (!input) return;
    if (input.type === "checkbox") {
      input.checked = value === true || value === "true";
      return;
    }
    input.value = value ?? "";
  });
}

document.addEventListener("click", async (event) => {
  const addButton = event.target.closest("[data-create-modal]");
  if (addButton) {
    const modal = document.querySelector(addButton.dataset.createModal);
    const form = modal?.querySelector("form.ajax-form");
    if (form) resetAjaxForm(form);
    const title = modal?.querySelector(".modal-title");
    if (title) title.textContent = addButton.dataset.createTitle || "Add";
    return;
  }

  const editButton = event.target.closest(".table-edit-button");
  if (!editButton) return;
  try {
    const modal = document.querySelector(editButton.dataset.modal);
    const form = modal?.querySelector("form.ajax-form");
    if (!modal || !form) return;
    const data = await apiFetch(editButton.dataset.api);
    resetAjaxForm(form);
    form.dataset.method = "PUT";
    form.dataset.api = editButton.dataset.api;
    fillForm(form, data);
    const title = modal.querySelector(".modal-title");
    if (title) title.textContent = "Edit Shift Rule";
    new bootstrap.Modal(modal).show();
  } catch (error) {
    toast(error.message || "Unable to load record", "danger");
  }
});

document.addEventListener("submit", async (event) => {
  try {
    if (event.target.id === "loginForm") {
      event.preventDefault();
      const body = formBody(event.target);
      await apiFetch("/api/auth/login", {method: "POST", body: JSON.stringify(body)});
      localStorage.removeItem("access_token");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("company_id");
      window.location.href = "/";
    }
    if (event.target.classList.contains("ajax-form")) {
      event.preventDefault();
      const body = formBody(event.target);
      await apiFetch(event.target.dataset.api, {method: event.target.dataset.method || "POST", body: JSON.stringify(body)});
      toast("Saved");
      window.location.reload();
    }
    if (event.target.id === "attendanceForm") {
      event.preventDefault();
      const body = formBody(event.target);
      const result = await apiFetch("/api/attendance/check-in", {method: "POST", body: JSON.stringify(body)});
      toast(result.attendance_status === "approved" ? "Manual punch-in saved." : "Manual punch-in rejected.", result.attendance_status === "approved" ? "success" : "danger");
      bootstrap.Modal.getInstance(document.getElementById("manualPunchModal"))?.hide();
      const table = document.querySelector("#attendanceTable");
      if (table) hydrateDataTable(table);
    }
    if (event.target.id === "manualPunchOutForm") {
      event.preventDefault();
      const body = formBody(event.target);
      const result = await apiFetch("/api/attendance/manual-check-out", {method: "POST", body: JSON.stringify(body)});
      toast(`Manual punch-out saved. Worked ${result.total_work_minutes || 0} min`);
      bootstrap.Modal.getInstance(document.getElementById("manualPunchModal"))?.hide();
      const table = document.querySelector("#attendanceTable");
      if (table) hydrateDataTable(table);
    }
    if (event.target.classList.contains("table-filter-form")) {
      event.preventDefault();
      const table = document.querySelector(event.target.dataset.target);
      if (!table) return;
      const params = new URLSearchParams();
      Object.entries(formBody(event.target)).forEach(([key, value]) => {
        if (value !== "") params.set(key, value);
      });
      table.dataset.query = params.toString() ? `?${params.toString()}` : "";
      table.dataset.page = "1";
      hydrateDataTable(table);
    }
  } catch (error) {
    toast(error.message || "Request failed", "danger");
  }
});

document.addEventListener("reset", (event) => {
  if (event.target.classList.contains("report-export-form")) {
    window.setTimeout(() => {
      event.target.querySelectorAll("input[type='hidden']").forEach((input) => {
        input.value = "";
      });
    }, 0);
    return;
  }
  if (!event.target.classList.contains("table-filter-form")) return;
  window.setTimeout(() => {
    const table = document.querySelector(event.target.dataset.target);
    if (!table) return;
    table.dataset.query = "";
    table.dataset.page = "1";
    hydrateDataTable(table);
  }, 0);
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    const path = new URL(link.href, window.location.origin).pathname;
    const current = window.location.pathname;
    if (path === current || (path !== "/" && current.startsWith(path))) {
      link.classList.add("active");
    }
  });
  loadSelectOptions();
  loadDatalistOptions();
  const summary = document.getElementById("myAttendanceSummary");
  if (summary) {
    apiFetch("/api/attendance/me/today").then((data) => {
      const attendance = data.attendance;
      const shift = `${data.shift_name} (${data.shift_start}-${data.shift_end})`;
      summary.textContent = attendance
        ? `${data.employee_name} | ${shift} | ${attendance.check_in_status} | ${attendance.check_out_status} | ${attendance.total_work_minutes} min`
        : `${data.employee_name} | ${shift} | Not punched in yet`;
    }).catch(() => {
      summary.textContent = "Employee profile, branch, and shift assignment are required for punch in/out.";
    });
  }
  document.getElementById("punchInButton")?.addEventListener("click", () => {
    currentLocationPayload(async (body) => {
      const result = await apiFetch("/api/attendance/punch-in", {method: "POST", body: JSON.stringify(body)});
      toast(`Punch in ${result.check_in_status}. Distance ${result.distance_from_office}m`);
      window.location.reload();
    });
  });
  document.getElementById("punchOutButton")?.addEventListener("click", () => {
    currentLocationPayload(async (body) => {
      const result = await apiFetch("/api/attendance/punch-out", {method: "POST", body: JSON.stringify(body)});
      toast(`Punch out ${result.check_out_status}. Worked ${result.total_work_minutes} min`);
      window.location.reload();
    });
  });
  document.querySelectorAll(".data-table").forEach((table) => hydrateDataTable(table));
});

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = value ?? "--";
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function statusBadge(label) {
  const normalized = String(label || "").toLowerCase();
  const tone = normalized.includes("active") || normalized.includes("approved") || normalized.includes("on time")
    ? "success"
    : normalized.includes("late") || normalized.includes("pending") || normalized.includes("half") || normalized.includes("auto")
      ? "warning"
      : normalized.includes("reject") || normalized.includes("missing") || normalized.includes("no punches")
        ? "danger"
        : "neutral";
  return `<span class="status-badge status-badge-${tone}">${escapeHtml(label || "Needs review")}</span>`;
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderDashboardTrend(data) {
  const canvas = document.getElementById("attendanceTrendChart");
  if (!canvas || !window.Chart) return;
  const labels = data.trend.map((item) => item.label);
  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Present",
          data: data.trend.map((item) => item.present),
          borderColor: "#3ecf8e",
          backgroundColor: "rgba(62, 207, 142, .08)",
          fill: true,
          tension: .35,
        },
        {
          label: "Late / Half Day",
          data: data.trend.map((item) => item.late),
          borderColor: "#f5b244",
          tension: .35,
        },
        {
          label: "Rejected",
          data: data.trend.map((item) => item.rejected),
          borderColor: "#f26b6b",
          tension: .35,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {legend: {position: "bottom", labels: {boxWidth: 10, boxHeight: 10, color: "#8b8d9a"}}},
      scales: {
        y: {beginAtZero: true, ticks: {precision: 0, color: "#8b8d9a"}, grid: {color: "rgba(255,255,255,.07)"}},
        x: {ticks: {color: "#8b8d9a"}, grid: {display: false}},
      },
    },
  });
}

function renderDashboardLists(data) {
  const exceptions = document.getElementById("exceptionList");
  if (exceptions) {
    if (!data.exceptions.length) {
      renderEmpty(exceptions, "No attendance exceptions for today.");
    } else {
      exceptions.innerHTML = data.exceptions.map((item) => `
        <a class="action-item" href="/attendance">
          <div>
            <strong>${escapeHtml(item.employee)}</strong>
            <span>${escapeHtml(item.branch)}</span>
          </div>
          <div class="action-item__meta">
            ${statusBadge(item.issue || item.status)}
          </div>
        </a>
      `).join("");
    }
  }

  const branches = document.getElementById("branchHealthList");
  if (branches) {
    if (!data.branch_health.length) {
      renderEmpty(branches, "No branches configured yet.");
    } else {
      branches.innerHTML = data.branch_health.map((item) => `
        <div class="branch-health-item">
          <div class="branch-health-item__main">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.present)}/${escapeHtml(item.employees)} present</span>
          </div>
          <div class="branch-health-item__bar">
            <span style="width:${Math.max(0, Math.min(100, Number(item.coverage) || 0))}%"></span>
          </div>
          ${statusBadge(item.status)}
        </div>
      `).join("");
    }
  }

  const gaps = document.getElementById("setupGapList");
  if (gaps) {
    if (!data.setup_gaps.length) {
      renderEmpty(gaps, "Configuration is complete for the current scope.");
    } else {
      gaps.innerHTML = data.setup_gaps.map((item) => `
        <a class="action-item" href="${escapeHtml(item.href)}">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.meta)}</span>
          </div>
          ${statusBadge("Missing")}
        </a>
      `).join("");
    }
  }
}

async function renderDashboard() {
  try {
    const data = await apiFetch("/api/dashboard/summary");
    const formattedDate = new Date(`${data.date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    setText("#dashboardDate", formattedDate);
    Object.entries(data.metrics).forEach(([key, value]) => {
      setText(`[data-dashboard-metric="${key}"]`, value);
    });
    setText("#facesEnrolled", data.enrollment.enrolled);
    setText("#facesMissing", data.enrollment.missing);
    const coverageBar = document.getElementById("faceCoverageBar");
    if (coverageBar) coverageBar.style.width = `${data.enrollment.coverage}%`;
    renderDashboardTrend(data);
    renderDashboardLists(data);
  } catch (error) {
    toast(error.message || "Unable to load dashboard", "danger");
    document.querySelectorAll(".action-list, .branch-health-list").forEach((target) => {
      renderEmpty(target, "Unable to load this panel.");
    });
  }
}

function renderBranchMap() {
  const el = document.getElementById("branchMap");
  if (!el) return;
  const map = L.map(el).setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19}).addTo(map);
}
