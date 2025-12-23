# AI Rules for Lovable App

This document outlines the core technologies and best practices for developing this application.

## Tech Stack Overview

*   **Frontend Framework:** React (with TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Component Library:** shadcn/ui (built on Radix UI)
*   **Routing:** React Router DOM
*   **Data Fetching & State Management:** React Query
*   **Backend & Database:** Supabase
*   **Icons:** Lucide React
*   **Toast Notifications:** Sonner (for modern toasts) and Radix UI Toast (for older system toasts)
*   **Date Utilities:** date-fns

## Library Usage Guidelines

To maintain consistency and efficiency, please adhere to the following rules when developing:

*   **UI Components:**
    *   Always prioritize using components from `shadcn/ui`. These are located in `src/components/ui/`.
    *   If a required component is not available in `shadcn/ui`, create a new, custom component in `src/components/` and style it exclusively with Tailwind CSS.
    *   **DO NOT** modify existing `shadcn/ui` component files directly.
*   **Styling:**
    *   All styling must be done using **Tailwind CSS** classes.
    *   Avoid inline styles or creating new `.css` files for component-specific styling. Global styles are managed in `src/index.css`.
    *   Use the `cn` utility function from `src/lib/utils.ts` for conditionally applying and merging Tailwind classes.
*   **Routing:**
    *   Use **React Router DOM** for all client-side navigation.
    *   All main application routes should be defined within `src/App.tsx`.
*   **Data Fetching & State Management:**
    *   For managing server state and data fetching, use **React Query** (`@tanstack/react-query`).
    *   For simple, local component state, `useState` and `useReducer` are appropriate.
*   **Icons:**
    *   Use icons from the **Lucide React** library.
*   **Notifications:**
    *   For new toast notifications, prefer using **Sonner**.
    *   The existing `useToast` hook (which uses `@radix-ui/react-toast`) is available for compatibility but new implementations should lean towards Sonner.
*   **Backend Interaction:**
    *   All interactions with the database and backend functions should be done using the **Supabase client** (`@supabase/supabase-js`) as configured in `src/integrations/supabase/client.ts`.
*   **WhatsApp Integration:**
    *   For any functionality related to the UAZAP API (sending messages, managing menus, campaigns), use the utility functions provided in `src/lib/uazap.ts`.
*   **Date Handling:**
    *   For any date formatting, parsing, or manipulation, use the **date-fns** library.