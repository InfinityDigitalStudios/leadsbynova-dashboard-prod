--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    headshot_url text,
    is_active text DEFAULT 'true'::text,
    display_order text DEFAULT '0'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agents OWNER TO neondb_owner;

--
-- Name: app_configuration; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.app_configuration (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    config_key text NOT NULL,
    config_value text NOT NULL,
    config_type text NOT NULL,
    description text,
    category text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_configuration OWNER TO neondb_owner;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    content text NOT NULL,
    is_bot text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO neondb_owner;

--
-- Name: consent_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.consent_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    guide_type text NOT NULL,
    ip_address text,
    user_agent text,
    consent_text text NOT NULL,
    disclosure_version text NOT NULL,
    disclosure_hash text NOT NULL,
    source_url text NOT NULL,
    channels_consented text NOT NULL,
    sender_name text NOT NULL,
    form_timestamp timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.consent_records OWNER TO neondb_owner;

--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    lead_id character varying
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.form_submissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    guide_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_submissions OWNER TO neondb_owner;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    guide_type text NOT NULL,
    form_timestamp timestamp without time zone NOT NULL,
    chat_timestamp timestamp without time zone,
    prequalified text,
    pre_qualification_range text,
    move_timeline text,
    budget_range text,
    timeline text,
    need_to_buy text,
    occupancy_status text,
    price_range text,
    recent_upgrades text,
    have_agent text,
    property_type text,
    booked_call text,
    day_selected text,
    lead_status text DEFAULT 'pending'::text,
    sent_to_dashboard text DEFAULT 'false'::text,
    completed_chat text DEFAULT 'false'::text,
    notes jsonb,
    assigned_to text,
    sales_funnel_status text DEFAULT 'New'::text,
    archived text DEFAULT 'false'::text,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_type text,
    main_goal text,
    lead_management text,
    communication_preference text,
    time_selected text
);


ALTER TABLE public.leads OWNER TO neondb_owner;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    headline text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notes OWNER TO neondb_owner;

