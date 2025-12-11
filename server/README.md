# Regio API
Backend API for the Regio P2P marketplace, built with FastAPI.

## Prerequisites
Before setting up the project, ensure you have the following installed and running locally:

Python 3.11+ (the use of StrEnum in the enum files requires Python versions from 3.11 upwards)

PostgreSQL (Service must be active)

## Local Development Setup
Follow these steps to get the development environment running.

1. Environment & Dependencies
First, create a virtual environment and install the required packages.

Bash

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
2. Configuration (.env)
You need to set up your environment variables to connect to the database and other services.

Create a file named .env in the API root directory.

Ensure your PostgreSQL connection variables are set correctly in this file to match your local postgres user/password.

Example structure for PostgreSQL:

POSTGRES_USER=username
POSTGRES_PASSWORD=password
# ... other secrets
3. Database Setup
Ensure your local PostgreSQL service is running, then create the specific database for this project:

Bash

# Create the database named "regio"
createdb regio
(If the createdb command is not available in your path, you can log into the psql shell and run CREATE DATABASE regio;)

4. Migrations
Apply the database schema using Alembic:

Bash

alembic upgrade head
5. Running the Server
Start the FastAPI development server:

Bash

fastapi dev
The API will be available at http://127.0.0.1:8000. Automatic API documentation is available at http://127.0.0.1:8000/docs.

Troubleshooting
Database Connection Refused: Ensure the regio database exists and that the credentials in your .env file match your local PostgreSQL setup.

Redis Errors: Ensure the Redis server is running (redis-cli ping should return PONG)