--
-- PostgreSQL database dump
--

\restrict IIhDftxPUewe0auIUSmDYePTSgu4ccveTXtbYVp01f0IacImjRlCj5ecAOSw10v

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.0

-- Started on 2025-10-30 17:46:04

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
-- TOC entry 117 (class 2615 OID 28382)
-- Name: poker; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA poker;


ALTER SCHEMA poker OWNER TO postgres;

--
-- TOC entry 383 (class 1259 OID 17826)
-- Name: all_tenants_view; Type: VIEW; Schema: poker; Owner: postgres
--

CREATE VIEW poker.all_tenants_view AS
SELECT
    NULL::integer AS id,
    NULL::character varying(255) AS name,
    NULL::character varying(255) AS email,
    NULL::character varying(50) AS phone,
    NULL::character varying(20) AS plan,
    NULL::character varying(20) AS status,
    NULL::integer AS max_users,
    NULL::integer AS max_sessions_per_month,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::timestamp with time zone AS approved_at,
    NULL::timestamp with time zone AS suspended_at,
    NULL::bigint AS users_count,
    NULL::bigint AS players_count,
    NULL::bigint AS sessions_count,
    NULL::numeric AS total_volume,
    NULL::date AS last_session_date,
    NULL::character varying(255) AS admin_name;


ALTER VIEW poker.all_tenants_view OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 379 (class 1259 OID 17711)
-- Name: audit_logs; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.audit_logs (
    id integer NOT NULL,
    tenant_id integer,
    user_id integer,
    action character varying(100) NOT NULL,
    table_name character varying(64),
    record_id integer,
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE poker.audit_logs OWNER TO postgres;

--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 379
-- Name: TABLE audit_logs; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.audit_logs IS 'Audit trail for all system changes';


--
-- TOC entry 378 (class 1259 OID 17710)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 378
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.audit_logs_id_seq OWNED BY poker.audit_logs.id;


--
-- TOC entry 381 (class 1259 OID 17740)
-- Name: player_transfers; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.player_transfers (
    id integer NOT NULL,
    session_id integer NOT NULL,
    tenant_id integer NOT NULL,
    from_player_id integer,
    to_player_id integer,
    from_player_name character varying(255) NOT NULL,
    to_player_name character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    type character varying(20) DEFAULT 'transfer'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT player_transfers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT player_transfers_type_check CHECK (((type)::text = ANY ((ARRAY['transfer'::character varying, 'session_fee'::character varying, 'janta_fee'::character varying, 'rake'::character varying])::text[])))
);


ALTER TABLE poker.player_transfers OWNER TO postgres;

--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 381
-- Name: TABLE player_transfers; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.player_transfers IS 'Money transfers between players after sessions';


--
-- TOC entry 380 (class 1259 OID 17739)
-- Name: player_transfers_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.player_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.player_transfers_id_seq OWNER TO postgres;

--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 380
-- Name: player_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.player_transfers_id_seq OWNED BY poker.player_transfers.id;


--
-- TOC entry 373 (class 1259 OID 17588)
-- Name: players; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.players (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name character varying(255) NOT NULL,
    nickname character varying(100),
    phone character varying(50),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id integer,
    total_sessions integer DEFAULT 0,
    total_buyin numeric(10,2) DEFAULT 0.00,
    total_cashout numeric(10,2) DEFAULT 0.00,
    total_profit numeric(10,2) DEFAULT 0.00,
    win_rate numeric(5,2) DEFAULT 0.00,
    avg_session_time integer DEFAULT 0,
    best_session numeric(10,2) DEFAULT 0.00,
    worst_session numeric(10,2) DEFAULT 0.00,
    last_played timestamp with time zone
);


ALTER TABLE poker.players OWNER TO postgres;

--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 373
-- Name: TABLE players; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.players IS 'Poker players (may or may not have user accounts)';


--
-- TOC entry 372 (class 1259 OID 17587)
-- Name: players_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.players_id_seq OWNER TO postgres;

--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 372
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.players_id_seq OWNED BY poker.players.id;


--
-- TOC entry 375 (class 1259 OID 17627)
-- Name: sessions; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.sessions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    date date NOT NULL,
    location character varying(255) DEFAULT 'Local não informado'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    closed_at timestamp with time zone,
    players_data jsonb,
    recommendations jsonb,
    paid_transfers jsonb,
    session_fee numeric(8,2) DEFAULT 0.00,
    janta_fee numeric(8,2) DEFAULT 0.00,
    rake_percentage numeric(5,2) DEFAULT 0.00,
    total_buyin numeric(10,2) DEFAULT 0.00,
    total_cashout numeric(10,2) DEFAULT 0.00,
    total_profit numeric(10,2) DEFAULT 0.00,
    players_count integer DEFAULT 0,
    CONSTRAINT sessions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE poker.sessions OWNER TO postgres;

--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 375
-- Name: TABLE sessions; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.sessions IS 'Poker game sessions with buy-ins, cash-outs, and transfers';


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 375
-- Name: COLUMN sessions.players_data; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON COLUMN poker.sessions.players_data IS 'JSONB array of player session data: [{name, buyin, cashout, session_paid, janta_paid}]';


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 375
-- Name: COLUMN sessions.recommendations; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON COLUMN poker.sessions.recommendations IS 'JSONB array of optimized transfer recommendations: [{from, to, amount, isPaid}]';


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 375
-- Name: COLUMN sessions.paid_transfers; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON COLUMN poker.sessions.paid_transfers IS 'JSONB object tracking paid status: {"from_to": true/false}';


--
-- TOC entry 374 (class 1259 OID 17626)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 374
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.sessions_id_seq OWNED BY poker.sessions.id;


--
-- TOC entry 369 (class 1259 OID 17534)
-- Name: tenants; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.tenants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    plan character varying(20) DEFAULT 'basic'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    max_users integer DEFAULT 10,
    max_sessions_per_month integer DEFAULT 50,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    suspended_at timestamp with time zone,
    CONSTRAINT tenants_plan_check CHECK (((plan)::text = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'enterprise'::character varying])::text[]))),
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'suspended'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE poker.tenants OWNER TO postgres;

