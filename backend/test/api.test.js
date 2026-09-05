const request = require('supertest');
const app = require('../server');

const skipDb = process.env.SKIP_DB_TESTS === 'true';
if (skipDb) {
  console.warn('SKIP_DB_TESTS is set — skipping DB integration tests');
}
const describeOrSkip = skipDb ? describe.skip : describe;

describeOrSkip('Patients API (integration)', () => {
  let createdId = null;

  test('GET /api/patients should return array', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/patients should create a patient', async () => {
    const pid = 'T' + Date.now();
    const payload = {
      patientId: pid,
      name: 'Test User',
      dateOfBirth: '1990-01-01',
      age: 32,
      gender: 'Other',
      phone: '9000000001',
      email: 'testuser@example.com',
      address: 'Test address',
      emergencyContact: 'EC',
      emergencyContactPhone: '9000000002',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalConditions: 'None',
      reasonForVisit: 'Testing',
      department: 'General Medicine',
      doctor: 'Dr Test',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:00'
    };

    const res = await request(app).post('/api/patients').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/registered|saved|success/i);
    createdId = pid;
  }, 20000);

  test('PUT /api/patients/:id should update patient', async () => {
    const payload = {
      patientId: createdId,
      name: 'Updated User',
      dateOfBirth: '1990-01-01',
      age: 33,
      gender: 'Other',
      phone: '9000000001',
      email: 'updated@example.com',
      address: 'Updated address',
      emergencyContact: 'EC2',
      emergencyContactPhone: '9000000003',
      bloodGroup: 'A+',
      allergies: 'None',
      medicalConditions: 'None',
      reasonForVisit: 'Updated',
      department: 'Cardiology',
      doctor: 'Dr Update',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '11:00'
    };

    const res = await request(app).put(`/api/patients/${createdId}`).send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  }, 20000);

  test('DELETE /api/patients/:id should delete patient', async () => {
    const res = await request(app).delete(`/api/patients/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  }, 20000);
});
