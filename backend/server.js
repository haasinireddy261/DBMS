const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const { getConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const staffTokens = new Map();

app.use(cors());
app.use(express.json());

function validatePatientData(patient) {
  if (!patient) {
    return 'Patient data is required.';
  }

  if (!patient.patientId || patient.patientId.trim() === '') {
    return 'Patient ID is required.';
  }

  if (!patient.name || patient.name.trim() === '') {
    return 'Full name is required.';
  }

  if (!patient.dateOfBirth) {
    return 'Date of birth is required.';
  }

  if (!patient.gender) {
    return 'Gender is required.';
  }

  if (!patient.phone || patient.phone.trim() === '') {
    return 'Phone number is required.';
  }

  if (!patient.address || patient.address.trim() === '') {
    return 'Address is required.';
  }

  if (!patient.bloodGroup) {
    return 'Blood group is required.';
  }

  if (!patient.department) {
    return 'Department is required.';
  }

  if (!patient.reasonForVisit || patient.reasonForVisit.trim() === '') {
    return 'Reason for visit is required.';
  }

  if (!patient.appointmentDate) {
    return 'Appointment date is required.';
  }

  if (!patient.appointmentTime) {
    return 'Appointment time is required.';
  }

  return null;
}

function validateStaffLogin(staff) {
  if (!staff) {
    return 'Staff login details are required.';
  }

  if (!staff.username || staff.username.trim() === '') {
    return 'Username is required.';
  }

  if (!staff.password || staff.password.trim() === '') {
    return 'Password is required.';
  }

  return null;
}

async function appointmentStatusSupported(connection) {
  try {
    const result = await connection.execute(
      `SELECT COUNT(*) AS STATUS_COUNT
       FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'APPOINTMENT' AND COLUMN_NAME = 'STATUS'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return Number(result.rows[0].STATUS_COUNT || 0) > 0;
  } catch (error) {
    return false;
  }
}

function getStaffToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return req.headers['x-staff-token'] || null;
}

function getStaffByToken(token) {
  if (!token) {
    return null;
  }

  return staffTokens.get(token) || null;
}

app.get('/api/patients', async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    const hasAppointmentStatus = await appointmentStatusSupported(connection);

    const query = `SELECT
        p.PATIENT_ID,
        p.FULL_NAME AS NAME,
        p.DOB,
        p.AGE,
        p.GENDER,
        p.PHONE,
        p.EMAIL,
        p.ADDRESS,
        p.EMERGENCY_CONTACT_NAME AS EMERGENCYCONTACT,
        p.EMERGENCY_CONTACT_PHONE AS EMERGENCYCONTACTPHONE,
        p.BLOOD_GROUP AS BLOODGROUP,
        p.ALLERGIES,
        p.MEDICAL_CONDITIONS AS MEDICALCONDITIONS,
        p.REASON_FOR_VISIT AS REASONFORVISIT,
        a.DEPARTMENT,
        a.DOCTOR,
        TO_CHAR(a.APPOINTMENT_DATE, 'YYYY-MM-DD') AS APPOINTMENTDATE,
        a.APPOINTMENT_TIME${hasAppointmentStatus ? ', a.STATUS' : ''}
      FROM PATIENT p
      LEFT JOIN APPOINTMENT a ON p.PATIENT_ID = a.PATIENT_ID
      ORDER BY p.PATIENT_ID`;

    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const patients = (result.rows || []).map((row) => ({
      patientId: row.PATIENT_ID,
      name: row.NAME,
      dateOfBirth: row.DOB ? new Date(row.DOB).toISOString().split('T')[0] : '',
      age: row.AGE,
      gender: row.GENDER,
      phone: row.PHONE,
      email: row.EMAIL,
      address: row.ADDRESS,
      emergencyContact: row.EMERGENCYCONTACT,
      emergencyContactPhone: row.EMERGENCYCONTACTPHONE,
      bloodGroup: row.BLOODGROUP,
      allergies: row.ALLERGIES,
      medicalConditions: row.MEDICALCONDITIONS,
      reasonForVisit: row.REASONFORVISIT,
      department: row.DEPARTMENT,
      doctor: row.DOCTOR,
      appointmentDate: row.APPOINTMENTDATE,
      appointmentTime: row.APPOINTMENT_TIME,
      status: hasAppointmentStatus ? (row.STATUS || 'Scheduled') : 'Scheduled'
    }));

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    res.status(500).json({ message: 'Unable to connect to the database. Please check the Oracle database connection.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post('/api/patients', async (req, res) => {
  const patient = req.body;
  const errorMessage = validatePatientData(patient);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  let connection;

  try {
    connection = await getConnection();
    const hasAppointmentStatus = await appointmentStatusSupported(connection);

    const patientId = patient.patientId.trim();
    const dob = new Date(patient.dateOfBirth);
    const age = Number(patient.age) || 0;

    const patientSql = `
      INSERT INTO PATIENT (
        PATIENT_ID,
        FULL_NAME,
        DOB,
        AGE,
        GENDER,
        PHONE,
        EMAIL,
        ADDRESS,
        EMERGENCY_CONTACT_NAME,
        EMERGENCY_CONTACT_PHONE,
        BLOOD_GROUP,
        ALLERGIES,
        MEDICAL_CONDITIONS,
        REASON_FOR_VISIT,
        CREATED_AT
      ) VALUES (
        :patientId,
        :fullName,
        :dob,
        :age,
        :gender,
        :phone,
        :email,
        :address,
        :emergencyContact,
        :emergencyContactPhone,
        :bloodGroup,
        :allergies,
        :medicalConditions,
        :reasonForVisit,
        SYSDATE
      )
    `;

    await connection.execute(patientSql, {
      patientId,
      fullName: patient.name,
      dob: { type: oracledb.DATE, val: dob },
      age: { type: oracledb.NUMBER, val: age },
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || null,
      address: patient.address,
      emergencyContact: patient.emergencyContact || null,
      emergencyContactPhone: patient.emergencyContactPhone || null,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || 'None',
      medicalConditions: patient.medicalConditions || 'None',
      reasonForVisit: patient.reasonForVisit
    });

    const appointmentSql = hasAppointmentStatus
      ? `INSERT INTO APPOINTMENT (
          APPOINTMENT_ID,
          PATIENT_ID,
          DEPARTMENT,
          DOCTOR,
          APPOINTMENT_DATE,
          APPOINTMENT_TIME,
          STATUS
        ) VALUES (
          APPOINTMENT_SEQ.NEXTVAL,
          :patientId,
          :department,
          :doctor,
          :appointmentDate,
          :appointmentTime,
          :status
        )`
      : `INSERT INTO APPOINTMENT (
          APPOINTMENT_ID,
          PATIENT_ID,
          DEPARTMENT,
          DOCTOR,
          APPOINTMENT_DATE,
          APPOINTMENT_TIME
        ) VALUES (
          APPOINTMENT_SEQ.NEXTVAL,
          :patientId,
          :department,
          :doctor,
          :appointmentDate,
          :appointmentTime
        )`;

    const appointmentParams = hasAppointmentStatus
      ? {
          patientId,
          department: patient.department,
          doctor: patient.doctor || 'Dr. Assigned',
          appointmentDate: { type: oracledb.DATE, val: new Date(patient.appointmentDate) },
          appointmentTime: patient.appointmentTime,
          status: 'Scheduled'
        }
      : {
          patientId,
          department: patient.department,
          doctor: patient.doctor || 'Dr. Assigned',
          appointmentDate: { type: oracledb.DATE, val: new Date(patient.appointmentDate) },
          appointmentTime: patient.appointmentTime
        };

    await connection.execute(appointmentSql, appointmentParams);

    await connection.commit();

    res.status(201).json({
      message: 'Patient registered successfully!',
      patientId,
      name: patient.name,
      department: patient.department,
      appointmentDate: patient.appointmentDate,
      appointmentTime: patient.appointmentTime
    });
  } catch (error) {
    console.error('Error inserting patient:', error.message);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ message: 'Patient registration failed. Please try again.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const patientId = req.params.id;
  const patient = req.body;
  const errorMessage = validatePatientData(patient);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  let connection;

  try {
    connection = await getConnection();
    const hasAppointmentStatus = await appointmentStatusSupported(connection);

    await connection.execute(
      `UPDATE PATIENT SET
        FULL_NAME = :fullName,
        DOB = :dob,
        AGE = :age,
        GENDER = :gender,
        PHONE = :phone,
        EMAIL = :email,
        ADDRESS = :address,
        EMERGENCY_CONTACT_NAME = :emergencyContact,
        EMERGENCY_CONTACT_PHONE = :emergencyContactPhone,
        BLOOD_GROUP = :bloodGroup,
        ALLERGIES = :allergies,
        MEDICAL_CONDITIONS = :medicalConditions,
        REASON_FOR_VISIT = :reasonForVisit
      WHERE PATIENT_ID = :patientId`,
      {
        patientId,
        fullName: patient.name,
        dob: { type: oracledb.DATE, val: new Date(patient.dateOfBirth) },
        age: Number(patient.age),
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || null,
        address: patient.address,
        emergencyContact: patient.emergencyContact || null,
        emergencyContactPhone: patient.emergencyContactPhone || null,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies || 'None',
        medicalConditions: patient.medicalConditions || 'None',
        reasonForVisit: patient.reasonForVisit
      }
    );

    const appointmentUpdateSql = hasAppointmentStatus
      ? `UPDATE APPOINTMENT SET
          DEPARTMENT = :department,
          DOCTOR = :doctor,
          APPOINTMENT_DATE = :appointmentDate,
          APPOINTMENT_TIME = :appointmentTime,
          STATUS = :status
        WHERE PATIENT_ID = :patientId`
      : `UPDATE APPOINTMENT SET
          DEPARTMENT = :department,
          DOCTOR = :doctor,
          APPOINTMENT_DATE = :appointmentDate,
          APPOINTMENT_TIME = :appointmentTime
        WHERE PATIENT_ID = :patientId`;

    const appointmentUpdateParams = hasAppointmentStatus
      ? {
          patientId,
          department: patient.department,
          doctor: patient.doctor || 'Dr. Assigned',
          appointmentDate: { type: oracledb.DATE, val: new Date(patient.appointmentDate) },
          appointmentTime: patient.appointmentTime,
          status: patient.status || 'Scheduled'
        }
      : {
          patientId,
          department: patient.department,
          doctor: patient.doctor || 'Dr. Assigned',
          appointmentDate: { type: oracledb.DATE, val: new Date(patient.appointmentDate) },
          appointmentTime: patient.appointmentTime
        };

    await connection.execute(appointmentUpdateSql, appointmentUpdateParams);

    await connection.commit();
    res.json({ message: 'Patient updated successfully!' });
  } catch (error) {
    console.error('Error updating patient:', error.message);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ message: 'Patient update failed. Please try again.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  const patientId = req.params.id;
  let connection;

  try {
    connection = await getConnection();

    await connection.execute('DELETE FROM APPOINTMENT WHERE PATIENT_ID = :patientId', {
      patientId
    });

    await connection.execute('DELETE FROM PATIENT WHERE PATIENT_ID = :patientId', {
      patientId
    });

    await connection.commit();
    res.json({ message: 'Patient deleted successfully.' });
  } catch (error) {
    console.error('Error deleting patient:', error.message);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ message: 'Patient deletion failed. Please try again.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.post('/api/staff/login', async (req, res) => {
  const staffCredentials = req.body;
  const errorMessage = validateStaffLogin(staffCredentials);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT STAFF_ID, NAME, USERNAME, ROLE
       FROM STAFF
       WHERE USERNAME = :username
         AND PASSWORD = :password`,
      {
        username: staffCredentials.username.trim(),
        password: staffCredentials.password.trim()
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid staff username or password.' });
    }

    const staffUser = {
      staffId: result.rows[0].STAFF_ID,
      name: result.rows[0].NAME,
      username: result.rows[0].USERNAME,
      role: result.rows[0].ROLE
    };

    const token = `staff_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    staffTokens.set(token, staffUser);

    res.json({
      message: 'Staff login successful.',
      token,
      staff: staffUser
    });
  } catch (error) {
    console.error('Staff login error:', error.message);

    if (error.message && error.message.includes('table or view does not exist')) {
      return res.status(500).json({
        message: 'Staff table is missing in Oracle. Run the SQL script in SQL Plus: @C:\\Users\\K Hasini\\OneDrive\\Desktop\\dbms\\database\\patientcare_database.sql'
      });
    }

    res.status(500).json({ message: 'Staff login failed. Please try again later.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

function requireStaffAuth(req, res, next) {
  const token = getStaffToken(req);
  const staffUser = getStaffByToken(token);

  if (!staffUser) {
    return res.status(401).json({ message: 'Staff login required.' });
  }

  req.staff = staffUser;
  return next();
}

app.get('/api/staff/dashboard', requireStaffAuth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const summaryResult = await connection.execute(
      `SELECT
        (SELECT COUNT(*) FROM PATIENT) AS TOTAL_PATIENTS,
        (SELECT COUNT(*) FROM APPOINTMENT WHERE APPOINTMENT_DATE = TRUNC(SYSDATE)) AS TODAY_APPOINTMENTS,
        (SELECT COUNT(DISTINCT DEPARTMENT) FROM APPOINTMENT WHERE DEPARTMENT IS NOT NULL) AS TOTAL_DEPARTMENTS
      FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const summary = summaryResult.rows[0] || {};

    const patientsResult = await connection.execute(
      `SELECT
        p.PATIENT_ID,
        p.FULL_NAME AS NAME,
        p.AGE,
        p.GENDER,
        p.PHONE,
        a.DEPARTMENT,
        TO_CHAR(a.APPOINTMENT_DATE, 'YYYY-MM-DD') AS APPOINTMENT_DATE,
        a.DOCTOR,
        a.STATUS
      FROM PATIENT p
      LEFT JOIN APPOINTMENT a ON p.PATIENT_ID = a.PATIENT_ID
      ORDER BY p.PATIENT_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const appointmentResult = await connection.execute(
      `SELECT
        a.APPOINTMENT_ID,
        p.FULL_NAME AS PATIENT_NAME,
        a.DEPARTMENT,
        a.DOCTOR,
        TO_CHAR(a.APPOINTMENT_DATE, 'YYYY-MM-DD') AS APPOINTMENT_DATE,
        a.APPOINTMENT_TIME,
        a.STATUS
      FROM APPOINTMENT a
      LEFT JOIN PATIENT p ON p.PATIENT_ID = a.PATIENT_ID
      ORDER BY a.APPOINTMENT_DATE, a.APPOINTMENT_TIME`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      staff: req.staff,
      stats: {
        totalPatients: Number(summary.TOTAL_PATIENTS || 0),
        todaysAppointments: Number(summary.TODAY_APPOINTMENTS || 0),
        totalDepartments: Number(summary.TOTAL_DEPARTMENTS || 0)
      },
      patients: (patientsResult.rows || []).map((row) => ({
        patientId: row.PATIENT_ID,
        name: row.NAME,
        age: row.AGE,
        gender: row.GENDER,
        phone: row.PHONE,
        department: row.DEPARTMENT,
        appointmentDate: row.APPOINTMENT_DATE,
        doctor: row.DOCTOR,
        status: row.STATUS || 'Scheduled'
      })),
      appointments: (appointmentResult.rows || []).map((row) => ({
        appointmentId: row.APPOINTMENT_ID,
        patientName: row.PATIENT_NAME,
        department: row.DEPARTMENT,
        doctor: row.DOCTOR,
        appointmentDate: row.APPOINTMENT_DATE,
        appointmentTime: row.APPOINTMENT_TIME,
        status: row.STATUS || 'Scheduled'
      }))
    });
  } catch (error) {
    console.error('Staff dashboard error:', error.message);

    if (error.message && error.message.includes('table or view does not exist')) {
      return res.status(500).json({
        message: 'Database tables are missing. Run the SQL script first: @C:\\Users\\K Hasini\\OneDrive\\Desktop\\dbms\\database\\patientcare_database.sql'
      });
    }

    res.status(500).json({ message: 'Unable to load staff dashboard.' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PatientCare backend running on port ${PORT}`);
  });
}

module.exports = app;