--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 369
-- Name: TABLE tenants; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.tenants IS 'Multi-tenant organizations (poker groups/clubs)';


--
-- TOC entry 371 (class 1259 OID 17558)
-- Name: users; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.users (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'player'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    player_id integer,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'player'::character varying])::text[])))
);


ALTER TABLE poker.users OWNER TO postgres;

--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 371
-- Name: TABLE users; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.users IS 'System users with authentication and roles';


--
-- TOC entry 382 (class 1259 OID 17821)
-- Name: super_admin_stats; Type: VIEW; Schema: poker; Owner: postgres
--

CREATE VIEW poker.super_admin_stats AS
 SELECT count(DISTINCT t.id) AS total_tenants,
    count(DISTINCT
        CASE
            WHEN ((t.status)::text = 'active'::text) THEN t.id
            ELSE NULL::integer
        END) AS active_tenants,
    count(DISTINCT u.id) AS total_users,
    count(DISTINCT
        CASE
            WHEN (u.is_active = true) THEN u.id
            ELSE NULL::integer
        END) AS active_users,
    count(DISTINCT p.id) AS total_players,
    count(DISTINCT s.id) AS total_sessions,
    COALESCE(sum(s.total_buyin), (0)::numeric) AS total_volume,
    count(DISTINCT
        CASE
            WHEN (s.date >= (CURRENT_DATE - '30 days'::interval)) THEN s.id
            ELSE NULL::integer
        END) AS sessions_last_30_days
   FROM (((poker.tenants t
     LEFT JOIN poker.users u ON ((t.id = u.tenant_id)))
     LEFT JOIN poker.players p ON ((t.id = p.tenant_id)))
     LEFT JOIN poker.sessions s ON ((t.id = s.tenant_id)));


ALTER VIEW poker.super_admin_stats OWNER TO postgres;

--
-- TOC entry 368 (class 1259 OID 17533)
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.tenants_id_seq OWNER TO postgres;

--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 368
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.tenants_id_seq OWNED BY poker.tenants.id;


--
-- TOC entry 377 (class 1259 OID 17669)
-- Name: user_invites; Type: TABLE; Schema: poker; Owner: postgres
--

CREATE TABLE poker.user_invites (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    invited_by_user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    role character varying(20) DEFAULT 'player'::character varying,
    invite_token character varying(128) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    player_id integer,
    CONSTRAINT user_invites_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'player'::character varying])::text[]))),
    CONSTRAINT user_invites_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE poker.user_invites OWNER TO postgres;

