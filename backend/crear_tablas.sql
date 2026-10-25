-- =====================================================================
-- Manos en Red · Script completo para crear la base de datos
-- Copia y ejecuta todo este archivo en una base vacía (por ejemplo
-- «manosenred») desde pgAdmin (Query Tool) o con:
--   psql -U postgres -d manosenred -f manos_en_red_crear_tablas.sql
-- Crea: extensiones, esquema «mer», 16 tablas, índices, reglas de
-- negocio (triggers), funciones de emparejamiento y vistas.
-- Todo corre en una transacción: si algo falla, no queda nada a medias.
-- Requiere un usuario con permiso para crear extensiones (p. ej. postgres).
-- =====================================================================
BEGIN;

-- =====================================================================
-- Manos en Red · Esquema de base de datos
-- PostgreSQL 16 · extensiones incluidas en PostgreSQL (contrib):
--   pgcrypto (UUID), citext (correos sin distinción de mayúsculas),
--   cube + earthdistance (búsquedas por radio en km)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE SCHEMA IF NOT EXISTS mer;
SET search_path = mer, public;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------
CREATE TYPE rol_usuario          AS ENUM ('voluntario', 'organizacion', 'administrador');
CREATE TYPE rol_miembro          AS ENUM ('administrador', 'coordinador');
CREATE TYPE tipo_organizacion    AS ENUM ('fundacion', 'odv', 'junta_accion_comunal', 'entidad_publica',
                                          'organismo_socorro', 'empresa', 'universidad', 'otra');
CREATE TYPE estado_verificacion  AS ENUM ('pendiente', 'verificada', 'rechazada');
CREATE TYPE categoria_habilidad  AS ENUM ('salud', 'logistica', 'construccion', 'psicosocial',
                                          'alimentacion', 'transporte', 'comunicacion', 'cuidado', 'general');
CREATE TYPE franja_horaria       AS ENUM ('manana', 'tarde', 'noche');
CREATE TYPE tipo_emergencia      AS ENUM ('inundacion', 'sismo', 'tormenta', 'deslizamiento', 'incendio', 'otra');
CREATE TYPE estado_emergencia    AS ENUM ('por_confirmar', 'activa', 'cerrada', 'rechazada');
CREATE TYPE tipo_punto           AS ENUM ('centro_acopio', 'albergue', 'banco_sangre', 'comedor',
                                          'puesto_salud', 'otro');
CREATE TYPE tipo_convocatoria    AS ENUM ('normal', 'prioritaria', 'desastre');
CREATE TYPE estado_convocatoria  AS ENUM ('borrador', 'publicada', 'cubierta', 'cerrada', 'cancelada');
CREATE TYPE origen_participacion AS ENUM ('postulacion', 'invitacion', 'convocatoria');
CREATE TYPE estado_participacion AS ENUM ('pendiente', 'confirmado', 'en_camino', 'no_puede',
                                          'rechazado', 'cancelado');
CREATE TYPE canal_notificacion   AS ENUM ('push', 'correo', 'sms');
CREATE TYPE estado_notificacion  AS ENUM ('encolada', 'enviada', 'fallida', 'leida');

-- ---------------------------------------------------------------------
-- Usuarios y consentimiento (Ley 1581 de 2012)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre           text        NOT NULL CHECK (length(trim(nombre)) > 0),
    correo           citext      NOT NULL UNIQUE,
    telefono         text        CHECK (telefono ~ '^[0-9 +()-]{7,20}$'),
    hash_contrasena  text        NOT NULL,
    rol              rol_usuario NOT NULL,
    activo           boolean     NOT NULL DEFAULT true,
    anonimizado_en   timestamptz,               -- cuenta inactiva anonimizada (retención 24 meses)
    ultimo_acceso    timestamptz,
    creado_en        timestamptz NOT NULL DEFAULT now(),
    actualizado_en   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE usuarios IS 'Cuentas de acceso. Un usuario es voluntario, miembro de organización o administrador.';

