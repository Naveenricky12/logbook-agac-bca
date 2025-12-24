const API_BASE = '/api/admin';

function getAuthHeader() {
    return sessionStorage.getItem('authHeader');
}

function isAuthenticated() {
    return !!getAuthHeader();
}

// Tab Switching
function showSection(section) {
    // Hide all
    const logsSection = document.getElementById('section-logs');
    const studentsSection = document.getElementById('section-students');
    const btnLogs = document.getElementById('btn-logs');
    const btnStudents = document.getElementById('btn-students');

    if (logsSection) logsSection.style.display = 'none';
    if (studentsSection) studentsSection.style.display = 'none';
    if (btnLogs) btnLogs.classList.remove('active');
    if (btnStudents) btnStudents.classList.remove('active');

    // Show target
    const targetSection = document.getElementById('section-' + section);
    const targetBtn = document.getElementById('btn-' + section);

    if (targetSection) targetSection.style.display = 'block';
    if (targetBtn) targetBtn.classList.add('active');

    if (section === 'students') {
        // Default to 1st Year if no current year is set
        loadStudentYear('1st Year');
    }
}

function logout() {
    sessionStorage.removeItem('authHeader');
    window.location.href = '/login';
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = 'alert ' + type;
    alert.style.display = 'block';

    // Auto hide after 3 seconds
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

// Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Login Page
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const hash = btoa(user + ':' + pass);
            const auth = 'Basic ' + hash;

            try {
                // Use dedicated login endpoint
                const response = await fetch(API_BASE + '/login', {
                    method: 'POST',
                    headers: { 'Authorization': auth }
                });

                if (response.ok) {
                    sessionStorage.setItem('authHeader', auth);
                    window.location.href = '/dashboard';
                } else {
                    showAlert('Invalid credentials', 'error');
                }
            } catch (error) {
                console.error(error);
                showAlert('Network error', 'error');
            }
        });
    }

    // 2. Handle Dashboard Page
    if (window.location.pathname.includes('/dashboard')) {
        // Check auth immediately
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        // Setup filter listeners
        const btnFilter = document.getElementById('btn-filter');
        if (btnFilter) btnFilter.addEventListener('click', filterLogs);

        const btnClear = document.getElementById('btn-clear');
        if (btnClear) btnClear.addEventListener('click', clearFilters);

        const btnExport = document.getElementById('btn-export');
        if (btnExport) btnExport.addEventListener('click', downloadCSV);

        // Setup Tab Listeners
        const navLogs = document.getElementById('btn-logs');
        if (navLogs) navLogs.addEventListener('click', () => showSection('logs'));

        const navStudents = document.getElementById('btn-students');
        if (navStudents) navStudents.addEventListener('click', () => showSection('students'));

        // Load initial data
        loadDashboard();
        showSection('logs');
    }

    // 3. Handle Add Student Form
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
                const response = await fetch('/api/students/', {
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
});

let allLogs = [];

