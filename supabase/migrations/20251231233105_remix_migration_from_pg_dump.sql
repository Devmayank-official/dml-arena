CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: community_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comparison_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_votes_vote_type_check CHECK ((vote_type = ANY (ARRAY['up'::text, 'down'::text])))
);


--
-- Name: comparison_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comparison_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    responses jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    is_public boolean DEFAULT true NOT NULL
);


--
-- Name: debate_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debate_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    models text[] NOT NULL,
    settings jsonb NOT NULL,
    round_responses jsonb NOT NULL,
    final_answer text,
    total_rounds integer NOT NULL,
    elapsed_time integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    is_public boolean DEFAULT true NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: response_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.response_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    history_id uuid NOT NULL,
    history_type text NOT NULL,
    model_id text NOT NULL,
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT response_votes_history_type_check CHECK ((history_type = ANY (ARRAY['comparison'::text, 'debate'::text]))),
    CONSTRAINT response_votes_vote_type_check CHECK ((vote_type = ANY (ARRAY['up'::text, 'down'::text])))
);


--
-- Name: shared_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    share_code text DEFAULT substr(md5((random())::text), 1, 8) NOT NULL,
    history_id uuid NOT NULL,
    history_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shared_results_history_type_check CHECK ((history_type = ANY (ARRAY['comparison'::text, 'debate'::text])))
);


--
-- Name: community_votes community_votes_comparison_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_comparison_id_user_id_key UNIQUE (comparison_id, user_id);


--
-- Name: community_votes community_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_pkey PRIMARY KEY (id);


--
-- Name: comparison_history comparison_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comparison_history
    ADD CONSTRAINT comparison_history_pkey PRIMARY KEY (id);


--
-- Name: debate_history debate_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debate_history
    ADD CONSTRAINT debate_history_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: response_votes response_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.response_votes
    ADD CONSTRAINT response_votes_pkey PRIMARY KEY (id);


--
-- Name: shared_results shared_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_results
    ADD CONSTRAINT shared_results_pkey PRIMARY KEY (id);


--
-- Name: shared_results shared_results_share_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_results
    ADD CONSTRAINT shared_results_share_code_key UNIQUE (share_code);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_votes community_votes_comparison_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_comparison_id_fkey FOREIGN KEY (comparison_id) REFERENCES public.comparison_history(id) ON DELETE CASCADE;


--
-- Name: community_votes community_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_votes
    ADD CONSTRAINT community_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comparison_history comparison_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comparison_history
    ADD CONSTRAINT comparison_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: debate_history debate_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debate_history
    ADD CONSTRAINT debate_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: response_votes Anyone can delete response votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete response votes" ON public.response_votes FOR DELETE USING (true);


--
-- Name: response_votes Anyone can insert response votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert response votes" ON public.response_votes FOR INSERT WITH CHECK (true);


--
-- Name: shared_results Anyone can insert shared results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert shared results" ON public.shared_results FOR INSERT WITH CHECK (true);


--
-- Name: community_votes Anyone can read community votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read community votes" ON public.community_votes FOR SELECT USING (true);


--
-- Name: response_votes Anyone can read response votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read response votes" ON public.response_votes FOR SELECT USING (true);


--
-- Name: shared_results Anyone can read shared results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read shared results" ON public.shared_results FOR SELECT USING (true);


--
-- Name: response_votes Anyone can update response votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update response votes" ON public.response_votes FOR UPDATE USING (true);


--
-- Name: community_votes Authenticated users can vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can vote" ON public.community_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: comparison_history Users can delete own comparison history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comparison history" ON public.comparison_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: debate_history Users can delete own debate history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own debate history" ON public.debate_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: community_votes Users can delete their own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own votes" ON public.community_votes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: comparison_history Users can insert own comparison history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own comparison history" ON public.comparison_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: debate_history Users can insert own debate history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own debate history" ON public.debate_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: comparison_history Users can read own or public comparison history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own or public comparison history" ON public.comparison_history FOR SELECT USING (((auth.uid() = user_id) OR (is_public = true)));


--
-- Name: debate_history Users can read own or public debate history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own or public debate history" ON public.debate_history FOR SELECT USING (((auth.uid() = user_id) OR (is_public = true)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: community_votes Users can update their own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own votes" ON public.community_votes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: community_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: comparison_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;

--
-- Name: debate_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debate_history ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: response_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.response_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;