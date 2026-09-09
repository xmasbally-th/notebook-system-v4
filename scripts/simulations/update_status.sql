ALTER TABLE public.profiles DISABLE TRIGGER trg_protect_profile_fields;
UPDATE public.profiles SET status = 'approved' WHERE email = 'approved@example.com';
UPDATE public.profiles SET status = 'rejected' WHERE email = 'rejected@example.com';
ALTER TABLE public.profiles ENABLE TRIGGER trg_protect_profile_fields;
