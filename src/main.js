
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
            <th scope="col">ID</th>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody id="employee-rows"></tbody>
      </table>
    </div>
  </section>
`;

const tbody = document.querySelector("#employee-rows");
const recordCount = document.querySelector("#record-count");

tbody.innerHTML = employees.map(employee => `
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
