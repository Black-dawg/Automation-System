# Job Application Automation System

An automation system designed to streamline job application workflows. It consists of two major components:

1. **Job Application Automation Backend**: A Spring Boot service that leverages AI to extract job opportunities and announcements and sync them to platforms like Notion, easing tracking, analytics, and management of applications.
2. **FormGlitch**: A Chrome extension that uses Local LLMs (via Ollama) to parse candidate resumes and automatically fill out job application forms.

## Project Structure

- **`automaton_pipeline_backend/`**: Spring Boot application representing the main job application tracking and integration backend.
- **`FormGlitch/`**:
  - `chrome-extension/`: Chrome extension designed to scan and populate input fields on job application forms.
  - `extension-backend/`: Standalone Spring Boot helper service that uses local LLMs (via Ollama) to parse resumes and generate context-aware autofill responses.
