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
    const rows = columns.length
      ? result.items.map((item) => columns.map((column) => item[column] ?? ""))
      : result.items.map(Object.values);
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
      values.forEach((value) => row.appendChild(tableCell(value)));
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
      const result = await apiFetch(select.dataset.source);
      const placeholder = select.querySelector("option[value='']")?.textContent || "Select";
      select.innerHTML = `<option value="">${placeholder}</option>`;
      result.items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = optionLabel(item, select.dataset.kind);
        if (select.dataset.kind === "company") {
          option.dataset.tenantId = item.tenant_id || "";
        }
        select.appendChild(option);
      });
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

document.addEventListener("change", (event) => {
  if (event.target.matches("select.company-select")) {
    const selected = event.target.selectedOptions[0];
    const form = event.target.closest("form");
    const tenantInput = form?.querySelector("input[name='tenant_id']");
    if (tenantInput) tenantInput.value = selected?.dataset.tenantId || "";
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "loginForm") {
    event.preventDefault();
    const body = formBody(event.target);
    const data = await apiFetch("/api/auth/login", {method: "POST", body: JSON.stringify(body)});
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("company_id");
    window.location.href = "/";
  }
  if (event.target.classList.contains("ajax-form")) {
    event.preventDefault();
    const body = formBody(event.target);
    await apiFetch(event.target.dataset.api, {method: "POST", body: JSON.stringify(body)});
    toast("Saved");
    window.location.reload();
  }
  if (event.target.id === "attendanceForm") {
    event.preventDefault();
    currentLocationPayload(async (location) => {
      const body = {...formBody(event.target), ...location};
      const result = await apiFetch("/api/attendance/check-in", {method: "POST", body: JSON.stringify(body)});
      toast(`Attendance ${result.attendance_status}. Distance ${result.distance_from_office}m`, result.attendance_status === "approved" ? "success" : "danger");
    });
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
});

document.addEventListener("reset", (event) => {
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

function renderDashboardCharts() {
  const attendance = document.getElementById("attendanceChart");
  const revenue = document.getElementById("revenueChart");
  if (attendance) new Chart(attendance, {type: "line", data: {labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], datasets: [{label: "Attendance", data: [80, 96, 88, 101, 94], borderColor: "#0f766e"}]}});
  if (revenue) new Chart(revenue, {type: "doughnut", data: {labels: ["Basic", "Professional", "Enterprise"], datasets: [{data: [35, 45, 20], backgroundColor: ["#0f766e", "#2563eb", "#f59e0b"]}]}});
}

function renderBranchMap() {
  const el = document.getElementById("branchMap");
  if (!el) return;
  const map = L.map(el).setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19}).addTo(map);
}