--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 377
-- Name: TABLE user_invites; Type: COMMENT; Schema: poker; Owner: postgres
--

COMMENT ON TABLE poker.user_invites IS 'Email invitations to join a tenant';


--
-- TOC entry 376 (class 1259 OID 17668)
-- Name: user_invites_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.user_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.user_invites_id_seq OWNER TO postgres;

--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 376
-- Name: user_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.user_invites_id_seq OWNED BY poker.user_invites.id;


--
-- TOC entry 370 (class 1259 OID 17557)
-- Name: users_id_seq; Type: SEQUENCE; Schema: poker; Owner: postgres
--

CREATE SEQUENCE poker.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE poker.users_id_seq OWNER TO postgres;

--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 370
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: poker; Owner: postgres
--

ALTER SEQUENCE poker.users_id_seq OWNED BY poker.users.id;


--
-- TOC entry 4060 (class 2604 OID 17714)
-- Name: audit_logs id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.audit_logs ALTER COLUMN id SET DEFAULT nextval('poker.audit_logs_id_seq'::regclass);


--
-- TOC entry 4062 (class 2604 OID 17743)
-- Name: player_transfers id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers ALTER COLUMN id SET DEFAULT nextval('poker.player_transfers_id_seq'::regclass);


--
-- TOC entry 4031 (class 2604 OID 17591)
-- Name: players id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.players ALTER COLUMN id SET DEFAULT nextval('poker.players_id_seq'::regclass);


--
-- TOC entry 4043 (class 2604 OID 17630)
-- Name: sessions id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.sessions ALTER COLUMN id SET DEFAULT nextval('poker.sessions_id_seq'::regclass);


--
-- TOC entry 4019 (class 2604 OID 17537)
-- Name: tenants id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.tenants ALTER COLUMN id SET DEFAULT nextval('poker.tenants_id_seq'::regclass);


--
-- TOC entry 4055 (class 2604 OID 17672)
-- Name: user_invites id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites ALTER COLUMN id SET DEFAULT nextval('poker.user_invites_id_seq'::regclass);


--
-- TOC entry 4026 (class 2604 OID 17561)
-- Name: users id; Type: DEFAULT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.users ALTER COLUMN id SET DEFAULT nextval('poker.users_id_seq'::regclass);


--
-- TOC entry 4118 (class 2606 OID 17719)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4133 (class 2606 OID 17753)
-- Name: player_transfers player_transfers_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers
    ADD CONSTRAINT player_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 4097 (class 2606 OID 17606)
-- Name: players players_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- TOC entry 4106 (class 2606 OID 17646)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4079 (class 2606 OID 17551)
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- TOC entry 4081 (class 2606 OID 17549)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 4114 (class 2606 OID 17684)
-- Name: user_invites user_invites_invite_token_key; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites
    ADD CONSTRAINT user_invites_invite_token_key UNIQUE (invite_token);


--
-- TOC entry 4116 (class 2606 OID 17682)
-- Name: user_invites user_invites_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites
    ADD CONSTRAINT user_invites_pkey PRIMARY KEY (id);


--
-- TOC entry 4088 (class 2606 OID 17572)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4090 (class 2606 OID 17570)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4119 (class 1259 OID 17732)
-- Name: idx_audit_action; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_action ON poker.audit_logs USING btree (action);


--
-- TOC entry 4120 (class 1259 OID 17734)
-- Name: idx_audit_created_at; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_created_at ON poker.audit_logs USING btree (created_at DESC);


--
-- TOC entry 4121 (class 1259 OID 17736)
-- Name: idx_audit_new_data; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_new_data ON poker.audit_logs USING gin (new_data);


--
-- TOC entry 4122 (class 1259 OID 17735)
-- Name: idx_audit_old_data; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_old_data ON poker.audit_logs USING gin (old_data);


--
-- TOC entry 4123 (class 1259 OID 17733)
-- Name: idx_audit_table_record; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_table_record ON poker.audit_logs USING btree (table_name, record_id);


--
-- TOC entry 4124 (class 1259 OID 17730)
-- Name: idx_audit_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_tenant_id ON poker.audit_logs USING btree (tenant_id);


--
-- TOC entry 4125 (class 1259 OID 17731)
-- Name: idx_audit_user_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_audit_user_id ON poker.audit_logs USING btree (user_id);


--
-- TOC entry 4107 (class 1259 OID 17701)
-- Name: idx_invites_email; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_email ON poker.user_invites USING btree (email);


