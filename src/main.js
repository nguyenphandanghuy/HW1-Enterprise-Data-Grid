
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

    <div class="table-wrapper">
      <table>
        <caption>Employee records including department, role, and status</caption>
        
<thead>
  <tr>
    <th scope="col">
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
  </section>
`;


const tbody = document.querySelector("#employee-rows");
const recordCount = document.querySelector("#record-count");

let sortKey = "id";
let sortDirection = "asc";

function renderRows() {
  const sortedEmployees = [...employees].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    let comparison;

    if (typeof valueA === "number" && typeof valueB === "number") {
      comparison = valueA - valueB;
    } else {
      comparison = String(valueA).localeCompare(String(valueB));
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  tbody.innerHTML = sortedEmployees.map(employee => `
    <tr>
      <td>${employee.id}</td>
      <th scope="row">${employee.name}</th>
      <td>${employee.department}</td>
      <td>${employee.role}</td>
      <td>
        <span class="status status-${employee.status.toLowerCase().replaceAll(" ", "-")}">
          ${employee.status}
        </span>
      </td>
    </tr>
  `).join("");

  recordCount.textContent = `${employees.length} employees`;

  document.querySelectorAll("thead button[data-sort]").forEach(button => {
    const isCurrent = button.dataset.sort === sortKey;
    button.setAttribute(
      "aria-label",
      `Sort by ${button.dataset.sort}${isCurrent ? `, currently ${sortDirection === "asc" ? "ascending" : "descending"}` : ""}`
    );

    button.setAttribute(
      "aria-pressed",
      String(isCurrent)
    );
  });
}

document.querySelectorAll("thead button[data-sort]").forEach(button => {
  button.addEventListener("click", () => {
    const selectedKey = button.dataset.sort;

    if (sortKey === selectedKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = selectedKey;
      sortDirection = "asc";
    }

    renderRows();
  });
});

renderRows();
