
let state = {
  items: [],
  editId: null,
  sortField: "dateFrom",
  sortDirection: "asc",
  statusFilter: "",
  search: ""
};

const requestForm = document.getElementById("requestForm");
const formTitle = document.getElementById("formTitle");

const itemCodeEl = document.getElementById("itemCode");
const userNameEl = document.getElementById("userName");
const dateFromEl = document.getElementById("dateFrom");
const dateToEl = document.getElementById("dateTo");
const statusEl = document.getElementById("status");
const commentEl = document.getElementById("comment");

const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortField = document.getElementById("sortField");
const sortDirectionBtn = document.getElementById("sortDirection");

function showError(inputEl, errorId, message) {
  inputEl.classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(inputEl, errorId) {
  inputEl.classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}

function clearErrors() {
  clearError(itemCodeEl, "itemCodeError");
  clearError(userNameEl, "userNameError");
  clearError(dateFromEl, "dateFromError");
  clearError(dateToEl, "dateToError");
  clearError(statusEl, "statusError");
  clearError(commentEl, "commentError");
}

function saveToStorage() {
  localStorage.setItem('state', JSON.stringify(state.items));
}

function loadFromStorage() {
  const json = localStorage.getItem('state');
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function readForm() {
  return {
    itemCode: itemCodeEl.value.trim(),
    userName: userNameEl.value.trim(),
    dateFrom: dateFromEl.value,
    dateTo: dateToEl.value,
    status: statusEl.value,
    comment: commentEl.value.trim()
  };
}

function validate(dto) {
  clearErrors();
  let ok = true;

  if (dto.itemCode === "") {
    showError(itemCodeEl, "itemCodeError", "Вкажіть код/номер обладнання.");
    ok = false;
  } else if (dto.itemCode.length < 2 || dto.itemCode.length > 30) {
    showError(itemCodeEl, "itemCodeError", "Довжина має бути 2–30 символів.");
    ok = false;
  }

  if (dto.userName === "") {
    showError(userNameEl, "userNameError", "Вкажіть ПІБ користувача.");
    ok = false;
  } else if (dto.userName.length < 3 || dto.userName.length > 40) {
    showError(userNameEl, "userNameError", "Довжина має бути 3–40 символів.");
    ok = false;
  }

  if (dto.dateFrom === "") {
    showError(dateFromEl, "dateFromError", "Оберіть дату початку.");
    ok = false;
  }

  if (dto.dateTo === "") {
    showError(dateToEl, "dateToError", "Оберіть дату завершення.");
    ok = false;
  }

  if (dto.dateFrom !== "" && dto.dateTo !== "" && dto.dateFrom > dto.dateTo) {
    showError(dateToEl, "dateToError", "Дата 'по' не може бути раніше дати 'з'.");
    ok = false;
  }

  if (!dto.status) {
    showError(statusEl, "statusError", "Оберіть статус.");
    ok = false;
  }

  if (dto.comment !== "" && dto.comment.length < 5) {
    showError(commentEl, "commentError", "Якщо вводите коментар — мінімум 5 символів.");
    ok = false;
  }

  return ok;
}

function addItem(dto) {
  const item = {
    id: Date.now(), 
    ...dto
  };
  state.items.push(item);
}

function updateItem(id, dto) {
  const found = state.items.find(x => x.id === id);
  if (!found) return;
  Object.assign(found, dto);
}


function deleteItem(id) {
  state.items = state.items.filter(x => x.id !== id);
}

function startEdit(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;

  itemCodeEl.value = item.itemCode;
  userNameEl.value = item.userName;
  dateFromEl.value = item.dateFrom;
  dateToEl.value = item.dateTo;
  statusEl.value = item.status;
  commentEl.value = item.comment ?? "";

  state.editId = id;
  submitBtn.textContent = "Зберегти";
  formTitle.textContent = "Редагувати заявку";
}

function resetForm() {
  requestForm.reset();
  clearErrors();
  state.editId = null;
  submitBtn.textContent = "Додати";
  formTitle.textContent = "Додати заявку";
  itemCodeEl.focus();
}

function getViewItems() {
  const search = state.search.trim().toLowerCase();

  let data = state.items.slice();

  if (search !== "") {
    data = data.filter(x =>
      x.itemCode.toLowerCase().includes(search) ||
      x.userName.toLowerCase().includes(search)
    );
  }

  if (state.statusFilter !== "") {
    data = data.filter(x => x.status === state.statusFilter);
  }

  data.sort((a, b) => {
    const field = state.sortField;
    let va = a[field];
    let vb = b[field];

    if (va < vb) return state.sortDirection === "asc" ? -1 : 1;
    if (va > vb) return state.sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return data;
}

function render() {
  const data = getViewItems();

  emptyState.style.display = state.items.length === 0 ? "block" : "none";

  tableBody.innerHTML = data.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.itemCode)}</td>
      <td>${escapeHtml(item.userName)}</td>
      <td>${item.dateFrom}</td>
      <td>${item.dateTo}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="edit-btn" data-id="${item.id}">Редагувати</button>
          <button type="button" class="delete-btn" data-id="${item.id}">Видалити</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

requestForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const dto = readForm();
  if (!validate(dto)) return;

  if (state.editId === null) {
    addItem(dto);
  } else {
    updateItem(state.editId, dto);
  }

  saveToStorage();
  render();
  resetForm();
});

resetBtn.addEventListener("click", () => {
  resetForm();
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  render();
});

statusFilter.addEventListener("change", () => {
  state.statusFilter = statusFilter.value;
  render();
});

sortField.addEventListener("change", () => {
  state.sortField = sortField.value;
  render();
});

sortDirectionBtn.addEventListener("click", () => {
  state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  sortDirectionBtn.textContent = state.sortDirection === "asc" ? "↑ ASC" : "↓ DESC";
  render();
});

tableBody.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const idStr = target.dataset.id;
  if (!idStr) return;

  const id = Number(idStr);

  if (target.classList.contains("delete-btn")) {
    deleteItem(id);
    saveToStorage();
    render();

    if (state.editId === id) resetForm();
    return;
  }

  if (target.classList.contains("edit-btn")) {
    startEdit(id);
    return;
  }
});

state.items = loadFromStorage();
sortField.value = state.sortField;
sortDirectionBtn.textContent = state.sortDirection === "asc" ? "↑ ASC" : "↓ DESC";
render();
resetForm();
