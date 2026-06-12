
-- ============== MISSION 7: CRM ==============
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  full_name text,
  phone text,
  country text,
  source text,
  lifecycle_stage text NOT NULL DEFAULT 'lead',
  status text NOT NULL DEFAULT 'new',
  tags text[] NOT NULL DEFAULT '{}',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_followup_at timestamptz,
  notes text,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff read" ON public.crm_leads FOR SELECT TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'employee')
);
CREATE POLICY "crm staff write" ON public.crm_leads FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
);
CREATE TRIGGER crm_leads_updated BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm act staff" ON public.crm_activities FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'employee')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'employee')
);

-- ============== MISSION 7: ANNOUNCEMENTS ==============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'platform',
  audience text NOT NULL DEFAULT 'all',
  audience_filter jsonb NOT NULL DEFAULT '{}',
  media_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read all auth" ON public.announcements FOR SELECT TO authenticated USING (
  status='published' OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
);
CREATE POLICY "ann staff write" ON public.announcements FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
);
CREATE TRIGGER ann_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== MISSION 7: INTERNAL MESSAGING ==============
CREATE TABLE public.messaging_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  channel_type text NOT NULL DEFAULT 'team',
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_channels TO authenticated;
GRANT ALL ON public.messaging_channels TO service_role;
ALTER TABLE public.messaging_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.channel_members (
  channel_id uuid REFERENCES public.messaging_channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_channel_member(_channel uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.channel_members WHERE channel_id=_channel AND user_id=_user)
$$;

CREATE POLICY "chan read member" ON public.messaging_channels FOR SELECT TO authenticated USING (
  public.is_channel_member(id, auth.uid()) OR has_role(auth.uid(),'admin')
);
CREATE POLICY "chan create staff" ON public.messaging_channels FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
  OR has_role(auth.uid(),'employee') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'compliance')
);
CREATE POLICY "chan update creator" ON public.messaging_channels FOR UPDATE TO authenticated USING (
  created_by=auth.uid() OR has_role(auth.uid(),'admin')
);

CREATE POLICY "cm self read" ON public.channel_members FOR SELECT TO authenticated USING (
  user_id=auth.uid() OR public.is_channel_member(channel_id, auth.uid()) OR has_role(auth.uid(),'admin')
);
CREATE POLICY "cm insert self or staff" ON public.channel_members FOR INSERT TO authenticated WITH CHECK (
  user_id=auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin')
);
CREATE POLICY "cm update self" ON public.channel_members FOR UPDATE TO authenticated USING (user_id=auth.uid());
CREATE POLICY "cm delete admin" ON public.channel_members FOR DELETE TO authenticated USING (
  user_id=auth.uid() OR has_role(auth.uid(),'admin')
);

CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.messaging_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]',
  mentions text[] NOT NULL DEFAULT '{}',
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_messages TO authenticated;
GRANT ALL ON public.channel_messages TO service_role;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg member read" ON public.channel_messages FOR SELECT TO authenticated USING (
  public.is_channel_member(channel_id, auth.uid()) OR has_role(auth.uid(),'admin')
);
CREATE POLICY "msg member send" ON public.channel_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id=auth.uid() AND public.is_channel_member(channel_id, auth.uid())
);
CREATE POLICY "msg sender edit" ON public.channel_messages FOR UPDATE TO authenticated USING (sender_id=auth.uid());
CREATE POLICY "msg sender or admin del" ON public.channel_messages FOR DELETE TO authenticated USING (
  sender_id=auth.uid() OR has_role(auth.uid(),'admin')
);

CREATE TABLE public.message_reactions (
  message_id uuid REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rx read" ON public.message_reactions FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.channel_messages m WHERE m.id=message_id AND public.is_channel_member(m.channel_id,auth.uid()))
);
CREATE POLICY "rx self write" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "rx self del" ON public.message_reactions FOR DELETE TO authenticated USING (user_id=auth.uid());

-- ============== MISSION 7: NOTIFICATIONS V2 ==============
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT true,
  push boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np self" ON public.notification_preferences FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ============== MISSION 8: COMPLIANCE CASES ==============
CREATE TABLE public.compliance_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  case_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  severity text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  risk_flags text[] NOT NULL DEFAULT '{}',
  resolution text,
  opened_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_cases TO authenticated;
GRANT ALL ON public.compliance_cases TO service_role;
ALTER TABLE public.compliance_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc staff" ON public.compliance_cases FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'compliance')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'compliance')
);
CREATE TRIGGER cc_updated BEFORE UPDATE ON public.compliance_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== MISSION 8: AUTOMATION ==============
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '[]',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  run_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto admin" ON public.automation_rules FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin')
);
CREATE TRIGGER ar_updated BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== MISSION 8: SEGMENTS ==============
CREATE TABLE public.investor_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  definition jsonb NOT NULL DEFAULT '{}',
  member_count int NOT NULL DEFAULT 0,
  last_computed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_segments TO authenticated;
GRANT ALL ON public.investor_segments TO service_role;
ALTER TABLE public.investor_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seg staff" ON public.investor_segments FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
);
CREATE TRIGGER seg_updated BEFORE UPDATE ON public.investor_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== MISSION 8: OPS TASKS ==============
CREATE TABLE public.ops_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'todo',
  due_date timestamptz,
  team text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_tasks TO authenticated;
GRANT ALL ON public.ops_tasks TO service_role;
ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops staff" ON public.ops_tasks FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
  OR has_role(auth.uid(),'employee') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'compliance')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'support')
  OR has_role(auth.uid(),'employee') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'compliance')
);
CREATE TRIGGER ops_updated BEFORE UPDATE ON public.ops_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== REALTIME ==============
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_tasks;
