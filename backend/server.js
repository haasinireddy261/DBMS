const express = require('express');
const cors = require('cors');
const { getConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/api/patients', async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
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
        a.APPOINTMENT_TIME
      FROM PATIENT p
      LEFT JOIN APPOINTMENT a ON p.PATIENT_ID = a.PATIENT_ID
      ORDER BY p.PATIENT_ID`,
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );

    const patients = result.rows.map((row) => ({
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
      appointmentTime: row.APPOINTMENT_TIME
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

    const patientId = patient.patientId;
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
      patientId: patientId,
      fullName: patient.name,
      dob: { type: require('oracledb').DATE, val: dob },
      age: { type: require('oracledb').NUMBER, val: age },
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

    const appointmentSql = `
      INSERT INTO APPOINTMENT (
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
      )
    `;

    await connection.execute(appointmentSql, {
      patientId: patientId,
      department: patient.department,
      doctor: patient.doctor || 'Dr. Assigned',
      appointmentDate: { type: require('oracledb').DATE, val: new Date(patient.appointmentDate) },
      appointmentTime: patient.appointmentTime
    });

    await connection.commit();

    res.status(201).json({ message: 'Patient registered successfully!' });
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
        patientId: patientId,
        fullName: patient.name,
        dob: { type: require('oracledb').DATE, val: new Date(patient.dateOfBirth) },
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

    await connection.execute(
      `UPDATE APPOINTMENT SET
        DEPARTMENT = :department,
        DOCTOR = :doctor,
        APPOINTMENT_DATE = :appointmentDate,
        APPOINTMENT_TIME = :appointmentTime
      WHERE PATIENT_ID = :patientId`,
      {
        patientId: patientId,
        department: patient.department,
        doctor: patient.doctor || 'Dr. Assigned',
        appointmentDate: { type: require('oracledb').DATE, val: new Date(patient.appointmentDate) },
        appointmentTime: patient.appointmentTime
      }
    );

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
      patientId: patientId
    });

    await connection.execute('DELETE FROM PATIENT WHERE PATIENT_ID = :patientId', {
      patientId: patientId
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PatientCare backend running on port ${PORT}`);
  });
}

module.exports = app;