--
-- TOC entry 4108 (class 1259 OID 17703)
-- Name: idx_invites_expires_at; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_expires_at ON poker.user_invites USING btree (expires_at);


--
-- TOC entry 4109 (class 1259 OID 17702)
-- Name: idx_invites_status; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_status ON poker.user_invites USING btree (status);


--
-- TOC entry 4110 (class 1259 OID 17700)
-- Name: idx_invites_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_tenant_id ON poker.user_invites USING btree (tenant_id);


--
-- TOC entry 4111 (class 1259 OID 17705)
-- Name: idx_invites_tenant_status; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_tenant_status ON poker.user_invites USING btree (tenant_id, status);


--
-- TOC entry 4112 (class 1259 OID 17704)
-- Name: idx_invites_token; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_invites_token ON poker.user_invites USING btree (invite_token);


--
-- TOC entry 4091 (class 1259 OID 17618)
-- Name: idx_players_is_active; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_players_is_active ON poker.players USING btree (is_active);


--
-- TOC entry 4092 (class 1259 OID 17619)
-- Name: idx_players_name; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_players_name ON poker.players USING btree (name);


--
-- TOC entry 4093 (class 1259 OID 17620)
-- Name: idx_players_tenant_active; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_players_tenant_active ON poker.players USING btree (tenant_id, is_active);


--
-- TOC entry 4094 (class 1259 OID 17617)
-- Name: idx_players_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_players_tenant_id ON poker.players USING btree (tenant_id);


--
-- TOC entry 4095 (class 1259 OID 17621)
-- Name: idx_players_user_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_players_user_id ON poker.players USING btree (user_id);


--
-- TOC entry 4098 (class 1259 OID 17660)
-- Name: idx_sessions_created_by; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_created_by ON poker.sessions USING btree (created_by);


--
-- TOC entry 4099 (class 1259 OID 17658)
-- Name: idx_sessions_date; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_date ON poker.sessions USING btree (date DESC);


--
-- TOC entry 4100 (class 1259 OID 17662)
-- Name: idx_sessions_players_data; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_players_data ON poker.sessions USING gin (players_data);


--
-- TOC entry 4101 (class 1259 OID 17663)
-- Name: idx_sessions_recommendations; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_recommendations ON poker.sessions USING gin (recommendations);


--
-- TOC entry 4102 (class 1259 OID 17659)
-- Name: idx_sessions_status; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_status ON poker.sessions USING btree (status);


--
-- TOC entry 4103 (class 1259 OID 17661)
-- Name: idx_sessions_tenant_date; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_tenant_date ON poker.sessions USING btree (tenant_id, date DESC);


--
-- TOC entry 4104 (class 1259 OID 17657)
-- Name: idx_sessions_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_sessions_tenant_id ON poker.sessions USING btree (tenant_id);


--
-- TOC entry 4075 (class 1259 OID 17554)
-- Name: idx_tenants_email; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_tenants_email ON poker.tenants USING btree (email);


--
-- TOC entry 4076 (class 1259 OID 17553)
-- Name: idx_tenants_plan; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_tenants_plan ON poker.tenants USING btree (plan);


--
-- TOC entry 4077 (class 1259 OID 17552)
-- Name: idx_tenants_status; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_tenants_status ON poker.tenants USING btree (status);


--
-- TOC entry 4126 (class 1259 OID 17776)
-- Name: idx_transfers_from_player; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_from_player ON poker.player_transfers USING btree (from_player_id);


--
-- TOC entry 4127 (class 1259 OID 17774)
-- Name: idx_transfers_session_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_session_id ON poker.player_transfers USING btree (session_id);


--
-- TOC entry 4128 (class 1259 OID 17778)
-- Name: idx_transfers_status; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_status ON poker.player_transfers USING btree (status);


--
-- TOC entry 4129 (class 1259 OID 17775)
-- Name: idx_transfers_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_tenant_id ON poker.player_transfers USING btree (tenant_id);


--
-- TOC entry 4130 (class 1259 OID 17777)
-- Name: idx_transfers_to_player; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_to_player ON poker.player_transfers USING btree (to_player_id);


--
-- TOC entry 4131 (class 1259 OID 17779)
-- Name: idx_transfers_type; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_transfers_type ON poker.player_transfers USING btree (type);


