-- This migration adds a foreign key relationship between the 'conversations' table
-- and the 'pacientes' table. This is crucial for joining data between them
-- and ensuring data integrity.

-- We are using a separate migration file to ensure this relationship exists,
-- as it seems to be missing in the current database state.

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES public.pacientes(id)
ON DELETE SET NULL; -- Set patient_id to NULL if a patient is deleted, preserving the conversation history.