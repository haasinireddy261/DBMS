const patientForm = document.getElementById('patientForm');
const patientTableBody = document.getElementById('patientTableBody');
const searchInput = document.getElementById('searchInput');
const formAlert = document.getElementById('formAlert');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const dateOfBirthInput = document.getElementById('dateOfBirth');
const ageInput = document.getElementById('age');
const appointmentDateInput = document.getElementById('appointmentDate');

const API_BASE_URL = 'http://localhost:3000';

let patients = [];
let editingPatientId = null;

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
  patientForm.reset();
  clearAllErrors();
  editingPatientId = null;
  submitBtn.textContent = 'Register Patient';
  submitBtn.classList.remove('btn-warning');
  submitBtn.classList.add('btn-primary');
  ageInput.value = '';
  const today = new Date();
  appointmentDateInput.value = today.toISOString().split('T')[0];
}

function updateSummary() {
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

  document.getElementById('totalPatients').textContent = totalPatients;
  document.getElementById('todayAppointments').textContent = todaysAppointments;
  document.getElementById('totalDepartments').textContent = departments.size;
}

function renderPatients(searchText = '') {
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
              <button class="btn btn-sm btn-warning edit-btn" data-id="${patient.patientId}">Edit</button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${patient.patientId}">Delete</button>
            </div>
          </td>
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
    renderPatients(searchInput.value);
    updateSummary();
  } catch (error) {
    console.error('Error loading patients:', error);
    showAlert('Unable to load patient records from the database.', 'danger');
  }
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
  submitBtn.textContent = 'Update Patient';
  submitBtn.classList.remove('btn-primary');
  submitBtn.classList.add('btn-warning');
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

function handleTableActions(event) {
  const target = event.target;

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

patientForm.addEventListener('submit', savePatient);
resetBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', (event) => {
  renderPatients(event.target.value);
});
patientTableBody.addEventListener('click', handleTableActions);
dateOfBirthInput.addEventListener('change', handleDobChange);

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  appointmentDateInput.value = today.toISOString().split('T')[0];
  loadPatients();
});
