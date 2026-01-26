-- Create evaluations table
create table public.evaluations (
    id uuid not null default gen_random_uuid(),
    loan_id uuid not null references public."loanRequests"(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    details jsonb not null default '{}'::jsonb,
    suggestions text,
    created_at timestamp with time zone not null default now(),
    constraint evaluations_pkey primary key (id),
    constraint evaluations_loan_id_key unique (loan_id)
);

-- Add comments for documentation
comment on table public.evaluations is 'Stores user evaluations for returned equipment loans';
comment on column public.evaluations.rating is 'Overall rating (calculated average)';
comment on column public.evaluations.details is 'Detailed ratings for different sections (System, Service, Equipment) stored as JSON';

-- Enable RLS
alter table public.evaluations enable row level security;

-- Policies
create policy "Users can view their own evaluations"
    on public.evaluations for select
    using (auth.uid() = user_id);

create policy "Users can create their own evaluations"
    on public.evaluations for insert
    with check (auth.uid() = user_id);

create policy "Admins can view all evaluations"
    on public.evaluations for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Indexes for performance
create index evaluations_loan_id_idx on public.evaluations(loan_id);
create index evaluations_user_id_idx on public.evaluations(user_id);
create index evaluations_created_at_idx on public.evaluations(created_at desc);