--
-- Name: tenant_metadata; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_metadata (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    fork_id text NOT NULL,
    database_url text NOT NULL,
    email_to text,
    description text,
    is_active text DEFAULT 'true'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_validated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_metadata OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    hashed_password text NOT NULL,
    role text NOT NULL,
    agent_name text,
    is_active text DEFAULT 'true'::text,
    token_version text DEFAULT '0'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password_reset_token text,
    reset_token_expiry timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agents (id, name, email, phone, headshot_url, is_active, display_order, created_at, updated_at) FROM stdin;
d8b93d34-c8b5-4f97-8ef7-3d3413c57215	Chris Lackey	chris@infinitydigitalstudios.com	(423) 802-5033	\N	true	0	2025-10-06 17:39:56.120398	2025-10-06 17:41:11.211
\.


--
-- Data for Name: app_configuration; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.app_configuration (id, config_key, config_value, config_type, description, category, updated_at) FROM stdin;
5152243f-78be-4920-b6f1-60063a3baa77	company_name	Your Real Estate Company	text	Main company name displayed across the app	branding	2025-10-06 17:33:51.086114
252debcd-d3a4-40e3-b185-b4ae6a244d39	chat_header_title	Chat with Real Estate Expert	text	Title shown in chat header (e.g. 'Chat with Real Estate Expert')	branding	2025-10-06 17:33:51.23052
a557a20a-5512-4e67-bd7e-7a625c91e446	company_logo	/placeholder-logo.png	image	Main company logo displayed on forms and headers	branding	2025-10-06 17:33:51.297243
4df3b5ff-516c-4a23-b6e8-bce3af4ecfcb	header_logo	/placeholder-logo.png	image	Logo displayed in the application header/navigation	branding	2025-10-06 17:33:51.365745
faab6531-ecc4-4e98-b1e9-491f17ca4a46	footer_logo	/placeholder-logo.png	image	Logo displayed in the application footer	branding	2025-10-06 17:33:51.434638
765fb678-b894-497f-8b15-a916905a46ae	primary_phone	(000) 000-0000	text	Primary phone number for email templates and contact info	contact	2025-10-06 17:33:51.636388
94fe7064-c4dc-4b5a-b5ec-7179e3efb0b6	business_address		text	Business address for email signatures (optional)	contact	2025-10-06 17:33:51.703465
7271d01e-973c-446d-a2ae-b46242f15b3c	phone_placeholder	(000) 000-0000	text	Placeholder text for phone input fields	forms	2025-10-06 17:33:51.901742
c1a3064b-8970-4d68-9a03-4d245d1b3114	chat_redirect_url	/	url	URL to redirect users after chat completion	urls	2025-10-06 17:33:52.169003
82dec337-91c7-49cc-8b97-45f8a3175f0e	primary_agent_email	configure-your-email@example.com	email	Main agent email for lead notifications	emails	2025-10-06 17:33:52.303157
70cd2e1a-ea61-4caa-93c8-6194ee599559	sender_email	configure-your-email@example.com	email	Email address used to send emails to leads	emails	2025-10-06 17:33:52.369242
7428ba6f-c093-4169-b205-3c2731b7ce2d	agent_signature_name	Your Real Estate Agent	text	Agent name for email signatures	emails	2025-10-06 17:33:52.435575
dbd7a72f-c633-4e7b-ae16-a4271e3c85ea	agent_signature_title	Licensed Real Estate Agent	text	Agent title/position for email signatures	emails	2025-10-06 17:33:52.503013
e78a0bc3-ed26-4324-bc1d-1b77dcf8afcd	email_closing_message	Your Real Estate Expert	text	Closing message in welcome emails	emails	2025-10-06 17:33:52.575205
12bc28ab-2fb4-4c3b-b75f-f8f056eac425	primary_color	#1E3A8A	color	Primary brand color (hex code)	styling	2025-10-06 17:33:52.641571
920ce674-76a9-496b-99ce-04bd587f39c1	secondary_color	#3B82F6	color	Secondary brand color (hex code)	styling	2025-10-06 17:33:52.707511
9b13f191-be23-4d4b-aff1-e28f96163df1	font_family	Inter, sans-serif	font	Primary font family for headings	styling	2025-10-06 17:33:52.77367
c43e479a-c936-4de3-ab39-af52633b3de9	relocation_guide_url	https://infinitydigitalstudios.com	url	URL where users are redirected after requesting Relocation Guide	urls	2025-10-06 17:33:51.968302
07a3c9d4-b0aa-419b-a133-910e52f7d629	first_time_buyer_guide_url	https://infinitydigitalstudios.com	url	URL where users are redirected after requesting First Time Home Buyer Guide	urls	2025-10-06 17:33:52.033199
2d18703a-58c2-4139-8935-bb428fd1cbd2	sellers_guide_url	https://infinitydigitalstudios.com	url	URL where users are redirected after requesting Sellers Guide	urls	2025-10-06 17:33:52.09918
51ecbb01-573f-4719-bdc9-6f7092ba2803	fallback_redirect_url	https://leadsbynova.replit.app/guide	url	Fallback URL for various redirects	urls	2025-10-06 17:33:52.237141
4651a6ad-a3fc-4a67-8d43-40ec8595db61	main_agent_headshot_url	http://033df6c9-61b0-44bb-93a8-20b9e35371c0-00-qykp8plkdzrh.spock.replit.dev/uploads/images/headshot-1760227364767-548863402.png	url	Primary agent headshot URL for submission form and chat pages	branding	2025-10-12 00:02:48.983
016e3c35-20ff-431b-9e9f-364c04d1fa09	submission_form_header	Create Your Free Access Account	text	Main header text on submission form	forms	2025-10-12 00:04:00.501
d5f264df-1120-45a9-b6d5-94a5619e10b2	app_title	LeadsByNova	text	Browser tab title (e.g. 'Lead Dashboard - Your Company')	metadata	2025-10-08 04:17:37.903
a18e6601-9eb3-4e63-90a3-c16576a92710	submission_form_description	Unlock a guided experience that shows you exactly how LeadsByNova captures, qualifies, and delivers leads — automatically.	text	Description text under form header	forms	2025-10-12 00:04:01.567
60f21f1a-41c2-4c07-84e0-c3e799b808ad	form_button_text	LeadsByNova	text	Text on the submit button	forms	2025-10-12 00:04:02.593
615944ad-1a3c-40a2-afc4-0871224f25ca	page_headline		text	Main headline at top of submission form page	forms	2025-10-12 00:15:21.685
abe4ad72-a97b-468f-b524-3da6d3747520	app_name	LeadsByNova	text	Application name shown in manifests and PWA	metadata	2025-10-08 04:18:47.739
4757123d-bebb-4eae-9e0e-cae69160ea78	page_subheader	Automate Connections - Accelerate Growth	text	Tagline below headline on submission form	forms	2025-10-11 23:50:04.058596
77b5d04e-15a5-4bf8-919a-7dc6fcb75e86	page_header_description	Step inside the all-in-one lead automation platform trusted by modern businesses. See how automation turns your time into growth.	text	Description text below subheader on submission form	forms	2025-10-11 23:50:04.058596
965fcad2-2e4b-43ef-95d1-5956450774fa	form_footer_text	No Credit Card Required - See How It Works 100% Free	text	Text shown below the submit button	forms	2025-10-11 23:50:04.058596
98ef6deb-99f5-475c-a5ce-b0c7d7b7a188	page_headline_image	http://033df6c9-61b0-44bb-93a8-20b9e35371c0-00-qykp8plkdzrh.spock.replit.dev/uploads/images/headshot-1760227330354-662477558.png	image	Optional image to display with headline on submission form	forms	2025-10-12 00:02:19.992
a343f408-c242-4ae4-a9fe-406065b0c2f8	headline_logo_position	after	text	Position of logo relative to headline text (before/after)	forms	2025-10-12 00:02:20.492
ac7b2985-5b94-4d17-9a19-e875bdb62d89	guide_selections_title	Test	text	Section title for guide selection options	submission-form	2025-10-12 00:15:25.851
37bf8ed0-c240-44ae-b91e-f4547e2e5477	guide_option_1	Test 1	text	First guide selection option	submission-form	2025-10-12 00:15:30.478
22662a5e-a889-41cb-93f7-75b223dc4f99	guide_option_2	Test 2	text	Second guide selection option	submission-form	2025-10-12 00:15:35.502
f9de5d73-f77a-4cd6-b169-bb856090eb1c	guide_option_4		text	Fourth guide selection option	submission-form	2025-10-12 00:15:41.159
35f04032-854c-4e7d-b277-d48230379098	guide_option_3	Test 3	text	Third guide selection option	submission-form	2025-10-12 00:33:51.456
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_messages (id, session_id, content, is_bot, created_at) FROM stdin;
\.


--
-- Data for Name: consent_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.consent_records (id, full_name, email, phone, guide_type, ip_address, user_agent, consent_text, disclosure_version, disclosure_hash, source_url, channels_consented, sender_name, form_timestamp, created_at) FROM stdin;
f113e7a9-bf4a-4e7c-a71f-2038687f3b0e	Christopher Lackey	calackey85@gmail.com	(423) 802-5033	I'm a Business Owner	24.176.105.112, 10.82.6.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	SMS Opt-in (Program: LeadsByNova Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help. See our Privacy Policy and Terms.\n\nEmail Opt-in (Program: LeadsByNova Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time. See our Privacy Policy and Terms.	leadsbynova_disclosure_v2.0	d4f91b44aefa	https://033df6c9-61b0-44bb-93a8-20b9e35371c0-00-qykp8plkdzrh.spock.replit.dev/submission-form	Email, SMS	LeadsByNova (on behalf of [Agent/Brokerage])	2025-10-07 20:29:18.562	2025-10-07 20:29:18.599449
ecafae58-d380-4737-ae6a-f52a60a1792c	Chris Lackey (chat)	calackey85@gmail.com	(555) 555-5555	I'm a Business Owner	24.176.105.112, 10.82.7.243	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	SMS Opt-in (Program: LeadsByNova Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help. See our Privacy Policy and Terms.\n\nEmail Opt-in (Program: LeadsByNova Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time. See our Privacy Policy and Terms.	leadsbynova_disclosure_v2.0	d4f91b44aefa	https://033df6c9-61b0-44bb-93a8-20b9e35371c0-00-qykp8plkdzrh.spock.replit.dev/submission-form	Email, SMS	LeadsByNova (on behalf of [Agent/Brokerage])	2025-10-07 21:42:02.367	2025-10-07 21:42:02.404832
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, user_id, title, description, date, start_time, end_time, created_at, lead_id) FROM stdin;
\.


