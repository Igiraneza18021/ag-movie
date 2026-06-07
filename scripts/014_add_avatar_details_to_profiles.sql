-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_style TEXT,
ADD COLUMN IF NOT EXISTS avatar_seed TEXT;

-- Update the function to handle new user signups with new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, avatar_style, avatar_seed)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'avatar_style',
    new.raw_user_meta_data->>'avatar_seed'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the function to handle updated user metadata with new columns
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = new.raw_user_meta_data->>'full_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url',
    avatar_style = new.raw_user_meta_data->>'avatar_style',
    avatar_seed = new.raw_user_meta_data->>'avatar_seed',
    profile_completed = COALESCE((new.raw_user_meta_data->>'profile_completed')::boolean, profile_completed),
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
