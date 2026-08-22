Dayflow HRMS - Project Initialization

Prerequisites
- Node.js installed
- PostgreSQL installed and running
- A PostgreSQL database named: dayflow_hrms

1. Initialize the database
- Open pgAdmin or your PostgreSQL client
- Create the database: dayflow_hrms
- Run the schema script from: backend/sql/schema.sql

2. Configure the backend
- Open the backend folder: backend
- Install dependencies:
  npm install
- Optional environment variables:
  PORT=5000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=dayflow_hrms
  DB_USER=postgres
  DB_PASSWORD=postgres
  JWT_SECRET=dayflow-secret-key-hrms-2026

3. Start the backend
- From the backend folder run:
  npm run dev

4. Configure the frontend
- Open the frontend folder: frontend
- Install dependencies:
  npm install

5. Start the frontend
- From the frontend folder run:
  npm run dev

6. Open the app
- Frontend: the Vite URL shown in the terminal
- Backend health check: http://localhost:5000/api/health

Demo login credentials
- Admin
  Email: admin@dayflow.com
  Password: admin123

- Employee
  Email: employee@dayflow.com
  Password: emp123