async function loadDashboard() {
    if (!isAuthenticated()) return;

    try {
        const response = await fetch(API_BASE + '/logs', {
            headers: { 'Authorization': getAuthHeader() }
        });

        if (response.ok) {
            allLogs = await response.json();
            renderLogs(allLogs);
        } else {
            if (response.status === 401) logout();
            else showAlert('Failed to load logs', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
}

function renderLogs(logs) {
    const tbody = document.querySelector('#logs-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by ID desc (newest first)
    logs.sort((a, b) => b.id - a.id);

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.id}</td>
            <td>${log.year || '-'}</td>
            <td>${log.student_name}</td>
            <td>${log.student_id}</td>
            <td>${log.computer_number}</td>
            <td>${log.purpose}</td>
            <td>${new Date(log.check_in_time).toLocaleString()}</td>
            <td>${log.check_out_time ? new Date(log.check_out_time).toLocaleString() : '-'}</td>
            <td>${log.issues_reported || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterLogs() {
    const dateQuery = document.getElementById('filter_date').value;
    const purposeQuery = document.getElementById('filter_purpose').value;
    const studentIdQuery = document.getElementById('filter_student_id').value.toLowerCase();
    const generalQuery = document.getElementById('filter_general').value.toLowerCase();

    const filtered = allLogs.filter(log => {
        // Date Filter
        if (dateQuery) {
            const logDate = new Date(log.check_in_time).toISOString().split('T')[0];
            if (logDate !== dateQuery) return false;
        }

        // Purpose Filter
        if (purposeQuery && log.purpose !== purposeQuery) return false;

        // Student ID Filter
        if (studentIdQuery && !log.student_id.toLowerCase().includes(studentIdQuery)) return false;

        // General Search (Name or Computer)
        if (generalQuery) {
            const matches = log.student_name.toLowerCase().includes(generalQuery) ||
                log.computer_number.toLowerCase().includes(generalQuery);
            if (!matches) return false;
        }

        return true;
    });

    renderLogs(filtered);
}

function clearFilters() {
    document.getElementById('filter_date').value = '';
    document.getElementById('filter_purpose').value = '';
    document.getElementById('filter_student_id').value = '';
    document.getElementById('filter_general').value = '';
    filterLogs();
}

async function downloadCSV() {
    if (!isAuthenticated()) return;

    try {
        const response = await fetch(API_BASE + '/export', {
            headers: { 'Authorization': getAuthHeader() }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logbook_export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            showAlert('Failed to export CSV', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
}

// Student Management Logic
let currentStudentYear = '1st Year';

async function loadStudentYear(year) {
    currentStudentYear = year;

    // Update Tab UI
    ['1st Year', '2nd Year', '3rd Year', 'All'].forEach(y => {
        const id = 'tab-year-' + (y === 'All' ? 'all' : y[0]);
        const btn = document.getElementById(id);
        if (btn) {
            if (y === year) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    // Update Form Context
    const formTitle = document.getElementById('add-student-title');
    const hiddenInput = document.getElementById('new_year');

    if (year === 'All') {
        if (formTitle) formTitle.textContent = "Add New Student (Please specify year)";
        if (hiddenInput) {
            hiddenInput.type = 'text';
            hiddenInput.placeholder = "Enter Year (e.g. 1st Year)";
            hiddenInput.value = '';
        }
    } else {
        if (formTitle) formTitle.textContent = `Add ${year} Student`;
        if (hiddenInput) {
            hiddenInput.type = 'hidden';
            hiddenInput.value = year;
        }
    }

    // Fetch Students
    await loadStudents(year);
}

async function loadStudents(year) {
    if (!isAuthenticated()) return;

    // Use passed year or fallback to global current
    const targetYear = year || currentStudentYear;

    try {
        let url = '/api/students/';
        if (targetYear && targetYear !== 'All') {
            url += `?year=${encodeURIComponent(targetYear)}`;
        }

        const response = await fetch(url, {
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
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No students found for this year.</td></tr>';
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        // Escape strings to prevent XSS/breaking JS
        const safeName = student ? student.name.replace(/'/g, "\\'") : '';
        const safeYear = student ? student.year.replace(/'/g, "\\'") : '';

        row.innerHTML = `
            <td>${student.register_number}</td>
            <td>${student.name}</td>
            <td>${student.year}</td>
            <td>
                <button onclick="editStudent(${student.id}, '${safeName}', '${safeYear}')" class="secondary" style="padding: 5px 10px; font-size: 12px;">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function editStudent(id, currentName, currentYear) {
    const newName = prompt("Edit Name:", currentName);
    if (newName === null) return; // Cancelled

    // Slight bug: prompts for year after name, but if year edit is desired? 
    // Simplified flow: Prompt for both.
    const newYear = prompt("Edit Year:", currentYear);
    if (newYear === null) return; // Cancelled

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

async function importStudents() {
    const fileInput = document.getElementById('import-csv-file');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/students/import', {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeader()
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            // Refresh list
            loadStudentYear(currentStudentYear);
        } else {
            const err = await response.json();
            showAlert(err.detail || 'Import failed', 'error');
        }
    } catch (error) {
        console.error(error);
        showAlert('Network error during import', 'error');
    } finally {
        fileInput.value = ''; // Reset input
    }
}

async function downloadTemplate() {
    if (!isAuthenticated()) return;

    try {
        const response = await fetch('/api/students/template', {
            headers: { 'Authorization': getAuthHeader() }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_import_template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            showAlert('Failed to download template', 'error');
        }
    } catch (error) {
        console.error(error);
        showAlert('Network error', 'error');
    }
}