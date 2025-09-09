# Supplier Onboarding & Scorecards Module

This module provides functionality for managing supplier onboarding, documentation, risk assessment, and performance scorecards.

## Key Features:

*   **Supplier List (`/suppliers`)**: Displays a table of all suppliers with filters and basic information.
*   **Invite Supplier (`/suppliers/new`)**: (To be implemented) A wizard for inviting new suppliers to the portal.
*   **Supplier Detail (`/suppliers/:id`)**: (To be implemented) Detailed view of a single supplier with various tabs (Overview, Sites, Documents, etc.).
*   **Supplier Portal (`/portal/invite/:token`)**: (To be implemented) Self-service portal for suppliers to submit information and documents.

## Data Model:

The module uses several Supabase tables: `suppliers`, `supplier_sites`, `supplier_contacts`, `documents`, `questionnaires`, `responses`, `approvals`, `changes`, `scorecards`, `tasks`, and `activity_log`. RLS policies are enabled on all tables for security.

## Environment Variables:

Ensure the following environment variables are set in your `.env` file:

*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`

(Additional `MAILER_*` variables would be needed if a real email service is integrated for invites.)

## Development Notes:

*   **Mock Data**: Currently, the `SupplierTable` fetches data directly from Supabase. For local development without Supabase, you might need to implement a mock API.
*   **Authentication**: User authentication is handled by Supabase. Ensure a user is logged in to interact with the API.
*   **RLS**: Row Level Security is enabled. Adjust policies as needed for specific role-based access.