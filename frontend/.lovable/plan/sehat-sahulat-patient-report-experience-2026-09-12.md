# Sehat Sahulat patient report experience

## Goal

Create a polished, modern healthcare interface inspired by the supplied clinic reference, with the report upload experience as the primary action and full support for the existing backend contract.

## Build

- Create a calm teal, white, and dark-ink design system with refined typography, compact navigation, responsive spacing, and restrained motion.
- Generate an original doctor-and-patient clinic image for the opening section; use the uploaded screens only as visual references.
- Build the upload area with drag-and-drop, file validation, image preview, replace/remove controls, and a disabled-until-ready Analyze Report action.
- Connect the upload to the configurable backend URL using multipart form data with the required `file` field.
- Show the four staged processing messages while the request runs.
- Render extracted values, English/Urdu explanations, urgency, appointment details, and the medical disclaimer from the exact response structure.
- Add friendly handling for invalid files, unreadable reports, server failures, and unreachable backend.
- Add the demo appointment request form and success confirmation without an additional backend call.
- Ensure the full experience is polished on mobile and desktop, accessible, and uses unique page metadata.

## Technical details

- Frontend: TanStack Start with React and Tailwind CSS.
- Backend base URL: `VITE_API_BASE_URL`, falling back to `http://localhost:8000` for local development.
- Accepted uploads: JPEG, PNG, and WEBP.
- No persistent storage or new backend will be added.
