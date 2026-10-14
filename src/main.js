
import "./style.css";

const employees = [
  {
    id: 1,
    name: "Nguyen An",
    department: "Engineering",
    role: "Frontend Developer",
    status: "Active"
  },
  {
    id: 2,
    name: "Tran Binh",
    department: "Finance",
    role: "Accountant",
    status: "Active"
  },
  {
    id: 3,
    name: "Le Chi",
    department: "Marketing",
    role: "Marketing Specialist",
    status: "On Leave"
  },
  {
    id: 4,
    name: "Pham Dung",
    department: "Engineering",
    role: "Backend Developer",
    status: "Active"
  },
  {
    id: 5,
    name: "Vo Giang",
    department: "Human Resources",
    role: "HR Executive",
    status: "Inactive"
  },
  {
    id: 6,
    name: "Do Hung",
    department: "Finance",
    role: "Financial Analyst",
    status: "Active"
  },
  {
    id: 7,
    name: "Bui Khanh",
    department: "Marketing",
    role: "Content Specialist",
    status: "On Leave"
  },
  {
    id: 8,
    name: "Hoang Lan",
    department: "Engineering",
    role: "QA Engineer",
    status: "Active"
  }
];

const app = document.querySelector("#app");

app.innerHTML = `
  <section
    class="data-grid-section"
    aria-labelledby="grid-heading"
  >
    <div class="grid-header">
      <div>
        <h2 id="grid-heading">Employee Directory</h2>
        <p>Manage and review employee records.</p>
      </div>

      <span id="record-count" aria-live="polite">
        Loading employees...
      </span>
    </div>

    <div class="grid-toolbar">
      <label for="employee-search">
        Search employees
      </label>

      <input
        id="employee-search"
        type="search"
        placeholder="Search name, department, role, or status..."
        autocomplete="off"
        aria-describedby="search-help"
      />

      <button
        id="clear-search"
        type="button"
      >
        Clear search
      </button>

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
              <button type="button" data-sort="id">
                ID ↕
              </button>
            </th>

            <th scope="col">
              <button type="button" data-sort="name">
                Employee ↕
              </button>
            </th>

            <th scope="col">
              <button type="button" data-sort="department">
                Department ↕
              </button>
            </th>

            <th scope="col">
              <button type="button" data-sort="role">
                Role ↕
              </button>
            </th>

            <th scope="col">
              <button type="button" data-sort="status">
                Status ↕
              </button>
            </th>
          </tr>
        </thead>

        <tbody id="employee-rows"></tbody>
      </table>
    </div>
  </section>
`;

const tbody = document.querySelector("#employee-rows");
const recordCount = document.querySelector("#record-count");
const searchInput = document.querySelector("#employee-search");
const clearSearchButton = document.querySelector("#clear-search");
const sortButtons = document.querySelectorAll("button[data-sort]");

let sortKey = "id";
let sortDirection = "asc";
let searchQuery = "";

function renderRows() {
  // Filter employees according to the search query.
  
const filteredEmployees = employees.filter((employee) => {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  // Match status as a complete value.
  if (
    ["active", "inactive", "on leave"].includes(query)
  ) {
    if (employee.status.toLowerCase() === query) {
      return true;
    }

    // Do not match "Active" inside "Inactive".
    if (
      query === "active" &&
      employee.status.toLowerCase() === "inactive"
    ) {
      return false;
    }
  }

  const searchableText = [
    employee.id,
    employee.name,
    employee.department,
    employee.role
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
});

  // Sort the filtered employees.
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    let comparison;

    if (
      typeof valueA === "number" &&
      typeof valueB === "number"
    ) {
      comparison = valueA - valueB;
    } else {
      comparison = String(valueA).localeCompare(
        String(valueB),
        undefined,
        { sensitivity: "base" }
      );
    }

    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  // Display a message when no employees match.
  if (sortedEmployees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No employees found. Try another search.
        </td>
      </tr>
    `;
  } else {
    // Render the employee rows.
    tbody.innerHTML = sortedEmployees
      .map((employee) => {
        const statusClass = employee.status
          .toLowerCase()
          .replaceAll(" ", "-");

        return `
          <tr>
            <td>${employee.id}</td>

            <th scope="row">
              ${employee.name}
            </th>

            <td>${employee.department}</td>

            <td>${employee.role}</td>

            <td>
              <span class="status status-${statusClass}">
                ${employee.status}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Announce the current result count.
  recordCount.textContent =
    `${sortedEmployees.length} of ${employees.length} employees`;

  // Update sorting information for assistive technology.
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
      `Sort by ${button.dataset.sort}, ${
        isCurrentSort
          ? `currently ${sortDirection === "asc" ? "ascending" : "descending"}`
          : "not currently sorted"
      }`
    );
  });
}

// Sort when a column heading is clicked.
sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedKey = button.dataset.sort;

    if (sortKey === selectedKey) {
      sortDirection =
        sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = selectedKey;
      sortDirection = "asc";
    }

    renderRows();
  });
});

// Filter while the user types.
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  renderRows();
});

// Clear the search field and restore all employees.
clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  renderRows();
  searchInput.focus();
});

// Initial render.
renderRows();
