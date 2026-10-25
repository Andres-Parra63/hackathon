-- =====================================================================
-- Manos en Red · Datos de ejemplo (ficticios) que reproducen el prototipo
-- de Figma: Fundación Red Solidaria, Ana Rojas (coordinación), Camila
-- (voluntaria MR-4821), centro de acopio en Chapinero y la convocatoria
-- de emergencia «4 cupos de logística» con el embudo 46 → 7 → 5.
-- Ningún dato corresponde a personas reales.
-- =====================================================================
SET search_path = mer, public;

-- Catálogo de habilidades -----------------------------------------------
INSERT INTO habilidades (nombre, categoria, requiere_certificado, descripcion) VALUES
  ('Logística',          'logistica',    false, 'Clasificar, empacar y despachar ayudas'),
  ('Salud',              'salud',        true,  'Profesionales de la salud con tarjeta profesional'),
  ('Primeros auxilios',  'salud',        true,  'Curso de primeros auxilios vigente'),
  ('Cocina',             'alimentacion', false, 'Preparación de alimentos en comedores'),
  ('Obra',               'construccion', false, 'Apoyo en reparaciones y remoción de escombros livianos'),
  ('Idiomas',            'comunicacion', false, 'Traducción e interpretación'),
  ('Conducción',         'transporte',   true,  'Licencia de conducción vigente'),
  ('Psicosocial',        'psicosocial',  true,  'Primeros auxilios psicológicos'),
  ('Cuidado',            'cuidado',      false, 'Acompañamiento a niños, personas mayores o con discapacidad'),
  ('Apoyo general',      'general',      false, 'Tareas que no requieren experiencia');

