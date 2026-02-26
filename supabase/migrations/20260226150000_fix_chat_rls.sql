-- This policy allows any user (including anonymous visitors) to read conversations.
CREATE POLICY "Allow public read access to conversations"
ON public.conversations
FOR SELECT
USING (true);

-- This policy allows any user to read messages.
CREATE POLICY "Allow public read access to messages"
ON public.messages
FOR SELECT
USING (true);