--
-- TOC entry 4082 (class 1259 OID 17581)
-- Name: idx_users_email; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_users_email ON poker.users USING btree (email);


--
-- TOC entry 4083 (class 1259 OID 17580)
-- Name: idx_users_is_active; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_users_is_active ON poker.users USING btree (is_active);


--
-- TOC entry 4084 (class 1259 OID 17579)
-- Name: idx_users_role; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_users_role ON poker.users USING btree (role);


--
-- TOC entry 4085 (class 1259 OID 17578)
-- Name: idx_users_tenant_id; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_users_tenant_id ON poker.users USING btree (tenant_id);


--
-- TOC entry 4086 (class 1259 OID 17582)
-- Name: idx_users_tenant_role; Type: INDEX; Schema: poker; Owner: postgres
--

CREATE INDEX idx_users_tenant_role ON poker.users USING btree (tenant_id, role);


--
-- TOC entry 4303 (class 2618 OID 17829)
-- Name: all_tenants_view _RETURN; Type: RULE; Schema: poker; Owner: postgres
--

CREATE OR REPLACE VIEW poker.all_tenants_view WITH (security_invoker='on') AS
 SELECT t.id,
    t.name,
    t.email,
    t.phone,
    t.plan,
    t.status,
    t.max_users,
    t.max_sessions_per_month,
    t.created_at,
    t.updated_at,
    t.approved_at,
    t.suspended_at,
    count(DISTINCT u.id) AS users_count,
    count(DISTINCT p.id) AS players_count,
    count(DISTINCT s.id) AS sessions_count,
    COALESCE(sum(s.total_buyin), (0)::numeric) AS total_volume,
    max(s.date) AS last_session_date,
    ( SELECT users.name
           FROM poker.users
          WHERE ((users.tenant_id = t.id) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))
          ORDER BY users.id
         LIMIT 1) AS admin_name
   FROM (((poker.tenants t
     LEFT JOIN poker.users u ON (((t.id = u.tenant_id) AND (u.is_active = true))))
     LEFT JOIN poker.players p ON (((t.id = p.tenant_id) AND (p.is_active = true))))
     LEFT JOIN poker.sessions s ON ((t.id = s.tenant_id)))
  GROUP BY t.id;


--
-- TOC entry 4152 (class 2620 OID 17819)
-- Name: user_invites update_invites_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON poker.user_invites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4150 (class 2620 OID 17817)
-- Name: players update_players_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON poker.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4151 (class 2620 OID 17818)
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON poker.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4148 (class 2620 OID 17815)
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON poker.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4153 (class 2620 OID 17820)
-- Name: player_transfers update_transfers_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON poker.player_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4149 (class 2620 OID 17816)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: poker; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON poker.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4142 (class 2606 OID 17720)
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE SET NULL;


--
-- TOC entry 4143 (class 2606 OID 17725)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES poker.users(id) ON DELETE SET NULL;


--
-- TOC entry 4144 (class 2606 OID 17764)
-- Name: player_transfers player_transfers_from_player_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers
    ADD CONSTRAINT player_transfers_from_player_id_fkey FOREIGN KEY (from_player_id) REFERENCES poker.players(id) ON DELETE SET NULL;


--
-- TOC entry 4145 (class 2606 OID 17754)
-- Name: player_transfers player_transfers_session_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers
    ADD CONSTRAINT player_transfers_session_id_fkey FOREIGN KEY (session_id) REFERENCES poker.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4146 (class 2606 OID 17759)
-- Name: player_transfers player_transfers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers
    ADD CONSTRAINT player_transfers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 4147 (class 2606 OID 17769)
-- Name: player_transfers player_transfers_to_player_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.player_transfers
    ADD CONSTRAINT player_transfers_to_player_id_fkey FOREIGN KEY (to_player_id) REFERENCES poker.players(id) ON DELETE SET NULL;


--
-- TOC entry 4135 (class 2606 OID 17607)
-- Name: players players_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.players
    ADD CONSTRAINT players_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 4136 (class 2606 OID 17612)
-- Name: players players_user_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.players
    ADD CONSTRAINT players_user_id_fkey FOREIGN KEY (user_id) REFERENCES poker.users(id) ON DELETE SET NULL;


--
-- TOC entry 4137 (class 2606 OID 17652)
-- Name: sessions sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.sessions
    ADD CONSTRAINT sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES poker.users(id) ON DELETE CASCADE;


