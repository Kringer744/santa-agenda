# AI Rules for Lovable App

This document outlines the core technologies and best practices for developing this application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

*   **Frontend Framework:** React (version 18.x)
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (built on Radix UI)
*   **Routing:** React Router DOM
*   **Data Fetching & State Management:** TanStack Query (React Query)
*   **Backend & Database:** Supabase
*   **Form Management:** React Hook Form
*   **Schema Validation:** Zod
*   **Icons:** Lucide React
*   **Date Utilities:** date-fns
*   **Toast Notifications:** Sonner and Radix UI Toast (via custom `useToast` hook)

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

*   **UI Components:**
    *   Always prioritize `shadcn/ui` components for building the user interface.
    *   If a specific `shadcn/ui` component is not available or requires significant modification, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify `shadcn/ui` component files directly.**
*   **Styling:**
    *   All styling must be done using **Tailwind CSS** classes. Avoid writing custom CSS files or inline styles unless absolutely necessary for global styles (e.g., `src/index.css`).
    *   Use the `cn` utility function from `src/lib/utils.ts` for conditionally applying and merging Tailwind classes.
*   **Routing:**
    *   Use `react-router-dom` for all client-side navigation.
    *   Define all main application routes within `src/App.tsx`.
*   **Data Fetching & State Management:**
    *   For managing server state (fetching, caching, and updating data from Supabase), use **TanStack Query (`@tanstack/react-query`)** via custom hooks (e.g., `useTutores`, `useReservas`).
    *   For local component state, use React's built-in `useState` and `useReducer` hooks.
*   **Database Interaction:**
    *   All interactions with the Supabase backend (CRUD operations) should be performed using the `@supabase/supabase-js` client.
    *   Encapsulate database logic within custom React Query hooks located in `src/hooks/`.
*   **Forms & Validation:**
    *   Use `react-hook-form` for handling all form logic, including input registration, validation, and submission.
    *   Use `zod` for defining form schemas and performing validation.
*   **Icons:**
    *   Use icons from the `lucide-react` library.
*   **Notifications:**
    *   For general, simple toast notifications, use `sonner`.
    *   The existing `useToast` hook (based on Radix UI's toast primitives) is available for more complex or persistent toast messages if needed, following existing patterns.
*   **WhatsApp Integration:**
    *   Utilize the functions provided in `src/lib/uazap.ts` for all interactions with the UAZAP API, which are routed through Supabase Edge Functions.