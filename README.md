# PatientCare Oracle + Express Setup

This project keeps the existing PatientCare frontend and adds a simple Oracle database connection using Node.js and Express.

## 1. Install Node.js packages

Open a terminal in the backend folder:

```bash
cd backend
npm install
```

## 2. Set up Oracle Database

Make sure Oracle Database is installed and running on your system.

You need:
- Oracle username
- Oracle password
- Oracle connect string

Example connect string:

```text
localhost:1521/XEPDB1
```

or any valid Oracle service name in your environment.

## 3. Configure .env

Edit the file:

```bash
backend/.env
```

Replace the placeholder values:

```env
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=your_oracle_connect_string
PORT=3000
```

Example:

```env
DB_USER=system
DB_PASSWORD=yourpassword
DB_CONNECT_STRING=localhost:1521/XEPDB1
PORT=3000
```

## 4. Open SQL Plus and run the SQL file

In SQL Plus:

```sql
CONNECT system/yourpassword@localhost:1521/XEPDB1

@C:\path\to\dbms\database\patientcare_database.sql
```

If the path contains spaces, enclose it in double quotes.

This creates:
- PATIENT table
- APPOINTMENT table
- sequences used for IDs

## 5. Verify tables in SQL Plus

Run:

```sql
SELECT TABLE_NAME FROM USER_TABLES;
DESC PATIENT;
DESC APPOINTMENT;
```

You should see the tables created successfully.

## 6. Start the backend

From the backend folder:

```bash
node server.js
```

or:

```bash
npm start
```

If the server starts successfully, you will see:

```text
PatientCare backend running on port 3000
```

## 7. Open the frontend

Open the frontend in a browser using a simple local web server.

From the project root:

```bash
cd ..
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## 8. Test patient registration

1. Open the page.
2. Fill in the patient form.
3. Click Register Patient.
4. The page should not refresh and lose the data.
5. A success message should appear.
6. The patient should appear in the table.
7. Refresh the browser.
8. The patient should still appear because it was saved in Oracle.

## 9. Check the database from SQL Plus

After registration, run:

```sql
SELECT * FROM PATIENT;
SELECT * FROM APPOINTMENT;
```

You should be able to see the saved patient and appointment information.

## 10. Common errors and fixes

### ORA errors
- Check that your Oracle database is running.
- Make sure the user has permission to create tables.
- Check for syntax issues in the SQL file.

### Connection errors
- Verify DB_USER, DB_PASSWORD, and DB_CONNECT_STRING in .env.
- Check Oracle listener status.

### CORS errors
- Make sure the backend is running on port 3000.
- Check that the frontend is calling the correct API URL.

### Port errors
- If port 3000 is already in use, change PORT in .env.
- Also update the frontend API URL in JavaScript if needed.

### oracledb installation problems
- Make sure Node.js is installed.
- Try reinstalling dependencies:

```bash
npm install
```

- On Linux/macOS, Oracle client libraries may be required.
- On Windows, ensure Oracle client connectivity is configured properly.

## 11. API endpoints

The backend provides these routes:

```text
GET    /api/patients
POST   /api/patients
PUT    /api/patients/:id
DELETE /api/patients/:id
```

## 12. Final output

The final project uses:
- HTML, CSS, Bootstrap, JavaScript frontend
- Node.js + Express backend
- Oracle Database through SQL Plus
- Real patient data storage in Oracle instead of browser memory

## Run locally (quick)

Follow these steps to run the project on your machine (student-friendly):

1. Ensure Oracle Database (XE) is installed and the listener is running. Use `lsnrctl status` to check.

2. Import the database schema (run in SQL*Plus):

```sql
CONNECT SYSTEM@localhost:1521/XEPDB1
-- enter password when prompted
@C:\Users\K Hasini\OneDrive\Desktop\dbms\database\patientcare_database.sql
```

3. (Optional safer approach) Create a local app user in the pluggable DB and grant privileges:

```sql
ALTER SESSION SET CONTAINER = XEPDB1;
CREATE USER patient_app IDENTIFIED BY patient123;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO patient_app;
ALTER USER patient_app QUOTA UNLIMITED ON USERS;
```

4. Configure the backend environment:

Edit `backend/.env` (or copy `backend/.env.example`) and set:

```
DB_USER=patient_app
DB_PASSWORD=patient123
DB_CONNECT_STRING=localhost:1521/XEPDB1
PORT=3000
```

5. Install backend dependencies and start server (from `backend/`):

```bash
cd backend
npm install
npm start
```

6. Serve the frontend (from project root) and open the site:

```bash
cd ..
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

7. Run integration tests (optional):

```bash
cd backend
npm test
```

Notes:
- If your Oracle password contains `@`, prefer `sqlplus /nolog` then `CONNECT` so the shell doesn't parse the `@`.
- Keep `.env` out of source control; use `backend/.env.example` as the template.

