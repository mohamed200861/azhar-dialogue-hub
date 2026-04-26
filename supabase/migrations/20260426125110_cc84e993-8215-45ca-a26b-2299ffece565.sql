-- Lock function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_users (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Tighten public INSERT policies
DROP POLICY "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 200
    AND length(trim(email)) BETWEEN 3 AND 320
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(trim(message)) BETWEEN 1 AND 5000
  );

DROP POLICY "Anyone subscribes" ON public.newsletter_subscribers;
CREATE POLICY "Anyone subscribes"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(email)) BETWEEN 3 AND 320
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );