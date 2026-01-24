# CSP Project

## How to Run Locally

You need to run the **Backend** and **Frontend** in two separate terminals.

### 1. Start the Backend
The backend runs the API server and connects to the database.

1.  Open a terminal.
2.  Navigate to the backend folder:
    ```bash
    cd csp-backend
    ```
3.  Install dependencies (if you haven't yet):
    ```bash
    npm install
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    *The server should start on port 5000.*

### 2. Start the Frontend
The frontend is the React user interface.

1.  Open a **new** terminal.
2.  Navigate to the frontend folder:
    ```bash
    cd csp-frontend
    ```
3.  Install dependencies (if you haven't yet):
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  Open the link shown in the terminal (usually `http://localhost:5173`) in your browser.

## Troubleshooting
- **Database**: Ensure your internet connection is active so the backend can connect to MongoDB Atlas.
- **Port Conflicts**: If port 5000 is busy, the backend might fail. Ensure no other node processes are running.
