
import "./style.css";

const employees = [
  { id: 1, name: "Nguyen An", department: "Engineering", role: "Frontend Developer", status: "Active" },
  { id: 2, name: "Tran Binh", department: "Finance", role: "Accountant", status: "Active" },
  { id: 3, name: "Le Chi", department: "Marketing", role: "Marketing Specialist", status: "On Leave" },
  { id: 4, name: "Pham Dung", department: "Engineering", role: "Backend Developer", status: "Active" },
  { id: 5, name: "Vo Giang", department: "Human Resources", role: "HR Executive", status: "Inactive" },
  { id: 6, name: "Do Hung", department: "Finance", role: "Financial Analyst", status: "Active" },
  { id: 7, name: "Bui Khanh", department: "Marketing", role: "Content Specialist", status: "On Leave" },
  { id: 8, name: "Hoang Lan", department: "Engineering", role: "QA Engineer", status: "Active" }
];

const app = document.querySelector("#app");

app.innerHTML = `
  <section class="data-grid-section" aria-labelledby="grid-heading">
    <div class="grid-header">
      <div>
        <h2 id="grid-heading">Employee Directory</h2>
        <p>Manage and review employee records.</p>
      </div>
      <span id="record-count" aria-live="polite"></span>
    </div>

    <div class="grid-toolbar">
      <label for="employee-search">Search employees</label>
      <input
        id="employee-search"
        type="search"
        placeholder="Search name, department, role, or status..."
        autocomplete="off"
        aria-describedby="search-help"
      />
      <button id="clear-search" type="button">Clear search</button>
      <span id="search-help" class="visually-hidden">
        Search by employee ID, name, department, role, or status.
      </span>
    </div>

    <div class="table-wrapper">
      <table>
        <caption>
          Employee records including department, role, and status.
          Select a column heading to change the sort order.
        </caption>
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending">
              <button type="button" data-sort="id">ID ↕</button>
            </th>
            <th scope="col">
              <button type="button" data-sort="name">Employee ↕</button>
            </th>
            <th scope="col">
              <button type="button" data-sort="department">Department ↕</button>
            </th>
            <th scope="col">
              <button type="button" data-sort="role">Role ↕</button>
            </th>
            <th scope="col">
              <button type="button" data-sort="status">Status ↕</button>
            </th>
          </tr>
        </thead>
        <tbody id="employee-rows"></tbody>
      </table>
    </div>

    <nav class="pagination" aria-label="Employee table pagination">
      <button id="previous-page" type="button">Previous</button>
      <span id="page-info" aria-live="polite"></span>
      <button id="next-page" type="button">Next</button>
    </nav>
  </section>
`;

const tbody = document.querySelector("#employee-rows");
const recordCount = document.querySelector("#record-count");
const searchInput = document.querySelector("#employee-search");
const clearSearchButton = document.querySelector("#clear-search");
const sortButtons = document.querySelectorAll("button[data-sort]");
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const pageInfo = document.querySelector("#page-info");

let sortKey = "id";
let sortDirection = "asc";
let searchQuery = "";
let currentPage = 1;

const pageSize = 5;

function getFilteredAndSortedEmployees() {
  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    const status = employee.status.toLowerCase();

    if (["active", "inactive", "on leave"].includes(query)) {
      if (status === query) return true;

      if (query === "active" && status === "inactive") {
        return false;
      }
    }

    const searchableText = [
      employee.id,
      employee.name,
      employee.department,
      employee.role
    ].join(" ").toLowerCase();

    return searchableText.includes(query);
  });

  return [...filteredEmployees].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    const comparison =
      typeof valueA === "number" && typeof valueB === "number"
        ? valueA - valueB
        : String(valueA).localeCompare(String(valueB), undefined, {
            sensitivity: "base"
          });

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

function renderRows() {
  const sortedEmployees = getFilteredAndSortedEmployees();
  const totalEmployees = sortedEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));

  // Keep the page number valid after searching.
  currentPage = Math.min(currentPage, totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const pageEmployees = sortedEmployees.slice(
    startIndex,
    startIndex + pageSize
  );

  if (pageEmployees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No employees found. Try another search.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageEmployees.map((employee) => {
      const statusClass = employee.status
        .toLowerCase()
        .replaceAll(" ", "-");

      return `
        <tr>
          <td>${employee.id}</td>
          <th scope="row">${employee.name}</th>
          <td>${employee.department}</td>
          <td>${employee.role}</td>
          <td>
            <span class="status status-${statusClass}">
              ${employee.status}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  const firstShown = totalEmployees === 0 ? 0 : startIndex + 1;
  const lastShown = Math.min(startIndex + pageSize, totalEmployees);

  recordCount.textContent =
    `Showing ${firstShown}-${lastShown} of ${totalEmployees} matching employees`;

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;

  sortButtons.forEach((button) => {
    const isCurrentSort = button.dataset.sort === sortKey;
    const columnHeader = button.closest("th");

    if (isCurrentSort) {
      columnHeader.setAttribute(
        "aria-sort",
        sortDirection === "asc" ? "ascending" : "descending"
      );
    } else {
      columnHeader.removeAttribute("aria-sort");
    }

    button.setAttribute(
      "aria-label",
      `Sort by ${button.dataset.sort}${
        isCurrentSort
          ? `, currently ${sortDirection === "asc" ? "ascending" : "descending"}`
          : ""
      }`
    );
  });
}

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedKey = button.dataset.sort;

    if (sortKey === selectedKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = selectedKey;
      sortDirection = "asc";
    }

    currentPage = 1;
    renderRows();
  });
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  renderRows();
});

clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  currentPage = 1;
  renderRows();
  searchInput.focus();
});

previousButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderRows();
  }
});

nextButton.addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredAndSortedEmployees().length / pageSize)
  );

  if (currentPage < totalPages) {
    currentPage++;
    renderRows();
  }
});

renderRows();