CREATE TABLE consentimientos (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    version_politica text        NOT NULL,
    finalidades      text[]      NOT NULL,       -- p. ej. {convocatorias, emergencias, historial_horas}
    otorgado_en      timestamptz NOT NULL DEFAULT now(),
    revocado_en      timestamptz,
    CHECK (revocado_en IS NULL OR revocado_en >= otorgado_en),
    CHECK (cardinality(finalidades) > 0)
);
COMMENT ON TABLE consentimientos IS 'Autorización previa, expresa e informada (Ley 1581/2012, Decreto 1377/2013). Se conserva el historial.';
CREATE UNIQUE INDEX consentimiento_vigente_uk ON consentimientos (usuario_id) WHERE revocado_en IS NULL;

-- ---------------------------------------------------------------------
-- Catálogo de habilidades
-- ---------------------------------------------------------------------
CREATE TABLE habilidades (
    id                   smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               text                NOT NULL UNIQUE,
    categoria            categoria_habilidad NOT NULL,
    requiere_certificado boolean             NOT NULL DEFAULT false,
    descripcion          text
);

-- ---------------------------------------------------------------------
-- Voluntarios
-- La ubicación se guarda SOLO aproximada: numeric(5,2) redondea a ~1,1 km.
-- Nunca se almacena la dirección exacta (RNF-06).
-- ---------------------------------------------------------------------
CREATE TABLE voluntarios (
    usuario_id            uuid PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo                text         NOT NULL UNIQUE CHECK (codigo ~ '^MR-[0-9]{4,6}$'),
    barrio                text         NOT NULL,
    municipio             text         NOT NULL,
    codigo_divipola       char(5),                 -- código DANE del municipio
    lat_aprox             numeric(5,2) NOT NULL CHECK (lat_aprox BETWEEN -90 AND 90),
    lon_aprox             numeric(5,2) NOT NULL CHECK (lon_aprox BETWEEN -180 AND 180),
    radio_km              numeric(4,1) NOT NULL DEFAULT 5 CHECK (radio_km BETWEEN 1 AND 50),
    recibir_convocatorias boolean      NOT NULL DEFAULT true,
    acepta_emergencias    boolean      NOT NULL DEFAULT true,
    solo_emergencias      boolean      NOT NULL DEFAULT false,   -- opción «Solo en emergencias»
    creado_en             timestamptz  NOT NULL DEFAULT now(),
    actualizado_en        timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX voluntarios_ubicacion_gist ON voluntarios
    USING gist (ll_to_earth(lat_aprox::float8, lon_aprox::float8));

CREATE TABLE voluntario_habilidades (
    voluntario_id          uuid     NOT NULL REFERENCES voluntarios(usuario_id) ON DELETE CASCADE,
    habilidad_id           smallint NOT NULL REFERENCES habilidades(id),
    certificado_verificado boolean  NOT NULL DEFAULT false,
    PRIMARY KEY (voluntario_id, habilidad_id)
);
CREATE INDEX voluntario_habilidades_hab_idx ON voluntario_habilidades (habilidad_id);

CREATE TABLE disponibilidades (
    voluntario_id uuid           NOT NULL REFERENCES voluntarios(usuario_id) ON DELETE CASCADE,
    dia_semana    smallint       NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),  -- ISO: 1 = lunes … 7 = domingo
    franja        franja_horaria NOT NULL,
    PRIMARY KEY (voluntario_id, dia_semana, franja)
);

-- ---------------------------------------------------------------------
-- Organizaciones y sus miembros
-- ---------------------------------------------------------------------
CREATE TABLE organizaciones (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              text                NOT NULL,
    nit                 text                NOT NULL UNIQUE CHECK (nit ~ '^[0-9]{6,12}-?[0-9]?$'),
    tipo                tipo_organizacion   NOT NULL,
    estado_verificacion estado_verificacion NOT NULL DEFAULT 'pendiente',
    verificada_por      uuid REFERENCES usuarios(id),
    verificada_en       timestamptz,
    correo              citext              NOT NULL,
    telefono            text,
    barrio              text,
    municipio           text                NOT NULL,
    codigo_divipola     char(5),
    lat                 numeric(8,5)        CHECK (lat BETWEEN -90 AND 90),
    lon                 numeric(8,5)        CHECK (lon BETWEEN -180 AND 180),
    creado_en           timestamptz         NOT NULL DEFAULT now(),
    actualizado_en      timestamptz         NOT NULL DEFAULT now(),
    CHECK (estado_verificacion <> 'verificada' OR (verificada_por IS NOT NULL AND verificada_en IS NOT NULL))
);