--
-- TOC entry 4138 (class 2606 OID 17647)
-- Name: sessions sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.sessions
    ADD CONSTRAINT sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 4139 (class 2606 OID 17690)
-- Name: user_invites user_invites_invited_by_user_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites
    ADD CONSTRAINT user_invites_invited_by_user_id_fkey FOREIGN KEY (invited_by_user_id) REFERENCES poker.users(id) ON DELETE CASCADE;


--
-- TOC entry 4140 (class 2606 OID 17695)
-- Name: user_invites user_invites_player_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites
    ADD CONSTRAINT user_invites_player_id_fkey FOREIGN KEY (player_id) REFERENCES poker.players(id) ON DELETE SET NULL;


--
-- TOC entry 4141 (class 2606 OID 17685)
-- Name: user_invites user_invites_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.user_invites
    ADD CONSTRAINT user_invites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 4134 (class 2606 OID 17573)
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: poker; Owner: postgres
--

ALTER TABLE ONLY poker.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES poker.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 4354 (class 3256 OID 19139)
-- Name: user_invites Admins can create invites in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can create invites in their tenant" ON poker.user_invites FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4342 (class 3256 OID 19127)
-- Name: users Admins can create users in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can create users in their tenant" ON poker.users FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4356 (class 3256 OID 19141)
-- Name: user_invites Admins can delete invites in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can delete invites in their tenant" ON poker.user_invites FOR DELETE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4348 (class 3256 OID 19133)
-- Name: players Admins can delete players in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can delete players in their tenant" ON poker.players FOR DELETE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4352 (class 3256 OID 19137)
-- Name: sessions Admins can delete sessions in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can delete sessions in their tenant" ON poker.sessions FOR DELETE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4344 (class 3256 OID 19129)
-- Name: users Admins can delete users in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can delete users in their tenant" ON poker.users FOR DELETE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4355 (class 3256 OID 19140)
-- Name: user_invites Admins can update invites in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can update invites in their tenant" ON poker.user_invites FOR UPDATE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4339 (class 3256 OID 19124)
-- Name: tenants Admins can update their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can update their tenant" ON poker.tenants FOR UPDATE USING (((id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4343 (class 3256 OID 19128)
-- Name: users Admins can update users in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can update users in their tenant" ON poker.users FOR UPDATE USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4357 (class 3256 OID 19142)
-- Name: audit_logs Admins can view audit logs from their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Admins can view audit logs from their tenant" ON poker.audit_logs FOR SELECT USING (((tenant_id = public.get_user_tenant_id()) AND public.user_has_role('admin'::text)));


--
-- TOC entry 4338 (class 3256 OID 19123)
-- Name: tenants Super admins can create tenants; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Super admins can create tenants" ON poker.tenants FOR INSERT WITH CHECK (public.user_has_role('super_admin'::text));


--
-- TOC entry 4340 (class 3256 OID 19125)
-- Name: tenants Super admins can delete tenants; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Super admins can delete tenants" ON poker.tenants FOR DELETE USING (public.user_has_role('super_admin'::text));


--
-- TOC entry 4358 (class 3256 OID 19143)
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "System can insert audit logs" ON poker.audit_logs FOR INSERT WITH CHECK (true);


--
-- TOC entry 4346 (class 3256 OID 19131)
-- Name: players Users can create players in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can create players in their tenant" ON poker.players FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4350 (class 3256 OID 19135)
-- Name: sessions Users can create sessions in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can create sessions in their tenant" ON poker.sessions FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4347 (class 3256 OID 19132)
-- Name: players Users can update players in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can update players in their tenant" ON poker.players FOR UPDATE USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4351 (class 3256 OID 19136)
-- Name: sessions Users can update sessions in their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can update sessions in their tenant" ON poker.sessions FOR UPDATE USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4353 (class 3256 OID 19138)
-- Name: user_invites Users can view invites from their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can view invites from their tenant" ON poker.user_invites FOR SELECT USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4345 (class 3256 OID 19130)
-- Name: players Users can view players from their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can view players from their tenant" ON poker.players FOR SELECT USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4349 (class 3256 OID 19134)
-- Name: sessions Users can view sessions from their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can view sessions from their tenant" ON poker.sessions FOR SELECT USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4337 (class 3256 OID 19122)
-- Name: tenants Users can view their own tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can view their own tenant" ON poker.tenants FOR SELECT USING ((id = public.get_user_tenant_id()));


