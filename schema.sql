-- ==========================================
-- 1. TABLES SETUP
-- ==========================================

-- Roles Table
CREATE TABLE IF NOT EXISTS public."Roles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public."Profiles" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    leave_balance INT DEFAULT 30,
    role_id UUID REFERENCES public."Roles"(id)
);

-- LeaveTypes Table
CREATE TABLE IF NOT EXISTS public."LeaveTypes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, 
    max_days INT NOT NULL
);

-- LeaveRequests Table
CREATE TABLE IF NOT EXISTS public."LeaveRequests" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public."LeaveTypes"(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    medical_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- MedicalDocuments Table
CREATE TABLE IF NOT EXISTS public."MedicalDocuments" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. SEED INITIAL DATA
-- ==========================================

-- Insert Roles
INSERT INTO public."Roles" (name) 
VALUES ('Employee'), ('Manager'), ('Admin')
ON CONFLICT (name) DO NOTHING;

-- Insert Leave Types
INSERT INTO public."LeaveTypes" (name, max_days) VALUES 
('Annual Leave', 20),
('Sick Leave', 15),
('Casual Leave', 7)
ON CONFLICT (name) DO UPDATE SET 
    max_days = EXCLUDED.max_days;

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeaveRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MedicalDocuments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeaveTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Roles" ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public."Profiles" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public."Profiles" FOR UPDATE USING (auth.uid() = id);

-- LeaveRequests Policies
CREATE POLICY "Users can view own requests" ON public."LeaveRequests" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own requests" ON public."LeaveRequests" FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MedicalDocuments Policies
CREATE POLICY "Users can view own documents" ON public."MedicalDocuments" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public."MedicalDocuments" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public."MedicalDocuments" FOR DELETE USING (auth.uid() = user_id);

-- Public Read Policies
CREATE POLICY "Anyone can view leave types" ON public."LeaveTypes" FOR SELECT USING (true);
CREATE POLICY "Anyone can view roles" ON public."Roles" FOR SELECT USING (true);

-- ==========================================
-- 4. AUTOMATIC PROFILE CREATION
-- ==========================================
-- This creates a profile record every time a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."Profiles" (id, full_name, leave_balance)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 30);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
