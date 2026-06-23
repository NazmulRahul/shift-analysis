# Guide: Running the Application with Docker

Follow these step-by-step instructions to build, run, and interact with the Employee Shift Analytics Platform using Docker and Docker Compose.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
* **Docker Desktop** (configured with Linux containers).
* **Git** (to manage version changes).

Make sure that the standard ports (**3000**, **8000**, and **5432**) are not occupied by other running services on your machine.

---

## Step 1: Start the Docker Service
Ensure Docker Desktop is open and running on your computer.

---

## Step 2: Build and Launch the Containers
Open your terminal (PowerShell, Command Prompt, or terminal emulator of choice) in the project root directory and run:

```bash
docker-compose up --build
```

### What this command does:
1. Downloads the standard **PostgreSQL 15 Alpine** database image.
2. Compiles the React + Vite frontend inside a Node environment and copies production assets to a lightweight **Nginx** server container.
3. Configures the Django backend, downloads its python dependencies, runs the database migrations (`python manage.py migrate`), and starts the development server.

---

## Step 3: Verify the Running Containers
Once the build is complete and the services are active, check that the containers are online:

```bash
docker ps
```

You should see three running containers:
* `shift_analysis_frontend` (listening on port `3000`)
* `shift_analysis_backend` (listening on port `8000`)
* `shift_analysis_db` (listening on port `5432`)

---

## Step 4: Access the Application

Open your browser and navigate to the following addresses:

* **Frontend Dashboard**: `http://localhost:3000/`
* **Backend API Root**: `http://localhost:8000/api/dashboard/summary/`

---

## Step 5: Upload Sample Data
To populate the application:
1. Open the **Frontend Dashboard** (`http://localhost:3000/`).
2. Click on **Upload Dataset** in the sidebar.
3. Drag and drop or select the file named `test_shifts.csv` located in the root of the project folder.
4. Approve the confirmation dialog warning about dataset replacement.
5. Once uploaded, navigate back to the **Dashboard** to view the metrics, charts, breakdown streaks, and auto-generated data insights.

---

## 🛠️ Docker Troubleshooting & Common Commands

### View Logs
If you encounter issues, view the stdout log output of the backend container:
```bash
docker logs -f shift_analysis_backend
```

### Stop the Application
To stop all containers without deleting database volume data:
```bash
docker-compose down
```

### Reset Database Volume Data
To stop the containers and completely wipe out the PostgreSQL database volume (e.g. to start fresh):
```bash
docker-compose down -v
```

### Run Backend Commands inside Container
To run standard Django command-line operations (like creating a superuser) inside the active container:
```bash
docker exec -it shift_analysis_backend python manage.py createsuperuser
```
