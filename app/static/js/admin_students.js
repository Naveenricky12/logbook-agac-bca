
// Student Management Logic

async function loadStudents() {
    if (!isAuthenticated()) return;

    try {
        const response = await fetch('/api/students', {
            headers: { 'Authorization': getAuthHeader() }
        });
        if (response.ok) {
            const students = await response.json();
            renderStudents(students);
        } else {
            showAlert('Failed to load students', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
}

function renderStudents(students) {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.register_number}</td>
            <td>${student.name}</td>
            <td>${student.year}</td>
            <td>
                <button onclick="editStudent(${student.id}, '${student.name}', '${student.year}')" class="secondary" style="padding: 5px 10px; font-size: 12px;">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add Student
const addStudentForm = document.getElementById('add-student-form');
if (addStudentForm) {
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            register_number: document.getElementById('new_reg_no').value,
            name: document.getElementById('new_name').value,
            year: document.getElementById('new_year').value
        };

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthHeader()
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showAlert('Student added successfully', 'success');
                addStudentForm.reset();
                loadStudents();
            } else {
                const err = await response.json();
                showAlert(err.detail || 'Failed to add student', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    });
}

async function editStudent(id, currentName, currentYear) {
    const newName = prompt("Edit Name:", currentName);
    const newYear = prompt("Edit Year:", currentYear);

    if (newName && newYear) {
        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthHeader()
                },
                body: JSON.stringify({ name: newName, year: newYear })
            });

            if (response.ok) {
                showAlert('Student updated', 'success');
                loadStudents();
            } else {
                showAlert('Failed to update', 'error');
            }
        } catch (error) {
            showAlert('Network error', 'error');
        }
    }
}
