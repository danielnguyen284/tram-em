-- Enable Supabase Realtime for the notifications table
-- This allows the TopNav popup to receive live updates when a new notification is inserted.
alter publication supabase_realtime add table notifications;
