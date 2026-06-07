-- Add is_subscribed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Update subscriptions table to have a unique constraint on user_id for upsert support
-- This ensures one subscription record per user is updated/created
ALTER TABLE public.subscriptions
ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);
