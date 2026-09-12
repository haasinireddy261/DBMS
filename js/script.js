const patientForm = document.getElementById('patientForm');
const patientTableBody = document.getElementById('patientTableBody');
const searchInput = document.getElementById('searchInput');
const formAlert = document.getElementById('formAlert');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const dateOfBirthInput = document.getElementById('dateOfBirth');
const ageInput = document.getElementById('age');
const appointmentDateInput = document.getElementById('appointmentDate');
const successSection = document.getElementById('success-section');
const staffLoginForm = document.getElementById('staffLoginForm');
const staffDashboardSection = document.getElementById('staffDashboardSection');
const staffLoginCard = document.getElementById('staffLoginCard');
const staffUserName = document.getElementById('staffUserName');
const staffLogoutBtn = document.getElementById('staffLogoutBtn');
const appointmentTableBody = document.getElementById('appointmentTableBody');
const patientDetailModal = document.getElementById('patientDetailModal');
const patientDetailBody = document.getElementById('patientDetailBody');

const API_BASE_URL = 'http://localhost:3000';

let patients = [];
let appointments = [];
let editingPatientId = null;
let staffToken = localStorage.getItem('patientcare_staff_token') || '';
let currentStaff = JSON.parse(localStorage.getItem('patientcare_staff_user') || 'null');

