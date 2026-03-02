-- ============================================================
-- SUPABASE SCHEMA: Cotiza GZ by Web Artisan
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. TABLA: usuarios (perfil vinculado a auth.users)
CREATE TABLE public.usuarios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre varchar(200) NOT NULL,
  email varchar(200) NOT NULL UNIQUE,
  rol varchar(20) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  activo boolean NOT NULL DEFAULT true,
  ultimo_acceso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TABLA: clientes
CREATE TABLE public.clientes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre varchar(200) NOT NULL,
  rfc varchar(20),
  email varchar(200),
  telefono varchar(30),
  contacto varchar(200),
  direccion text,
  comision_pct numeric(5,2) NOT NULL DEFAULT 30.00,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABLA: clientes_finales (sucursales)
CREATE TABLE public.clientes_finales (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id bigint NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre varchar(200) NOT NULL,
  id_externo varchar(50),
  direccion text,
  ciudad varchar(100),
  estado varchar(100),
  codigo_postal varchar(10),
  contacto varchar(200),
  telefono varchar(30),
  email varchar(200),
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. TABLA: ordenes_trabajo
CREATE TABLE public.ordenes_trabajo (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  folio varchar(20) NOT NULL UNIQUE,
  cliente_id bigint NOT NULL REFERENCES public.clientes(id),
  cliente_final_id bigint REFERENCES public.clientes_finales(id),
  ot_cliente varchar(100),
  descripcion text NOT NULL,
  direccion_obra text,
  fecha_levantamiento date,
  fecha_inicio date,
  fecha_fin date,
  estatus varchar(20) NOT NULL DEFAULT 'levantamiento'
    CHECK (estatus IN ('levantamiento','cotizado','autorizado','en_proceso','terminado','facturado','cobrado','cancelado')),
  monto_autorizado numeric(14,2),
  notas text,
  created_by bigint REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. TABLA: cotizaciones
CREATE TABLE public.cotizaciones (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  orden_id bigint NOT NULL REFERENCES public.ordenes_trabajo(id),
  folio varchar(20) NOT NULL UNIQUE,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  iva_pct numeric(5,2) NOT NULL DEFAULT 16.00,
  iva numeric(14,2) NOT NULL DEFAULT 0,
  comision_pct numeric(5,2) NOT NULL DEFAULT 30.00,
  comision numeric(14,2) NOT NULL DEFAULT 0,
  ingreso_real numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  estatus varchar(20) NOT NULL DEFAULT 'borrador'
    CHECK (estatus IN ('borrador','enviada','autorizada','rechazada','vencida')),
  vigencia_dias integer NOT NULL DEFAULT 30,
  fecha_vigencia date,
  condiciones text,
  numero_factura varchar(50),
  fecha_facturacion date,
  fecha_cobro date,
  fecha_autorizacion date,
  neodata_archivo varchar(500),
  neodata_original varchar(300),
  neodata_fecha timestamptz,
  created_by bigint REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. TABLA: cotizacion_partidas
CREATE TABLE public.cotizacion_partidas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cotizacion_id bigint NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  unidad varchar(20) NOT NULL DEFAULT 'pza',
  cantidad numeric(14,4) NOT NULL DEFAULT 1,
  precio_unitario numeric(14,2) NOT NULL DEFAULT 0,
  importe numeric(14,2) NOT NULL DEFAULT 0,
  orden integer NOT NULL DEFAULT 0
);

-- 7. TABLA: cotizacion_analisis_costos
CREATE TABLE public.cotizacion_analisis_costos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cotizacion_id bigint NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  categoria varchar(30) NOT NULL DEFAULT 'materiales'
    CHECK (categoria IN ('materiales','mano_obra','herramienta','transporte','subcontratos','riesgo','otros')),
  descripcion text,
  costo_real numeric(14,2) NOT NULL DEFAULT 0,
  costo_cliente numeric(14,2) NOT NULL DEFAULT 0,
  orden integer NOT NULL DEFAULT 0
);

-- 8. TABLA: historial_estatus
CREATE TABLE public.historial_estatus (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entidad_tipo varchar(20) NOT NULL CHECK (entidad_tipo IN ('orden', 'cotizacion')),
  entidad_id bigint NOT NULL,
  estatus_anterior varchar(20),
  estatus_nuevo varchar(20) NOT NULL,
  usuario_id bigint REFERENCES public.usuarios(id),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. TABLA: configuracion
CREATE TABLE public.configuracion (
  clave varchar(100) PRIMARY KEY,
  valor text,
  descripcion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDICES
-- ============================================================
CREATE INDEX idx_clientes_finales_cliente ON public.clientes_finales(cliente_id);
CREATE INDEX idx_ordenes_cliente ON public.ordenes_trabajo(cliente_id);
CREATE INDEX idx_ordenes_estatus ON public.ordenes_trabajo(estatus);
CREATE INDEX idx_ordenes_folio ON public.ordenes_trabajo(folio);
CREATE INDEX idx_cotizaciones_orden ON public.cotizaciones(orden_id);
CREATE INDEX idx_cotizaciones_estatus ON public.cotizaciones(estatus);
CREATE INDEX idx_cotizaciones_folio ON public.cotizaciones(folio);
CREATE INDEX idx_partidas_cotizacion ON public.cotizacion_partidas(cotizacion_id);
CREATE INDEX idx_analisis_cotizacion ON public.cotizacion_analisis_costos(cotizacion_id);
CREATE INDEX idx_historial_entidad ON public.historial_estatus(entidad_tipo, entidad_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Vista de órdenes completas
CREATE OR REPLACE VIEW public.v_ordenes_completas AS
SELECT
  o.*,
  c.nombre AS cliente_nombre,
  c.comision_pct AS cliente_comision_pct,
  cf.nombre AS cliente_final_nombre,
  u.nombre AS creado_por_nombre
FROM public.ordenes_trabajo o
LEFT JOIN public.clientes c ON o.cliente_id = c.id
LEFT JOIN public.clientes_finales cf ON o.cliente_final_id = cf.id
LEFT JOIN public.usuarios u ON o.created_by = u.id;

-- Vista de cotizaciones completas
CREATE OR REPLACE VIEW public.v_cotizaciones_completas AS
SELECT
  cot.*,
  o.folio AS orden_folio,
  o.estatus AS orden_estatus,
  o.descripcion AS orden_descripcion,
  o.ot_cliente AS orden_ot_cliente,
  o.direccion_obra AS orden_direccion_obra,
  c.nombre AS cliente_nombre,
  c.comision_pct AS cliente_comision_pct,
  cf.nombre AS cliente_final_nombre,
  u.nombre AS creado_por_nombre
FROM public.cotizaciones cot
LEFT JOIN public.ordenes_trabajo o ON cot.orden_id = o.id
LEFT JOIN public.clientes c ON o.cliente_id = c.id
LEFT JOIN public.clientes_finales cf ON o.cliente_final_id = cf.id
LEFT JOIN public.usuarios u ON cot.created_by = u.id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_finales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_analisis_costos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_estatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios autenticados pueden leer y escribir todo
-- (sistema interno de pocos usuarios, no multi-tenant)
CREATE POLICY "Authenticated users full access" ON public.usuarios
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.clientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.clientes_finales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.ordenes_trabajo
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.cotizaciones
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.cotizacion_partidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.cotizacion_analisis_costos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.historial_estatus
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.configuracion
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('empresa_nombre', 'Carlos Francisco González Rubio', 'Nombre de la empresa'),
  ('empresa_rfc', 'GORC711219191', 'RFC de la empresa'),
  ('empresa_direccion', '', 'Dirección de la empresa'),
  ('empresa_telefono', '', 'Teléfono de la empresa'),
  ('empresa_email', '', 'Email de la empresa'),
  ('iva_default', '16', 'IVA por defecto (%)'),
  ('vigencia_default', '30', 'Vigencia por defecto (días)'),
  ('condiciones_default', '', 'Condiciones por defecto para cotizaciones'),
  ('prefijo_ordenes', 'OT', 'Prefijo para folios de órdenes'),
  ('prefijo_cotizaciones', 'COT', 'Prefijo para folios de cotizaciones'),
  ('neodata_monto_minimo', '50000', 'Monto mínimo para requerir Neodata')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- FUNCIONES (para generar folios)
-- ============================================================

-- Genera folio para órdenes: OT-2026-0001
CREATE OR REPLACE FUNCTION public.generar_folio_orden()
RETURNS text AS $$
DECLARE
  prefijo text;
  anio text;
  siguiente integer;
BEGIN
  SELECT valor INTO prefijo FROM public.configuracion WHERE clave = 'prefijo_ordenes';
  prefijo := COALESCE(prefijo, 'OT');
  anio := EXTRACT(YEAR FROM now())::text;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(folio FROM LENGTH(prefijo) + 7) AS integer)
  ), 0) + 1
  INTO siguiente
  FROM public.ordenes_trabajo
  WHERE folio LIKE prefijo || '-' || anio || '-%';

  RETURN prefijo || '-' || anio || '-' || LPAD(siguiente::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Genera folio para cotizaciones: COT-2026-0001
CREATE OR REPLACE FUNCTION public.generar_folio_cotizacion()
RETURNS text AS $$
DECLARE
  prefijo text;
  anio text;
  siguiente integer;
BEGIN
  SELECT valor INTO prefijo FROM public.configuracion WHERE clave = 'prefijo_cotizaciones';
  prefijo := COALESCE(prefijo, 'COT');
  anio := EXTRACT(YEAR FROM now())::text;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(folio FROM LENGTH(prefijo) + 7) AS integer)
  ), 0) + 1
  INTO siguiente
  FROM public.cotizaciones
  WHERE folio LIKE prefijo || '-' || anio || '-%';

  RETURN prefijo || '-' || anio || '-' || LPAD(siguiente::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clientes_finales FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
