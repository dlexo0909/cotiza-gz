DO $$
BEGIN
  IF to_regclass('public.ordenes_trabajo') IS NULL THEN
    RAISE EXCEPTION 'No existe public.ordenes_trabajo. Primero ejecuta supabase/schema.sql en esta instancia nueva de Supabase.';
  END IF;

  IF to_regclass('public.usuarios') IS NULL THEN
    RAISE EXCEPTION 'No existe public.usuarios. Primero ejecuta supabase/schema.sql en esta instancia nueva de Supabase.';
  END IF;
END $$;

ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS estatus_tririga varchar(100);

CREATE TABLE IF NOT EXISTS public.ordenes_pagos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orden_id bigint NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  concepto varchar(150) NOT NULL,
  monto numeric(14,2) NOT NULL DEFAULT 0 CHECK (monto > 0),
  fecha_pago date NOT NULL,
  notas text,
  created_by bigint REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_pagos_orden ON public.ordenes_pagos(orden_id);

ALTER TABLE public.ordenes_pagos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ordenes_pagos'
      AND policyname = 'Authenticated users full access'
  ) THEN
    CREATE POLICY "Authenticated users full access" ON public.ordenes_pagos
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.ordenes_pagos;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.ordenes_pagos
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();