function calculateAge(dateString) {
  if (!dateString) {
    return '';
  }

  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + 'Error');

  if (field) {
    field.classList.remove('is-invalid');
  }

  if (errorElement) {
    errorElement.textContent = '';
  }
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + 'Error');

  if (field) {
    field.classList.add('is-invalid');
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearAllErrors() {
  const fields = [
    'patientId',
    'fullName',
    'dateOfBirth',
    'gender',
    'phone',
    'email',
    'address',
    'bloodGroup',
    'department',
    'reasonForVisit',
    'appointmentDate',
    'appointmentTime',
    'emergencyContactPhone'
  ];

  fields.forEach(clearFieldError);
}

function showAlert(message, type) {
  if (!formAlert) return;

  formAlert.className = `alert alert-${type}`;
  formAlert.textContent = message;
  formAlert.classList.remove('d-none');

  setTimeout(() => {
    formAlert.classList.add('d-none');
  }, 3000);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toastId = `toast-${Date.now()}`;
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function validateEmail(emailValue) {
  if (!emailValue) {
    return true;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(emailValue);
}

function validatePhone(phoneValue) {
  const phonePattern = /^(\+91|91)?[6-9]\d{9}$/;
  return phonePattern.test(phoneValue);
}

function validateForm() {
  clearAllErrors();

  let isValid = true;

  const patientId = document.getElementById('patientId').value.trim();
  const fullName = document.getElementById('fullName').value.trim();
  const dateOfBirth = document.getElementById('dateOfBirth').value;
  const gender = document.getElementById('gender').value;
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();
  const bloodGroup = document.getElementById('bloodGroup').value;
  const department = document.getElementById('department').value;
  const reasonForVisit = document.getElementById('reasonForVisit').value.trim();
  const appointmentDate = document.getElementById('appointmentDate').value;
  const appointmentTime = document.getElementById('appointmentTime').value;
  const emergencyContactPhone = document.getElementById('emergencyContactPhone').value.trim();

  if (!patientId) {
    showFieldError('patientId', 'Please enter the patient ID.');
    isValid = false;
  }

  if (!fullName) {
    showFieldError('fullName', 'Please enter the patient\'s full name.');
    isValid = false;
  } else if (!/^[A-Za-z\s.'-]+$/.test(fullName)) {
    showFieldError('fullName', 'Please enter a valid name using letters and spaces.');
    isValid = false;
  }

  if (!dateOfBirth) {
    showFieldError('dateOfBirth', 'Please select the date of birth.');
    isValid = false;
  }

  if (!gender) {
    showFieldError('gender', 'Please select a gender.');
    isValid = false;
  }

  if (!phone) {
    showFieldError('phone', 'Please enter the phone number.');
    isValid = false;
  } else if (!validatePhone(phone)) {
    showFieldError('phone', 'Please enter a valid phone number.');
    isValid = false;
  }

  if (email && !validateEmail(email)) {
    showFieldError('email', 'Please enter a valid email address.');
    isValid = false;
  }

  if (!address) {
    showFieldError('address', 'Please enter the address.');
    isValid = false;
  }

  if (!bloodGroup) {
    showFieldError('bloodGroup', 'Please select a blood group.');
    isValid = false;
  }

  if (!department) {
    showFieldError('department', 'Please select a department.');
    isValid = false;
  }

  if (!reasonForVisit) {
    showFieldError('reasonForVisit', 'Please enter the reason for visit.');
    isValid = false;
  }

  if (!appointmentDate) {
    showFieldError('appointmentDate', 'Please select an appointment date.');
    isValid = false;
  }

  if (!appointmentTime) {
    showFieldError('appointmentTime', 'Please select an appointment time.');
    isValid = false;
  }

  if (emergencyContactPhone && !validatePhone(emergencyContactPhone)) {
    showFieldError('emergencyContactPhone', 'Please enter a valid emergency contact phone number.');
    isValid = false;
  }

  return isValid;
}

function getPatientFromForm() {
  return {
    patientId: document.getElementById('patientId').value.trim(),
    name: document.getElementById('fullName').value.trim(),
    dateOfBirth: document.getElementById('dateOfBirth').value,
    age: calculateAge(document.getElementById('dateOfBirth').value),
    gender: document.getElementById('gender').value,
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    emergencyContact: document.getElementById('emergencyContact').value.trim(),
    emergencyContactPhone: document.getElementById('emergencyContactPhone').value.trim(),
    bloodGroup: document.getElementById('bloodGroup').value,
    allergies: document.getElementById('allergies').value.trim(),
    medicalConditions: document.getElementById('medicalConditions').value.trim(),
    reasonForVisit: document.getElementById('reasonForVisit').value.trim(),
    department: document.getElementById('department').value,
    doctor: document.getElementById('doctor').value.trim(),
    appointmentDate: document.getElementById('appointmentDate').value,
    appointmentTime: document.getElementById('appointmentTime').value
  };
}

function fillForm(patient) {
  document.getElementById('patientId').value = patient.patientId;
  document.getElementById('fullName').value = patient.name;
  document.getElementById('dateOfBirth').value = patient.dateOfBirth;
  ageInput.value = patient.age;
  document.getElementById('gender').value = patient.gender;
  document.getElementById('phone').value = patient.phone;
  document.getElementById('email').value = patient.email;
  document.getElementById('address').value = patient.address;
  document.getElementById('emergencyContact').value = patient.emergencyContact;
  document.getElementById('emergencyContactPhone').value = patient.emergencyContactPhone;
  document.getElementById('bloodGroup').value = patient.bloodGroup;
  document.getElementById('allergies').value = patient.allergies;
  document.getElementById('medicalConditions').value = patient.medicalConditions;
  document.getElementById('reasonForVisit').value = patient.reasonForVisit;
  document.getElementById('department').value = patient.department;
  document.getElementById('doctor').value = patient.doctor;
  document.getElementById('appointmentDate').value = patient.appointmentDate;
  document.getElementById('appointmentTime').value = patient.appointmentTime;
}

function resetForm() {
  if (patientForm) {
    patientForm.reset();
  }
  clearAllErrors();
  editingPatientId = null;
  if (submitBtn) {
    submitBtn.textContent = 'Register Patient';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');
  }
  if (ageInput) {
    ageInput.value = '';
  }
  if (appointmentDateInput) {
    const today = new Date();
    appointmentDateInput.value = today.toISOString().split('T')[0];
  }
}

function updateSummary() {
  const totalPatientsValue = document.getElementById('totalPatients');
  const todayAppointmentsValue = document.getElementById('todayAppointments');
  const totalDepartmentsValue = document.getElementById('totalDepartments');

  const totalPatients = patients.length;
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = patients.filter(
    (patient) => patient.appointmentDate === today
  ).length;

  const departments = new Set(
    patients
      .map((patient) => patient.department)
      .filter((department) => department)
  );

  if (totalPatientsValue) totalPatientsValue.textContent = totalPatients;
  if (todayAppointmentsValue) todayAppointmentsValue.textContent = todaysAppointments;
  if (totalDepartmentsValue) totalDepartmentsValue.textContent = departments.size;
}

function renderPatients(searchText = '') {
  if (!patientTableBody) return;

  const searchValue = searchText.toLowerCase().trim();
  const filteredPatients = patients.filter((patient) => {
    const searchTarget = `${patient.name} ${patient.patientId}`.toLowerCase();
    return searchTarget.includes(searchValue);
  });

  if (filteredPatients.length === 0) {
    patientTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">No patients found.</td>
      </tr>
    `;
    return;
  }

  patientTableBody.innerHTML = filteredPatients
    .map(
      (patient) => `
        <tr>
          <td>${patient.patientId}</td>
          <td>${patient.name}</td>
          <td>${patient.age}</td>
          <td>${patient.gender}</td>
          <td>${patient.phone}</td>
          <td>${patient.department}</td>
          <td>${patient.appointmentDate}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-info view-btn" data-id="${patient.patientId}">View</button>
              <button class="btn btn-sm btn-warning edit-btn" data-id="${patient.patientId}">Edit</button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${patient.patientId}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function renderAppointments(appointmentList = []) {
  if (!appointmentTableBody) return;

  if (appointmentList.length === 0) {
    appointmentTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No appointments found.</td>
      </tr>
    `;
    return;
  }

  appointmentTableBody.innerHTML = appointmentList
    .map(
      (appointment) => `
        <tr>
          <td>${appointment.appointmentId}</td>
          <td>${appointment.patientName || '-'}</td>
          <td>${appointment.department || '-'}</td>
          <td>${appointment.doctor || '-'}</td>
          <td>${appointment.appointmentDate || '-'}</td>
          <td>${appointment.appointmentTime || '-'}</td>
          <td>${appointment.status || 'Scheduled'}</td>
        </tr>
      `
    )
    .join('');
}

async function loadPatients() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients`);

    if (!response.ok) {
      throw new Error('Unable to load patients.');
    }

    patients = await response.json();
    if (searchInput) {
      renderPatients(searchInput.value);
    }
    updateSummary();
  } catch (error) {
    console.error('Error loading patients:', error);
    if (formAlert) {
      showAlert('Unable to load patient records from the database.', 'danger');
    }
  }
}

function showSuccessCard(payload) {
  const successPatientId = document.getElementById('successPatientId');
  const successPatientName = document.getElementById('successPatientName');
  const successDepartment = document.getElementById('successDepartment');
  const successAppointmentDate = document.getElementById('successAppointmentDate');
  const successAppointmentTime = document.getElementById('successAppointmentTime');

  if (successPatientId) successPatientId.textContent = payload.patientId || '-';
  if (successPatientName) successPatientName.textContent = payload.name || '-';
  if (successDepartment) successDepartment.textContent = payload.department || '-';
  if (successAppointmentDate) successAppointmentDate.textContent = payload.appointmentDate || '-';
  if (successAppointmentTime) successAppointmentTime.textContent = payload.appointmentTime || '-';

  if (patientForm) patientForm.closest('section').classList.add('d-none');
  if (successSection) successSection.classList.remove('d-none');
}

function hideSuccessCard() {
  if (successSection) successSection.classList.add('d-none');
  if (patientForm) patientForm.closest('section').classList.remove('d-none');
}

async function savePatient(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const patientData = getPatientFromForm();

  try {
    const endpoint = editingPatientId
      ? `${API_BASE_URL}/api/patients/${editingPatientId}`
      : `${API_BASE_URL}/api/patients`;

    const method = editingPatientId ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed.');
    }

    if (!editingPatientId) {
      showSuccessCard(data);
    }

    showToast(data.message || 'Patient details saved successfully.', 'success');
    resetForm();
    await loadPatients();
  } catch (error) {
    showToast(error.message || 'Patient registration failed. Please try again.', 'danger');
    console.error('Registration error:', error);
  }
}

function editPatient(patientId) {
  const patient = patients.find((item) => item.patientId === patientId);
  if (!patient) {
    return;
  }

  editingPatientId = patientId;
  fillForm(patient);
  if (submitBtn) {
    submitBtn.textContent = 'Update Patient';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-warning');
  }
  window.location.hash = '#registration-form';
}

function deletePatient(patientId) {
  const selectedPatient = patients.find((patient) => patient.patientId === patientId);
  if (!selectedPatient) return;

  const deleteModalEl = document.getElementById('deleteConfirmModal');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const bsModal = new bootstrap.Modal(deleteModalEl);

  const onConfirm = () => {
    fetch(`${API_BASE_URL}/api/patients/${patientId}`, { method: 'DELETE' })
      .then((response) => response.json())
      .then((data) => {
        showToast(data.message || 'Patient record deleted successfully.', 'danger');
        if (editingPatientId === patientId) resetForm();
        loadPatients();
        if (staffToken) {
          loadStaffDashboard();
        }
      })
      .catch((error) => {
        console.error('Delete error:', error);
        showToast('Patient deletion failed. Please try again.', 'danger');
      })
      .finally(() => {
        confirmBtn.removeEventListener('click', onConfirm);
        bsModal.hide();
      });
  };

  confirmBtn.addEventListener('click', onConfirm);
  bsModal.show();
}

function openPatientDetails(patientId) {
  const patient = patients.find((item) => item.patientId === patientId);
  if (!patient || !patientDetailBody || !patientDetailModal) return;

  patientDetailBody.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6"><strong>Patient ID:</strong> ${patient.patientId || '-'}</div>
      <div class="col-md-6"><strong>Name:</strong> ${patient.name || '-'}</div>
      <div class="col-md-6"><strong>Date of Birth:</strong> ${patient.dateOfBirth || '-'}</div>
      <div class="col-md-6"><strong>Age:</strong> ${patient.age || '-'}</div>
      <div class="col-md-6"><strong>Gender:</strong> ${patient.gender || '-'}</div>
      <div class="col-md-6"><strong>Phone:</strong> ${patient.phone || '-'}</div>
      <div class="col-md-6"><strong>Email:</strong> ${patient.email || '-'}</div>
      <div class="col-md-6"><strong>Blood Group:</strong> ${patient.bloodGroup || '-'}</div>
      <div class="col-md-12"><strong>Address:</strong> ${patient.address || '-'}</div>
      <div class="col-md-6"><strong>Emergency Contact:</strong> ${patient.emergencyContact || '-'}</div>
      <div class="col-md-6"><strong>Emergency Contact Phone:</strong> ${patient.emergencyContactPhone || '-'}</div>
      <div class="col-md-6"><strong>Allergies:</strong> ${patient.allergies || '-'}</div>
      <div class="col-md-6"><strong>Medical Conditions:</strong> ${patient.medicalConditions || '-'}</div>
      <div class="col-md-6"><strong>Reason for Visit:</strong> ${patient.reasonForVisit || '-'}</div>
      <div class="col-md-6"><strong>Department:</strong> ${patient.department || '-'}</div>
      <div class="col-md-6"><strong>Doctor:</strong> ${patient.doctor || '-'}</div>
      <div class="col-md-6"><strong>Appointment Date:</strong> ${patient.appointmentDate || '-'}</div>
      <div class="col-md-6"><strong>Appointment Time:</strong> ${patient.appointmentTime || '-'}</div>
    </div>
  `;

  const modal = new bootstrap.Modal(patientDetailModal);
  modal.show();
}

function handleTableActions(event) {
  const target = event.target;

  if (target.classList.contains('view-btn')) {
    const patientId = target.getAttribute('data-id');
    openPatientDetails(patientId);
  }

  if (target.classList.contains('edit-btn')) {
    const patientId = target.getAttribute('data-id');
    editPatient(patientId);
  }

  if (target.classList.contains('delete-btn')) {
    const patientId = target.getAttribute('data-id');
    deletePatient(patientId);
  }
}

function handleDobChange() {
  const dateValue = dateOfBirthInput.value;
  ageInput.value = calculateAge(dateValue);
}

function setStaffSession(token, staff) {
  staffToken = token;
  currentStaff = staff;
  localStorage.setItem('patientcare_staff_token', token);
  localStorage.setItem('patientcare_staff_user', JSON.stringify(staff));

  if (staffUserName) {
    staffUserName.textContent = staff.name || staff.username || 'Staff';
  }

  if (staffDashboardSection) {
    staffDashboardSection.classList.remove('d-none');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.add('d-none');
  }

  loadStaffDashboard();
}

function clearStaffSession() {
  staffToken = '';
  currentStaff = null;
  localStorage.removeItem('patientcare_staff_token');
  localStorage.removeItem('patientcare_staff_user');

  if (staffDashboardSection) {
    staffDashboardSection.classList.add('d-none');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.remove('d-none');
  }
}

async function loginStaff(event) {
  event.preventDefault();

  const username = document.getElementById('staffUsername').value.trim();
  const password = document.getElementById('staffPassword').value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/staff/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    setStaffSession(data.token, data.staff);
    showToast(data.message || 'Staff login successful.', 'success');
  } catch (error) {
    showToast(error.message || 'Staff login failed.', 'danger');
    console.error('Staff login error:', error);
  }
}

async function loadStaffDashboard() {
  if (!staffToken) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/staff/dashboard`, {
      headers: {
        Authorization: `Bearer ${staffToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load staff dashboard.');
    }

    if (data.stats) {
      const totalPatientsValue = document.getElementById('totalPatients');
      const totalAppointmentsValue = document.getElementById('todayAppointments');
      const totalDepartmentsValue = document.getElementById('totalDepartments');
      if (totalPatientsValue) totalPatientsValue.textContent = data.stats.totalPatients;
      if (totalAppointmentsValue) totalAppointmentsValue.textContent = data.stats.todaysAppointments;
      if (totalDepartmentsValue) totalDepartmentsValue.textContent = data.stats.totalDepartments;
    }

    patients = data.patients || [];
    appointments = data.appointments || [];
    renderPatients(searchInput ? searchInput.value : '');
    renderAppointments(appointments);
  } catch (error) {
    console.error('Staff dashboard load error:', error);
    showToast(error.message || 'Unable to load staff dashboard.', 'danger');
  }
}

if (patientForm) {
  patientForm.addEventListener('submit', savePatient);
}
if (resetBtn) {
  resetBtn.addEventListener('click', resetForm);
}
if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    renderPatients(event.target.value);
  });
}
if (patientTableBody) {
  patientTableBody.addEventListener('click', handleTableActions);
}
if (dateOfBirthInput) {
  dateOfBirthInput.addEventListener('change', handleDobChange);
}
if (staffLoginForm) {
  staffLoginForm.addEventListener('submit', loginStaff);
}
if (staffLogoutBtn) {
  staffLogoutBtn.addEventListener('click', clearStaffSession);
}
if (document.getElementById('newRegistrationBtn')) {
  document.getElementById('newRegistrationBtn').addEventListener('click', () => {
    hideSuccessCard();
    resetForm();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  if (appointmentDateInput) {
    appointmentDateInput.value = today.toISOString().split('T')[0];
  }

  if (staffToken && currentStaff) {
    setStaffSession(staffToken, currentStaff);
  } else {
    clearStaffSession();
  }
});