-- Usuarios, organizaciones y emergencia ----------------------------------
DO $$
DECLARE
    v_admin   uuid;
    v_ana     uuid;
    v_org     uuid;
    v_org2    uuid;
    v_emer    uuid;
    v_punto   uuid;
    v_conv    uuid;
    v_hist1   uuid;
    v_hist2   uuid;
    v_camila  uuid;
    v_id      uuid;
    v_lat     numeric := 4.64860;      -- Centro de acopio Chapinero (Cra. 13 #60-20, aprox.)
    v_lon     numeric := -74.06340;
    v_hash    text := crypt('demo-no-usar', gen_salt('bf', 6));
    r_km      numeric;
    ang       numeric;
    hab_log   smallint := (SELECT id FROM habilidades WHERE nombre = 'Logística');
    hab_otras smallint[] := ARRAY(SELECT id FROM habilidades WHERE nombre IN ('Cocina','Idiomas','Cuidado','Obra','Apoyo general') ORDER BY id);
    alias_t   text[] := ARRAY['A12','B07','C33','D19','E05'];
    vol_ids   uuid[] := '{}';
    p_id      bigint;
BEGIN
    -- Administrador de la plataforma
    INSERT INTO usuarios (nombre, correo, hash_contrasena, rol)
    VALUES ('Equipo Manos en Red', 'admin@manosenred.demo', v_hash, 'administrador') RETURNING id INTO v_admin;

    -- Coordinadora y organización verificada
    INSERT INTO usuarios (nombre, correo, telefono, hash_contrasena, rol)
    VALUES ('Ana Rojas', 'coordinacion@redsolidaria.demo', '601 555 0101', v_hash, 'organizacion') RETURNING id INTO v_ana;
    INSERT INTO consentimientos (usuario_id, version_politica, finalidades)
    VALUES (v_ana, '2026-10', '{gestion_organizacion}');

    INSERT INTO organizaciones (nombre, nit, tipo, estado_verificacion, verificada_por, verificada_en,
                                correo, telefono, barrio, municipio, codigo_divipola, lat, lon)
    VALUES ('Fundación Red Solidaria', '900123456-7', 'fundacion', 'verificada', v_admin, now() - interval '30 days',
            'coordinacion@redsolidaria.demo', '601 555 0100', 'Chapinero', 'Bogotá, D.C.', '11001', v_lat, v_lon)
    RETURNING id INTO v_org;
    INSERT INTO organizacion_miembros VALUES (v_org, v_ana, 'administrador');

    -- Organización aún sin verificar (sirve para probar las reglas)
    INSERT INTO organizaciones (nombre, nit, tipo, correo, municipio, codigo_divipola)
    VALUES ('Colectivo Barrio Activo', '901987654-3', 'junta_accion_comunal', 'contacto@barrioactivo.demo',
            'Bogotá, D.C.', '11001')
    RETURNING id INTO v_org2;

    -- 46 voluntarios a menos de 5 km del centro de acopio ------------------
    FOR i IN 1..46 LOOP
        r_km := 0.4 + (i % 10) * 0.4;                       -- entre 0,4 y 4,0 km
        ang  := radians(i * 137.5);
        INSERT INTO usuarios (nombre, correo, telefono, hash_contrasena, rol)
        VALUES (CASE WHEN i = 2 THEN 'Camila Ruiz' ELSE 'Voluntario de prueba ' || i END,
                CASE WHEN i = 2 THEN 'camila@correo.demo' ELSE 'voluntario' || i || '@correo.demo' END,
                '300 000 ' || lpad(i::text, 4, '0'), v_hash, 'voluntario')
        RETURNING id INTO v_id;
        IF i = 2 THEN v_camila := v_id; END IF;
        vol_ids := vol_ids || v_id;

        INSERT INTO voluntarios (usuario_id, codigo, barrio, municipio, codigo_divipola, lat_aprox, lon_aprox)
        VALUES (v_id, CASE WHEN i = 2 THEN 'MR-4821' ELSE 'MR-' || (1000 + i) END,
                (ARRAY['Chapinero','Teusaquillo','Barrios Unidos','La Candelaria','Usaquén'])[1 + i % 5],
                'Bogotá, D.C.', '11001',
                round((v_lat + (r_km / 111.32) * sin(ang))::numeric, 2),
                round((v_lon + (r_km / (111.32 * cos(radians(v_lat)))) * cos(ang))::numeric, 2));

        INSERT INTO consentimientos (usuario_id, version_politica, finalidades)
        VALUES (v_id, '2026-10', '{convocatorias,emergencias,historial_horas}');

        IF i <= 7 THEN
            -- 7 voluntarios con la habilidad de logística
            INSERT INTO voluntario_habilidades (voluntario_id, habilidad_id) VALUES (v_id, hab_log);
            IF i <= 5 THEN
                -- 5 disponibles el sábado en la tarde (franja de la convocatoria)
                INSERT INTO disponibilidades VALUES (v_id, 6, 'manana'), (v_id, 6, 'tarde'), (v_id, 7, 'manana');
            ELSE
                INSERT INTO disponibilidades VALUES (v_id, 7, 'manana');
            END IF;
        ELSE
            -- 39 con otras habilidades
            INSERT INTO voluntario_habilidades (voluntario_id, habilidad_id)
            VALUES (v_id, hab_otras[1 + i % array_length(hab_otras, 1)]);
            INSERT INTO disponibilidades VALUES (v_id, 1 + i % 7, (ARRAY['manana','tarde','noche'])[1 + i % 3]::franja_horaria);
        END IF;
    END LOOP;

    -- Camila también sabe de cuidado
    INSERT INTO voluntario_habilidades (voluntario_id, habilidad_id)
    VALUES (v_camila, (SELECT id FROM habilidades WHERE nombre = 'Cuidado'));

    -- 6 voluntarios fuera del radio (entre 8 y 13 km): no deben aparecer
    FOR i IN 47..52 LOOP
        r_km := 8 + (i - 47);
        ang  := radians(i * 61);
        INSERT INTO usuarios (nombre, correo, hash_contrasena, rol)
        VALUES ('Voluntario lejano ' || i, 'lejano' || i || '@correo.demo', v_hash, 'voluntario') RETURNING id INTO v_id;
        INSERT INTO voluntarios (usuario_id, codigo, barrio, municipio, lat_aprox, lon_aprox)
        VALUES (v_id, 'MR-' || (1000 + i), 'Suba', 'Bogotá, D.C.',
                round((v_lat + (r_km / 111.32) * sin(ang))::numeric, 2),
                round((v_lon + (r_km / (111.32 * cos(radians(v_lat)))) * cos(ang))::numeric, 2));
        INSERT INTO voluntario_habilidades VALUES (v_id, hab_log, false);
        INSERT INTO disponibilidades VALUES (v_id, 6, 'tarde');
        INSERT INTO consentimientos (usuario_id, version_politica, finalidades)
        VALUES (v_id, '2026-10', '{convocatorias,emergencias}');
    END LOOP;

    -- Historial de Camila: 3 turnos cumplidos de 4 horas = 12 horas ----------
    FOR i IN 1..3 LOOP
        INSERT INTO convocatorias (organizacion_id, creada_por, titulo, lat, lon, inicio, fin, cupos, estado)
        VALUES (v_org, v_ana, 'Clasificación de donaciones #' || i, v_lat, v_lon,
                timestamptz '2026-09-05 08:00-05' + (i - 1) * interval '7 days',
                timestamptz '2026-09-05 12:00-05' + (i - 1) * interval '7 days', 10, 'publicada')
        RETURNING id INTO v_hist1;
        INSERT INTO convocatoria_habilidades VALUES (v_hist1, hab_log);
        INSERT INTO participaciones (convocatoria_id, voluntario_id, alias, origen, estado, notificado_en, respondido_en)
        VALUES (v_hist1, v_camila, 'K' || lpad((10 + i)::text, 2, '0'), 'postulacion', 'confirmado',
                timestamptz '2026-09-01 10:00-05', timestamptz '2026-09-01 10:05-05')
        RETURNING id INTO p_id;
        INSERT INTO asistencias (participacion_id, check_in, check_out, registrado_por)
        VALUES (p_id, timestamptz '2026-09-05 08:00-05' + (i - 1) * interval '7 days',
                      timestamptz '2026-09-05 12:00-05' + (i - 1) * interval '7 days', v_ana);
        UPDATE convocatorias SET estado = 'cerrada' WHERE id = v_hist1;
    END LOOP;

    -- Historial reciente del panel: «Salud · 2 cupos» (cubierta) y «Psicosocial · 1 cupo» (cerrada)
    INSERT INTO convocatorias (organizacion_id, creada_por, titulo, lat, lon, inicio, fin, cupos, estado)
    VALUES (v_org, v_ana, 'Jornada de salud en albergue', v_lat, v_lon,
            timestamptz '2026-10-23 08:00-05', timestamptz '2026-10-23 14:00-05', 2, 'publicada') RETURNING id INTO v_hist1;
    INSERT INTO convocatoria_habilidades VALUES (v_hist1, (SELECT id FROM habilidades WHERE nombre = 'Salud'));
    INSERT INTO convocatorias (organizacion_id, creada_por, titulo, lat, lon, inicio, fin, cupos, estado)
    VALUES (v_org, v_ana, 'Acompañamiento psicosocial', v_lat, v_lon,
            timestamptz '2026-10-20 09:00-05', timestamptz '2026-10-20 13:00-05', 1, 'publicada') RETURNING id INTO v_hist2;
    INSERT INTO convocatoria_habilidades VALUES (v_hist2, (SELECT id FROM habilidades WHERE nombre = 'Psicosocial'));
    UPDATE convocatorias SET estado = 'cubierta' WHERE id = v_hist1;
    UPDATE convocatorias SET estado = 'cerrada'  WHERE id = v_hist2;

    -- Modo Emergencia: solicitud, doble confirmación y punto de operación -----
    INSERT INTO emergencias (tipo, titulo, descripcion, centro_lat, centro_lon, radio_km, municipio, solicitada_por)
    VALUES ('sismo', 'Recepción de ayudas por emergencia sísmica (demostración)',
            'Se necesita apoyo para clasificar y despachar ayudas humanitarias.',
            v_lat, v_lon, 5, 'Bogotá, D.C.', v_org)
    RETURNING id INTO v_emer;
    UPDATE emergencias SET estado = 'activa', confirmada_por = v_admin,
                           activada_en = timestamptz '2026-10-24 10:24-05'
     WHERE id = v_emer;

    INSERT INTO puntos_operacion (emergencia_id, organizacion_id, tipo, nombre, direccion, lat, lon, horario)
    VALUES (v_emer, v_org, 'centro_acopio', 'Centro de acopio Chapinero', 'Cra. 13 #60-20', v_lat, v_lon,
            'Abierto 8 a. m.–8 p. m.')
    RETURNING id INTO v_punto;

    INSERT INTO convocatorias (organizacion_id, creada_por, tipo, emergencia_id, punto_operacion_id, titulo,
                               indicaciones, direccion, lat, lon, radio_km, inicio, fin, cupos, estado, publicada_en)
    VALUES (v_org, v_ana, 'desastre', v_emer, v_punto, '4 cupos de logística · Centro de acopio Chapinero',
            'Presentarse en el centro de acopio, entrada principal. Traer documento y botas.',
            'Cra. 13 #60-20', v_lat, v_lon, 5,
            timestamptz '2026-10-24 14:00-05', timestamptz '2026-10-24 18:00-05', 4, 'publicada',
            timestamptz '2026-10-24 10:24-05')
    RETURNING id INTO v_conv;
    INSERT INTO convocatoria_habilidades VALUES (v_conv, hab_log);

    -- 5 voluntarios convocados y sus respuestas (pantalla W06 / O06)
    FOR i IN 1..5 LOOP
        INSERT INTO participaciones (convocatoria_id, voluntario_id, alias, origen, distancia_km, notificado_en)
        SELECT v_conv, vol_ids[i], alias_t[i], 'convocatoria', ca.distancia_km, timestamptz '2026-10-24 10:24-05'
          FROM candidatos_convocatoria(v_conv) ca WHERE ca.voluntario_id = vol_ids[i];
        INSERT INTO notificaciones (usuario_id, convocatoria_id, canal, estado, titulo, cuerpo, enviada_en)
        VALUES (vol_ids[i], v_conv, 'push', 'enviada', 'Emergencia: se necesita logística cerca de ti',
                'Centro de acopio Chapinero. Toca para ver el turno y responder.', timestamptz '2026-10-24 10:24:02-05');
    END LOOP;
    UPDATE participaciones SET estado = 'en_camino',  respondido_en = '2026-10-24 10:31-05', detalle = 'Llega en ~10 min'
     WHERE convocatoria_id = v_conv AND alias = 'A12';
    UPDATE participaciones SET estado = 'confirmado', respondido_en = '2026-10-24 10:31-05', detalle = 'Llega a las 2:00 p. m.'
     WHERE convocatoria_id = v_conv AND alias = 'B07';
    UPDATE participaciones SET estado = 'confirmado', respondido_en = '2026-10-24 10:35-05', detalle = 'Irá en la tarde'
     WHERE convocatoria_id = v_conv AND alias = 'C33';
    UPDATE participaciones SET estado = 'no_puede',   respondido_en = '2026-10-24 10:29-05', detalle = 'Respondió «No puedo ahora»'
     WHERE convocatoria_id = v_conv AND alias = 'D19';
    UPDATE participaciones SET detalle = 'Avisado por push'
     WHERE convocatoria_id = v_conv AND alias = 'E05';
END $$;