--
-- TOC entry 4341 (class 3256 OID 19126)
-- Name: users Users can view users from their tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY "Users can view users from their tenant" ON poker.users FOR SELECT USING ((tenant_id = public.get_user_tenant_id()));


--
-- TOC entry 4311 (class 0 OID 17711)
-- Dependencies: 379
-- Name: audit_logs; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4332 (class 3256 OID 17738)
-- Name: audit_logs audit_logs_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY audit_logs_insert ON poker.audit_logs FOR INSERT WITH CHECK (true);


--
-- TOC entry 4331 (class 3256 OID 17737)
-- Name: audit_logs audit_logs_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY audit_logs_select ON poker.audit_logs FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4312 (class 0 OID 17740)
-- Dependencies: 381
-- Name: player_transfers; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.player_transfers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4308 (class 0 OID 17588)
-- Dependencies: 373
-- Name: players; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.players ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4309 (class 0 OID 17627)
-- Dependencies: 375
-- Name: sessions; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4313 (class 3256 OID 17555)
-- Name: tenants super_admin_all_tenants; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY super_admin_all_tenants ON poker.tenants USING (((auth.jwt() ->> 'role'::text) = 'super_admin'::text));


--
-- TOC entry 4330 (class 3256 OID 17709)
-- Name: user_invites tenant_isolation_invites_delete; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_invites_delete ON poker.user_invites FOR DELETE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4328 (class 3256 OID 17707)
-- Name: user_invites tenant_isolation_invites_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_invites_insert ON poker.user_invites FOR INSERT WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4327 (class 3256 OID 17706)
-- Name: user_invites tenant_isolation_invites_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_invites_select ON poker.user_invites FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4329 (class 3256 OID 17708)
-- Name: user_invites tenant_isolation_invites_update; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_invites_update ON poker.user_invites FOR UPDATE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4322 (class 3256 OID 17625)
-- Name: players tenant_isolation_players_delete; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_players_delete ON poker.players FOR DELETE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4320 (class 3256 OID 17623)
-- Name: players tenant_isolation_players_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_players_insert ON poker.players FOR INSERT WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4319 (class 3256 OID 17622)
-- Name: players tenant_isolation_players_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_players_select ON poker.players FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4321 (class 3256 OID 17624)
-- Name: players tenant_isolation_players_update; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_players_update ON poker.players FOR UPDATE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4326 (class 3256 OID 17667)
-- Name: sessions tenant_isolation_sessions_delete; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_sessions_delete ON poker.sessions FOR DELETE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4324 (class 3256 OID 17665)
-- Name: sessions tenant_isolation_sessions_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_sessions_insert ON poker.sessions FOR INSERT WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4323 (class 3256 OID 17664)
-- Name: sessions tenant_isolation_sessions_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_sessions_select ON poker.sessions FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4325 (class 3256 OID 17666)
-- Name: sessions tenant_isolation_sessions_update; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_sessions_update ON poker.sessions FOR UPDATE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4336 (class 3256 OID 17783)
-- Name: player_transfers tenant_isolation_transfers_delete; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_transfers_delete ON poker.player_transfers FOR DELETE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4334 (class 3256 OID 17781)
-- Name: player_transfers tenant_isolation_transfers_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_transfers_insert ON poker.player_transfers FOR INSERT WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4333 (class 3256 OID 17780)
-- Name: player_transfers tenant_isolation_transfers_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_transfers_select ON poker.player_transfers FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4335 (class 3256 OID 17782)
-- Name: player_transfers tenant_isolation_transfers_update; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_transfers_update ON poker.player_transfers FOR UPDATE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'player'::text])))));


--
-- TOC entry 4318 (class 3256 OID 17586)
-- Name: users tenant_isolation_users_delete; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_users_delete ON poker.users FOR DELETE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR ((tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text))));


--
-- TOC entry 4316 (class 3256 OID 17584)
-- Name: users tenant_isolation_users_insert; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_users_insert ON poker.users FOR INSERT WITH CHECK ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4315 (class 3256 OID 17583)
-- Name: users tenant_isolation_users_select; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_users_select ON poker.users FOR SELECT USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4317 (class 3256 OID 17585)
-- Name: users tenant_isolation_users_update; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY tenant_isolation_users_update ON poker.users FOR UPDATE USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (tenant_id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer)));


