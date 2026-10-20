CREATE TABLE public.ai_reviews (
 id varchar(36) PRIMARY KEY,
 case_id varchar(36) NOT NULL REFERENCES public.cases(id),
 actor_id varchar(36) NOT NULL REFERENCES public.profiles(id),
 request_key varchar(100) NOT NULL,
 case_version integer NOT NULL,
 fingerprint varchar(64) NOT NULL,
 snapshot text NOT NULL,
 model varchar(100) NOT NULL,
 prompt_version varchar(40) NOT NULL,
 status varchar(20) NOT NULL CHECK (status IN ('PENDING','COMPLETED','FAILED')),
 result text,
 error text,
 created_at varchar(40) NOT NULL,
 UNIQUE(actor_id, request_key)
);
CREATE INDEX ix_ai_reviews_case_id ON public.ai_reviews(case_id);
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_reviews FROM anon, authenticated;