--
-- Data for Name: form_submissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.form_submissions (id, full_name, email, phone, guide_type, created_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leads (id, full_name, email, phone, guide_type, form_timestamp, chat_timestamp, prequalified, pre_qualification_range, move_timeline, budget_range, timeline, need_to_buy, occupancy_status, price_range, recent_upgrades, have_agent, property_type, booked_call, day_selected, lead_status, sent_to_dashboard, completed_chat, notes, assigned_to, sales_funnel_status, archived, deleted_at, created_at, updated_at, user_type, main_goal, lead_management, communication_preference, time_selected) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notes (id, user_id, headline, content, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_metadata; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_metadata (id, fork_id, database_url, email_to, description, is_active, created_at, last_validated_at) FROM stdin;
798e5316-8304-409d-a9ff-aeb71cea94e9	infinitydigitalstudios	postgresql://neondb_owner:npg_sT6gc2ZqKtPy@ep-green-glade-adn1qw45.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require	chris@infinitydigitalstudios.com	Fork: infinitydigitalstudios	true	2025-10-06 17:33:50.630487	2025-10-18 20:51:43.936
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, hashed_password, role, agent_name, is_active, token_version, created_at, updated_at, password_reset_token, reset_token_expiry) FROM stdin;
b8db2316-c263-4b59-9052-53a38f5d76c1	admin@leadsbynova.com	$2b$10$xPAiCDl61csKkcXdIIaqheVDflhCFzhqzInsxWDWBgb8NF4ie3erW	superadmin	\N	true	0	2025-10-06 17:35:46.473758	2025-10-06 17:35:46.473758	\N	\N
97d5bdc3-4248-4856-986c-aa4df2e96f42	chris@infinitydigitalstudios.com	$2b$10$19D59gQSelm3h3jo2jdJbO6EhHJnF8R40CQc5KBCxfVS1iyomabFi	owner	\N	true	0	2025-10-06 17:35:46.6234	2025-10-07 19:31:29.03	dd2861c85988c0a543d875dea8026bf1e5b4654310dc27a100b1b7f9ac0be26d	2025-10-07 20:31:29.03
\.


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: app_configuration app_configuration_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.app_configuration
    ADD CONSTRAINT app_configuration_config_key_unique UNIQUE (config_key);


--
-- Name: app_configuration app_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.app_configuration
    ADD CONSTRAINT app_configuration_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: consent_records consent_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consent_records
    ADD CONSTRAINT consent_records_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: tenant_metadata tenant_metadata_fork_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_metadata
    ADD CONSTRAINT tenant_metadata_fork_id_unique UNIQUE (fork_id);


--
-- Name: tenant_metadata tenant_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_metadata
    ADD CONSTRAINT tenant_metadata_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