--
-- TOC entry 4306 (class 0 OID 17534)
-- Dependencies: 369
-- Name: tenants; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.tenants ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4310 (class 0 OID 17669)
-- Dependencies: 377
-- Name: user_invites; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.user_invites ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4307 (class 0 OID 17558)
-- Dependencies: 371
-- Name: users; Type: ROW SECURITY; Schema: poker; Owner: postgres
--

ALTER TABLE poker.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4314 (class 3256 OID 17556)
-- Name: tenants users_own_tenant; Type: POLICY; Schema: poker; Owner: postgres
--

CREATE POLICY users_own_tenant ON poker.tenants FOR SELECT USING ((id = (NULLIF(((auth.jwt() -> 'app_metadata'::text) ->> 'tenant_id'::text), ''::text))::integer));


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 117
-- Name: SCHEMA poker; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA poker TO anon;
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT USAGE ON SCHEMA poker TO service_role;


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 383
-- Name: TABLE all_tenants_view; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.all_tenants_view TO anon;
GRANT ALL ON TABLE poker.all_tenants_view TO authenticated;
GRANT ALL ON TABLE poker.all_tenants_view TO service_role;


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 379
-- Name: TABLE audit_logs; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.audit_logs TO anon;
GRANT ALL ON TABLE poker.audit_logs TO authenticated;
GRANT ALL ON TABLE poker.audit_logs TO service_role;


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 378
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.audit_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.audit_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.audit_logs_id_seq TO service_role;


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 381
-- Name: TABLE player_transfers; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.player_transfers TO anon;
GRANT ALL ON TABLE poker.player_transfers TO authenticated;
GRANT ALL ON TABLE poker.player_transfers TO service_role;


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 380
-- Name: SEQUENCE player_transfers_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.player_transfers_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.player_transfers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.player_transfers_id_seq TO service_role;


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 373
-- Name: TABLE players; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.players TO anon;
GRANT ALL ON TABLE poker.players TO authenticated;
GRANT ALL ON TABLE poker.players TO service_role;


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 372
-- Name: SEQUENCE players_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.players_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.players_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.players_id_seq TO service_role;


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 375
-- Name: TABLE sessions; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.sessions TO anon;
GRANT ALL ON TABLE poker.sessions TO authenticated;
GRANT ALL ON TABLE poker.sessions TO service_role;


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 374
-- Name: SEQUENCE sessions_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.sessions_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.sessions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.sessions_id_seq TO service_role;


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 369
-- Name: TABLE tenants; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.tenants TO anon;
GRANT ALL ON TABLE poker.tenants TO authenticated;
GRANT ALL ON TABLE poker.tenants TO service_role;


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 371
-- Name: TABLE users; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.users TO anon;
GRANT ALL ON TABLE poker.users TO authenticated;
GRANT ALL ON TABLE poker.users TO service_role;


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 382
-- Name: TABLE super_admin_stats; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.super_admin_stats TO anon;
GRANT ALL ON TABLE poker.super_admin_stats TO authenticated;
GRANT ALL ON TABLE poker.super_admin_stats TO service_role;


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 368
-- Name: SEQUENCE tenants_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.tenants_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.tenants_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.tenants_id_seq TO service_role;


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 377
-- Name: TABLE user_invites; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON TABLE poker.user_invites TO anon;
GRANT ALL ON TABLE poker.user_invites TO authenticated;
GRANT ALL ON TABLE poker.user_invites TO service_role;


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 376
-- Name: SEQUENCE user_invites_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.user_invites_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.user_invites_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.user_invites_id_seq TO service_role;


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 370
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: poker; Owner: postgres
--

GRANT ALL ON SEQUENCE poker.users_id_seq TO anon;
GRANT ALL ON SEQUENCE poker.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE poker.users_id_seq TO service_role;


--
-- TOC entry 2821 (class 826 OID 28667)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: poker; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT SELECT,USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2822 (class 826 OID 28668)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: poker; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2820 (class 826 OID 28666)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: poker; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA poker GRANT ALL ON TABLES TO service_role;


-- Completed on 2025-10-30 17:46:08

--
-- PostgreSQL database dump complete
--

\unrestrict IIhDftxPUewe0auIUSmDYePTSgu4ccveTXtbYVp01f0IacImjRlCj5ecAOSw10v

