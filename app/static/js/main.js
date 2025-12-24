function openTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');

    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    // Simple way to find the button that was clicked or corresponds to the tab
    const activeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase().replace(' ', '') === tabName.toLowerCase().replace(' ', '') || (tabName === 'checkin' && btn.innerText === 'Check In') || (tabName === 'checkout' && btn.innerText === 'Check Out'));
    if (activeBtn) activeBtn.classList.add('active');
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = 'alert ' + type;
    alert.style.display = 'block';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Check In Form
document.getElementById('checkin-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Safety check
    if (document.getElementById('checkin-submit-btn').disabled) return;

    const data = {
        student_id: document.getElementById('student_id').value,
        computer_number: document.getElementById('computer_number').value,
        purpose: document.getElementById('purpose').value
    };

    try {
        const response = await fetch('/api/logs/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showAlert('Check-in successful!', 'success');
            document.getElementById('checkin-form').reset();
            document.getElementById('student-details').style.display = 'none';
            document.getElementById('checkin-submit-btn').disabled = true;
        } else {
            const err = await response.json();
            showAlert(err.detail || 'Check-in failed', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
});

async function fetchStudentDetails() {
    const regNo = document.getElementById('student_id').value;
    if (!regNo) return;

    try {
        const response = await fetch(`/api/students/${regNo}`);
        if (response.ok) {
            const student = await response.json();
            document.getElementById('display_name_checkin').textContent = student.name;
            document.getElementById('display_year_checkin').textContent = student.year;
            document.getElementById('student-details').style.display = 'block';
            document.getElementById('checkin-submit-btn').disabled = false;
        } else {
            // Student not found
            document.getElementById('student-details').style.display = 'none';
            document.getElementById('checkin-submit-btn').disabled = true;
            showAlert('Student not registered. Please contact Admin.', 'error');
        }
    } catch (error) {
        console.error(error);
    }
}

// Find Active Session
document.getElementById('find-active-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('checkout_student_id').value;

    try {
        const response = await fetch(`/api/logs/active/${studentId}`);
        if (response.ok) {
            const log = await response.json();
            document.getElementById('active-session-details').style.display = 'block';
            document.getElementById('display_name').textContent = log.student_name;
            document.getElementById('display_computer').textContent = log.computer_number;
            document.getElementById('display_time').textContent = new Date(log.check_in_time).toLocaleString();
            document.getElementById('log_id').value = log.id;
            // Hide alert if it was showing error
            document.getElementById('alert').style.display = 'none';
        } else {
            document.getElementById('active-session-details').style.display = 'none';
            const err = await response.json();
            showAlert(err.detail || 'No active session found', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
});

// Confirm Checkout
document.getElementById('checkout-confirm-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logId = document.getElementById('log_id').value;
    const issues = document.getElementById('issues').value;

    try {
        const response = await fetch(`/api/logs/checkout/${logId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issues_reported: issues })
        });

        if (response.ok) {
            showAlert('Check-out successful!', 'success');
            document.getElementById('active-session-details').style.display = 'none';
            document.getElementById('find-active-form').reset();
            document.getElementById('checkout-confirm-form').reset();
        } else {
            const err = await response.json();
            showAlert(err.detail || 'Check-out failed', 'error');
        }
    } catch (error) {
        showAlert('Network error', 'error');
    }
});