CREATE TABLE organizacion_miembros (
    organizacion_id uuid        NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id      uuid        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol             rol_miembro NOT NULL DEFAULT 'coordinador',
    creado_en       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (organizacion_id, usuario_id)
);

-- ---------------------------------------------------------------------
-- Modo Emergencia: emergencias y puntos de operación
-- La zona es un centro + radio en km («Radio 5 km» en el panel).
-- ---------------------------------------------------------------------
CREATE TABLE emergencias (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo            tipo_emergencia   NOT NULL,
    titulo          text              NOT NULL,
    descripcion     text,
    centro_lat      numeric(8,5)      NOT NULL CHECK (centro_lat BETWEEN -90 AND 90),
    centro_lon      numeric(8,5)      NOT NULL CHECK (centro_lon BETWEEN -180 AND 180),
    radio_km        numeric(5,1)      NOT NULL DEFAULT 5 CHECK (radio_km BETWEEN 0.5 AND 200),
    municipio       text              NOT NULL,
    estado          estado_emergencia NOT NULL DEFAULT 'por_confirmar',
    solicitada_por  uuid              NOT NULL REFERENCES organizaciones(id),
    solicitada_en   timestamptz       NOT NULL DEFAULT now(),
    confirmada_por  uuid              REFERENCES usuarios(id),   -- doble confirmación (decisión de diseño 6.6)
    activada_en     timestamptz,
    cerrada_en      timestamptz,
    CHECK (estado NOT IN ('activa', 'cerrada') OR (confirmada_por IS NOT NULL AND activada_en IS NOT NULL)),
    CHECK (estado <> 'cerrada' OR cerrada_en IS NOT NULL)
);
CREATE INDEX emergencias_estado_idx ON emergencias (estado) WHERE estado IN ('por_confirmar', 'activa');

