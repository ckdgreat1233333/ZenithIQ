# ZenithIQ - AI Learning Assistant

This project is an AI Learning Assistant with features including a chat interface, mind map generation, and notes generation.

## Prerequisites

*   Python 3.6 or higher
*   pip (Python package installer)

## How to Run

Follow the instructions below based on your operating system.

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Set up a Python virtual environment (recommended):**

    Using `venv` (built-in Python module):

    *   **Windows:**
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   **macOS/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

    Using `conda`:

    ```bash
    conda create -n zenihtiq_env python=3.x
    conda activate zenihtiq_env
    ```

3.  **Install dependencies:**

    Make sure you are in the project's root directory where `requirements.txt` is located.

    ```bash
    pip install -r requirements.txt
    ```

    *Note: On some systems, you might need to use `pip3` instead of `pip`.*

4.  **Run the Flask application:**

    ```bash
    python app.py
    ```

    *Note: On some systems, you might need to use `python3` instead of `python`.*

5.  **Access the application:**

    Once the server is running, open your web browser and go to:

    ```
    http://localhost:404
    ```

6.  **Deactivate the virtual environment (when done):**

    ```bash
    deactivate
    ```
    (For conda, use `conda deactivate`)

## Project Structure

*   `app.py`: Flask backend application.
*   `static/`: Contains static files (CSS, JavaScript, images).
    *   `static/styles.css`: Stylesheet for the application.
    *   `static/main.js`: JavaScript for frontend functionality.
*   `templates/`: Contains HTML template files.
    *   `templates/index.html`: The main HTML file.
*   `requirements.txt`: Lists Python dependencies.

## Features

*   Chat interface
*   Mind Map Generation
*   Notes Generation
*   Dark/Light Mode Toggle

## Contributing

Feel free to contribute to the project by submitting issues or pull requests.