CREATE TABLE puntos_operacion (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emergencia_id   uuid         REFERENCES emergencias(id) ON DELETE CASCADE,   -- NULL: punto permanente
    organizacion_id uuid         NOT NULL REFERENCES organizaciones(id),
    tipo            tipo_punto   NOT NULL,
    nombre          text         NOT NULL,
    direccion       text         NOT NULL,               -- dirección pública del punto (no de personas)
    lat             numeric(8,5) NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon             numeric(8,5) NOT NULL CHECK (lon BETWEEN -180 AND 180),
    horario         text,                                -- «Abierto 8 a. m.–8 p. m.»
    publico         boolean      NOT NULL DEFAULT true,  -- visible en el mapa ciudadano (RF-09)
    activo          boolean      NOT NULL DEFAULT true,
    creado_en       timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX puntos_operacion_ubicacion_gist ON puntos_operacion
    USING gist (ll_to_earth(lat::float8, lon::float8)) WHERE activo;

-- ---------------------------------------------------------------------
-- Convocatorias: actividades normales y turnos de emergencia
-- ---------------------------------------------------------------------
CREATE TABLE convocatorias (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id    uuid                NOT NULL REFERENCES organizaciones(id),
    creada_por         uuid                NOT NULL REFERENCES usuarios(id),
    tipo               tipo_convocatoria   NOT NULL DEFAULT 'normal',
    emergencia_id      uuid                REFERENCES emergencias(id),
    punto_operacion_id uuid                REFERENCES puntos_operacion(id),
    titulo             text                NOT NULL,
    descripcion        text,
    indicaciones       text,                -- «Traer documento y botas»
    direccion          text,
    lat                numeric(8,5)        NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon                numeric(8,5)        NOT NULL CHECK (lon BETWEEN -180 AND 180),
    radio_km           numeric(4,1)        NOT NULL DEFAULT 5 CHECK (radio_km BETWEEN 0.5 AND 50),
    inicio             timestamptz         NOT NULL,
    fin                timestamptz         NOT NULL,
    cupos              smallint            NOT NULL CHECK (cupos > 0),
    estado             estado_convocatoria NOT NULL DEFAULT 'borrador',
    publicada_en       timestamptz,
    creado_en          timestamptz         NOT NULL DEFAULT now(),
    actualizado_en     timestamptz         NOT NULL DEFAULT now(),
    CHECK (fin > inicio),
    CHECK (tipo <> 'desastre' OR emergencia_id IS NOT NULL),
    CHECK (estado = 'borrador' OR publicada_en IS NOT NULL)
);
CREATE INDEX convocatorias_org_estado_idx ON convocatorias (organizacion_id, estado, inicio DESC);
CREATE INDEX convocatorias_emergencia_idx ON convocatorias (emergencia_id) WHERE emergencia_id IS NOT NULL;
CREATE INDEX convocatorias_ubicacion_gist ON convocatorias
    USING gist (ll_to_earth(lat::float8, lon::float8)) WHERE estado = 'publicada';

CREATE TABLE convocatoria_habilidades (
    convocatoria_id uuid     NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    habilidad_id    smallint NOT NULL REFERENCES habilidades(id),
    PRIMARY KEY (convocatoria_id, habilidad_id)
);

-- ---------------------------------------------------------------------
-- Participaciones: postulaciones, invitaciones y convocados en emergencia.
-- «alias» es lo que ve la organización (Voluntario #A12): no expone nombre ni teléfono.
-- ---------------------------------------------------------------------
CREATE TABLE participaciones (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    convocatoria_id uuid                 NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    voluntario_id   uuid                 NOT NULL REFERENCES voluntarios(usuario_id) ON DELETE CASCADE,
    alias           text                 NOT NULL CHECK (alias ~ '^[A-Z][0-9]{2}$'),
    origen          origen_participacion NOT NULL,
    estado          estado_participacion NOT NULL DEFAULT 'pendiente',
    puntaje         numeric(4,3)         CHECK (puntaje BETWEEN 0 AND 1),
    distancia_km    numeric(5,1),
    detalle         text,                 -- «Llega en ~10 min», «No puedo ahora»
    notificado_en   timestamptz,
    respondido_en   timestamptz,
    creado_en       timestamptz          NOT NULL DEFAULT now(),
    UNIQUE (convocatoria_id, voluntario_id),
    UNIQUE (convocatoria_id, alias),
    CHECK (estado = 'pendiente' OR respondido_en IS NOT NULL)
);
CREATE INDEX participaciones_voluntario_idx ON participaciones (voluntario_id, creado_en DESC);
CREATE INDEX participaciones_conv_estado_idx ON participaciones (convocatoria_id, estado);

CREATE TABLE asistencias (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participacion_id bigint      NOT NULL UNIQUE REFERENCES participaciones(id) ON DELETE CASCADE,
    check_in         timestamptz NOT NULL,
    check_out        timestamptz,
    registrado_por   uuid        REFERENCES usuarios(id),
    horas            numeric(5,2) GENERATED ALWAYS AS
                     (CASE WHEN check_out IS NULL THEN NULL
                           ELSE round((extract(epoch FROM (check_out - check_in)) / 3600)::numeric, 2) END) STORED,
    CHECK (check_out IS NULL OR check_out > check_in)
);

-- ---------------------------------------------------------------------
-- Notificaciones y auditoría
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id      uuid                NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    convocatoria_id uuid                REFERENCES convocatorias(id) ON DELETE CASCADE,
    canal           canal_notificacion  NOT NULL,
    estado          estado_notificacion NOT NULL DEFAULT 'encolada',
    titulo          text                NOT NULL,
    cuerpo          text                NOT NULL,
    intentos        smallint            NOT NULL DEFAULT 0,
    encolada_en     timestamptz         NOT NULL DEFAULT now(),
    enviada_en      timestamptz,
    leida_en        timestamptz
);
CREATE INDEX notificaciones_cola_idx ON notificaciones (encolada_en) WHERE estado = 'encolada';
CREATE INDEX notificaciones_usuario_idx ON notificaciones (usuario_id, encolada_en DESC);

CREATE TABLE auditoria (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla       text        NOT NULL,
    registro_id text        NOT NULL,
    accion      text        NOT NULL,
    usuario_id  uuid        REFERENCES usuarios(id),
    datos       jsonb,
    creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auditoria_registro_idx ON auditoria (tabla, registro_id, creado_en DESC);
COMMENT ON TABLE auditoria IS 'Registro de acciones sensibles: activación de emergencias, verificación de organizaciones, cambios de estado.';


-- =====================================================================
-- Manos en Red · Reglas de negocio, emparejamiento y vistas
-- =====================================================================
SET search_path = mer, public;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
CREATE FUNCTION tocar_actualizado_en() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END $$;

CREATE TRIGGER usuarios_actualizado       BEFORE UPDATE ON usuarios       FOR EACH ROW EXECUTE FUNCTION tocar_actualizado_en();
CREATE TRIGGER voluntarios_actualizado    BEFORE UPDATE ON voluntarios    FOR EACH ROW EXECUTE FUNCTION tocar_actualizado_en();
CREATE TRIGGER organizaciones_actualizado BEFORE UPDATE ON organizaciones FOR EACH ROW EXECUTE FUNCTION tocar_actualizado_en();
CREATE TRIGGER convocatorias_actualizado  BEFORE UPDATE ON convocatorias  FOR EACH ROW EXECUTE FUNCTION tocar_actualizado_en();

-- Distancia en km entre dos puntos (aproximación esférica de earthdistance).
CREATE FUNCTION distancia_km(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT round((earth_distance(ll_to_earth(lat1::float8, lon1::float8),
                                 ll_to_earth(lat2::float8, lon2::float8)) / 1000)::numeric, 1)
$$;

-- Franja horaria de un instante en hora de Colombia.
CREATE FUNCTION franja_de(t timestamptz) RETURNS franja_horaria
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT CASE
             WHEN extract(hour FROM t AT TIME ZONE 'America/Bogota') BETWEEN 6 AND 11  THEN 'manana'::franja_horaria
             WHEN extract(hour FROM t AT TIME ZONE 'America/Bogota') BETWEEN 12 AND 17 THEN 'tarde'::franja_horaria
             ELSE 'noche'::franja_horaria
           END
$$;

-- ---------------------------------------------------------------------
-- Reglas del Modo Emergencia
-- ---------------------------------------------------------------------
CREATE FUNCTION validar_emergencia() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_estado estado_verificacion;
BEGIN
    SELECT estado_verificacion INTO v_estado FROM organizaciones WHERE id = NEW.solicitada_por;
    IF v_estado IS DISTINCT FROM 'verificada' THEN
        RAISE EXCEPTION 'Solo una organización verificada puede solicitar el Modo Emergencia'
              USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.estado = 'activa' AND (TG_OP = 'INSERT' OR OLD.estado <> 'activa') THEN
        NEW.activada_en := coalesce(NEW.activada_en, now());
    END IF;
    IF NEW.estado = 'cerrada' AND (TG_OP = 'INSERT' OR OLD.estado <> 'cerrada') THEN
        NEW.cerrada_en := coalesce(NEW.cerrada_en, now());
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER emergencias_validar BEFORE INSERT OR UPDATE ON emergencias
    FOR EACH ROW EXECUTE FUNCTION validar_emergencia();

CREATE FUNCTION auditar_emergencia() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.estado IS DISTINCT FROM OLD.estado THEN
        INSERT INTO auditoria (tabla, registro_id, accion, usuario_id, datos)
        VALUES ('emergencias', NEW.id::text, 'estado:' || NEW.estado, NEW.confirmada_por,
                jsonb_build_object('tipo', NEW.tipo, 'radio_km', NEW.radio_km, 'municipio', NEW.municipio));
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER emergencias_auditar AFTER INSERT OR UPDATE ON emergencias
    FOR EACH ROW EXECUTE FUNCTION auditar_emergencia();

-- Una convocatoria solo se publica si la organización está verificada,
-- y una convocatoria de desastre solo si su emergencia está activa.
CREATE FUNCTION validar_convocatoria() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_org  estado_verificacion;
    v_emer estado_emergencia;
BEGIN
    IF NEW.estado = 'publicada' AND (TG_OP = 'INSERT' OR OLD.estado = 'borrador') THEN
        NEW.publicada_en := coalesce(NEW.publicada_en, now());
        SELECT estado_verificacion INTO v_org FROM organizaciones WHERE id = NEW.organizacion_id;
        IF v_org IS DISTINCT FROM 'verificada' THEN
            RAISE EXCEPTION 'La organización debe estar verificada para publicar convocatorias'
                  USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    IF NEW.tipo = 'desastre' AND NEW.estado = 'publicada' THEN
        SELECT estado INTO v_emer FROM emergencias WHERE id = NEW.emergencia_id;
        IF v_emer IS DISTINCT FROM 'activa' THEN
            RAISE EXCEPTION 'La emergencia asociada debe estar activa para convocar'
                  USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER convocatorias_validar BEFORE INSERT OR UPDATE ON convocatorias
    FOR EACH ROW EXECUTE FUNCTION validar_convocatoria();

-- ---------------------------------------------------------------------
-- Cupos: no se puede confirmar por encima del cupo (RF-07) y la
-- convocatoria pasa a «cubierta» al llenarse.
-- ---------------------------------------------------------------------
CREATE FUNCTION controlar_cupos() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_cupos   smallint;
    v_estado  estado_convocatoria;
    v_ocupados int;
BEGIN
    IF NEW.estado NOT IN ('confirmado', 'en_camino') THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.estado IN ('confirmado', 'en_camino') THEN
        RETURN NEW;   -- ya ocupaba cupo (p. ej. confirmado → en camino)
    END IF;

    SELECT cupos, estado INTO v_cupos, v_estado
      FROM convocatorias WHERE id = NEW.convocatoria_id FOR UPDATE;

    IF v_estado NOT IN ('publicada') THEN
        RAISE EXCEPTION 'La convocatoria no admite confirmaciones (estado %)', v_estado
              USING ERRCODE = 'check_violation';
    END IF;

    SELECT count(*) INTO v_ocupados
      FROM participaciones
     WHERE convocatoria_id = NEW.convocatoria_id
       AND estado IN ('confirmado', 'en_camino')
       AND id IS DISTINCT FROM NEW.id;

    IF v_ocupados >= v_cupos THEN
        RAISE EXCEPTION 'Convocatoria llena: % de % cupos ocupados', v_ocupados, v_cupos
              USING ERRCODE = 'check_violation', HINT = 'Ofrecer otro turno al voluntario';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER participaciones_cupos BEFORE INSERT OR UPDATE OF estado ON participaciones
    FOR EACH ROW EXECUTE FUNCTION controlar_cupos();

CREATE FUNCTION actualizar_cobertura() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_ocupados int;
BEGIN
    SELECT count(*) INTO v_ocupados FROM participaciones
     WHERE convocatoria_id = NEW.convocatoria_id AND estado IN ('confirmado', 'en_camino');

    UPDATE convocatorias c
       SET estado = CASE
                      WHEN c.estado = 'publicada' AND v_ocupados >= c.cupos THEN 'cubierta'::estado_convocatoria
                      WHEN c.estado = 'cubierta'  AND v_ocupados <  c.cupos THEN 'publicada'::estado_convocatoria
                      ELSE c.estado
                    END
     WHERE c.id = NEW.convocatoria_id
       AND c.estado IN ('publicada', 'cubierta');
    RETURN NULL;
END $$;

CREATE TRIGGER participaciones_cobertura AFTER INSERT OR UPDATE OF estado ON participaciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_cobertura();

-- ---------------------------------------------------------------------
-- Emparejamiento por reglas (sección 10.4 del documento). Sin IA.
-- puntaje = 0,4·habilidades + 0,3·cercanía + 0,2·disponibilidad + 0,1·historial
-- Filtros duros: dentro del radio, al menos una habilidad requerida,
-- acepta convocatorias (y emergencias si es desastre), cuenta activa.
-- ---------------------------------------------------------------------
CREATE FUNCTION candidatos_convocatoria(p_convocatoria uuid)
RETURNS TABLE (
    voluntario_id        uuid,
    distancia_km         numeric,
    habilidades_coinciden int,
    habilidades_requeridas int,
    disponible           boolean,
    puntaje              numeric
) LANGUAGE sql STABLE AS $$
    WITH c AS (
        SELECT cv.*, extract(isodow FROM cv.inicio AT TIME ZONE 'America/Bogota')::smallint AS dia,
               franja_de(cv.inicio) AS franja,
               (SELECT count(*) FROM convocatoria_habilidades ch WHERE ch.convocatoria_id = cv.id)::int AS n_req
          FROM convocatorias cv
         WHERE cv.id = p_convocatoria
    ),
    en_radio AS (
        SELECT v.*, distancia_km(c.lat, c.lon, v.lat_aprox, v.lon_aprox) AS dist
          FROM voluntarios v
          JOIN usuarios u ON u.id = v.usuario_id AND u.activo AND u.anonimizado_en IS NULL
          CROSS JOIN c
         WHERE ll_to_earth(v.lat_aprox::float8, v.lon_aprox::float8)
               <@ earth_box(ll_to_earth(c.lat::float8, c.lon::float8), c.radio_km::float8 * 1000)
           AND earth_distance(ll_to_earth(v.lat_aprox::float8, v.lon_aprox::float8),
                              ll_to_earth(c.lat::float8, c.lon::float8)) <= c.radio_km::float8 * 1000
           AND v.recibir_convocatorias
           AND (c.tipo =  'desastre' OR NOT v.solo_emergencias)
           AND (c.tipo <> 'desastre' OR v.acepta_emergencias)
    ),
    puntuado AS (
        SELECT r.usuario_id,
               r.dist,
               (SELECT count(*) FROM voluntario_habilidades vh
                  JOIN convocatoria_habilidades ch ON ch.habilidad_id = vh.habilidad_id
                  JOIN habilidades h ON h.id = vh.habilidad_id
                 WHERE vh.voluntario_id = r.usuario_id AND ch.convocatoria_id = c.id
                   AND (NOT h.requiere_certificado OR vh.certificado_verificado))::int AS n_ok,
               c.n_req,
               EXISTS (SELECT 1 FROM disponibilidades d
                        WHERE d.voluntario_id = r.usuario_id AND d.dia_semana = c.dia AND d.franja = c.franja)
                   OR r.solo_emergencias AND c.tipo = 'desastre' AS disp,
               (SELECT CASE WHEN count(*) = 0 THEN 0.5
                            ELSE count(a.id)::numeric / count(*) END
                  FROM participaciones p
                  JOIN convocatorias pc ON pc.id = p.convocatoria_id AND pc.fin < now()
                  LEFT JOIN asistencias a ON a.participacion_id = p.id
                 WHERE p.voluntario_id = r.usuario_id AND p.estado IN ('confirmado', 'en_camino')) AS hist,
               c.radio_km
          FROM en_radio r CROSS JOIN c
    )
    SELECT usuario_id, dist, n_ok, n_req, disp,
           round(0.4 * n_ok::numeric / greatest(n_req, 1)
               + 0.3 * greatest(0, 1 - dist / radio_km)
               + 0.2 * (CASE WHEN disp THEN 1 ELSE 0 END)
               + 0.1 * hist, 3) AS puntaje
      FROM puntuado
     WHERE n_ok >= 1
     ORDER BY disp DESC, puntaje DESC, dist ASC
$$;
COMMENT ON FUNCTION candidatos_convocatoria(uuid) IS
    'Voluntarios compatibles con una convocatoria, ordenados por puntaje explicable (RF-03).';

-- Embudo «46 a 5 km → 7 con la habilidad → 5 disponibles hoy» (pantallas W05 / O04).
CREATE FUNCTION embudo_convocatoria(p_convocatoria uuid)
RETURNS TABLE (en_radio int, con_habilidad int, disponibles int,
               excluidos_por_habilidad int, excluidos_por_horario int)
LANGUAGE sql STABLE AS $$
    WITH c AS (SELECT * FROM convocatorias WHERE id = p_convocatoria),
    radio AS (
        SELECT count(*)::int AS n
          FROM voluntarios v JOIN usuarios u ON u.id = v.usuario_id AND u.activo, c
         WHERE earth_distance(ll_to_earth(v.lat_aprox::float8, v.lon_aprox::float8),
                              ll_to_earth(c.lat::float8, c.lon::float8)) <= c.radio_km::float8 * 1000
    ),
    cand AS (SELECT count(*)::int AS hab, count(*) FILTER (WHERE disponible)::int AS disp
               FROM candidatos_convocatoria(p_convocatoria))
    SELECT radio.n, cand.hab, cand.disp, radio.n - cand.hab, cand.hab - cand.disp
      FROM radio, cand
$$;

-- Convoca a los mejores candidatos disponibles: crea participaciones con alias
-- anónimo y encola una notificación push por persona. Devuelve cuántos convocó.
CREATE FUNCTION convocar(p_convocatoria uuid, p_limite int DEFAULT NULL)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
    r       record;
    v_alias text;
    v_total int := 0;
    v_conv  convocatorias%ROWTYPE;
BEGIN
    SELECT * INTO v_conv FROM convocatorias WHERE id = p_convocatoria;
    IF v_conv.estado <> 'publicada' THEN
        RAISE EXCEPTION 'Solo se convoca para convocatorias publicadas';
    END IF;

    FOR r IN
        SELECT ca.* FROM candidatos_convocatoria(p_convocatoria) ca
         WHERE ca.disponible
           AND NOT EXISTS (SELECT 1 FROM participaciones p
                            WHERE p.convocatoria_id = p_convocatoria AND p.voluntario_id = ca.voluntario_id)
         LIMIT p_limite
    LOOP
        LOOP
            v_alias := chr(65 + floor(random() * 26)::int) || lpad(floor(random() * 100)::int::text, 2, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM participaciones
                                   WHERE convocatoria_id = p_convocatoria AND alias = v_alias);
        END LOOP;

        INSERT INTO participaciones (convocatoria_id, voluntario_id, alias, origen, puntaje, distancia_km, notificado_en)
        VALUES (p_convocatoria, r.voluntario_id, v_alias, 'convocatoria', r.puntaje, r.distancia_km, now());

        INSERT INTO notificaciones (usuario_id, convocatoria_id, canal, titulo, cuerpo)
        VALUES (r.voluntario_id, p_convocatoria, 'push',
                CASE WHEN v_conv.tipo = 'desastre' THEN 'Emergencia: se necesita tu ayuda cerca de ti'
                     ELSE 'Nueva convocatoria cerca de ti' END,
                v_conv.titulo || ' · a ' || r.distancia_km || ' km. Toca para ver el turno y responder.');
        v_total := v_total + 1;
    END LOOP;
    RETURN v_total;
END $$;

-- ---------------------------------------------------------------------
-- Vistas para el panel
-- ---------------------------------------------------------------------
CREATE VIEW v_resumen_convocatorias AS
SELECT c.id,
       c.organizacion_id,
       c.titulo,
       c.tipo,
       c.estado,
       c.inicio,
       c.radio_km,
       c.cupos,
       count(p.id)                                                       AS convocados,
       count(p.id) FILTER (WHERE p.estado IN ('confirmado', 'en_camino')) AS confirmados,
       count(p.id) FILTER (WHERE p.estado = 'no_puede')                   AS no_pueden,
       count(p.id) FILTER (WHERE p.estado = 'pendiente')                  AS sin_respuesta,
       round(100.0 * count(p.id) FILTER (WHERE p.estado IN ('confirmado', 'en_camino')) / c.cupos) AS porcentaje_cubierto
  FROM convocatorias c
  LEFT JOIN participaciones p ON p.convocatoria_id = c.id
 GROUP BY c.id;

-- Lo que la organización ve de cada voluntario convocado: alias, nunca nombre ni teléfono.
CREATE VIEW v_respuestas_convocatoria AS
SELECT p.convocatoria_id,
       'Voluntario #' || p.alias                    AS voluntario,
       string_agg(DISTINCT h.nombre, ', ')           AS habilidades,
       p.distancia_km,
       p.estado,
       coalesce(p.respondido_en, p.notificado_en)   AS hora,
       p.detalle
  FROM participaciones p
  JOIN convocatoria_habilidades ch ON ch.convocatoria_id = p.convocatoria_id
  JOIN voluntario_habilidades vh ON vh.voluntario_id = p.voluntario_id AND vh.habilidad_id = ch.habilidad_id
  JOIN habilidades h ON h.id = ch.habilidad_id
 GROUP BY p.id;

CREATE VIEW v_horas_voluntario AS
SELECT v.usuario_id,
       v.codigo,
       count(a.id)                    AS turnos_cumplidos,
       coalesce(sum(a.horas), 0)      AS horas_voluntariado
  FROM voluntarios v
  LEFT JOIN participaciones p ON p.voluntario_id = v.usuario_id
  LEFT JOIN asistencias a ON a.participacion_id = p.id AND a.check_out IS NOT NULL
 GROUP BY v.usuario_id, v.codigo;

COMMIT;
