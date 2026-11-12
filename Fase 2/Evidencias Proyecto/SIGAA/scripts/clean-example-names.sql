-- Presentation cleanup, preserving UUIDs, account credentials and academic facts.
-- Run as administrator after a private backup. Safe to repeat.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(20261029);
CREATE TEMP TABLE name_changes(tabla text,columna text,cantidad bigint) ON COMMIT DROP;
DO $$ DECLARE c record; n bigint; credentials_before text; academic_before text; BEGIN
SELECT md5(string_agg(id::text||email||coalesce(password_hash,''),'|' ORDER BY id)) INTO credentials_before FROM usuario;
SELECT md5(string_agg(row_to_json(x)::text,'|' ORDER BY x.kind,x.id)) INTO academic_before FROM (
 SELECT 'grade' kind,id,to_jsonb(g) data FROM calificacion g UNION ALL SELECT 'attendance',id,to_jsonb(a) FROM asistencia a
) x;
FOR c IN SELECT * FROM (VALUES
 ('estudiante','apellidos'),('apoderado','apellidos'),('funcionario','nombres'),('usuario','nombre'),('periodo_escolar','nombre')
) AS cols(tabla,columna) LOOP
 EXECUTE format('UPDATE %I SET %I=btrim(regexp_replace(%I,%L,%L,%L)) WHERE %I ~* %L',c.tabla,c.columna,c.columna,'[ \t]*\mDemo\M[ \t]*',' ','gi',c.columna,'\mDemo\M');
 GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES(c.tabla,c.columna,n);
END LOOP;
FOR c IN SELECT * FROM (VALUES ('estudiante','identificador_interno'),('asignatura','codigo'),('nivel_educativo','codigo'),('matricula','numero_matricula')) AS cols(tabla,columna) LOOP
 EXECUTE format('UPDATE %I SET %I=regexp_replace(%I,%L,%L) WHERE %I LIKE %L',c.tabla,c.columna,c.columna,'^DEMO-','SIGAA-',c.columna,'DEMO-%');
 GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES(c.tabla,c.columna,n);
END LOOP;
UPDATE establecimiento SET nombre='Liceo SIGAA' WHERE nombre='Liceo Demostración SIGAA';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('establecimiento','nombre',n);
UPDATE asignatura SET nombre=btrim(regexp_replace(nombre,'[ ]*\(demostración\)','','gi')) WHERE nombre ILIKE '%(demostración)%';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('asignatura','nombre',n);
UPDATE sesion_clase SET titulo=btrim(regexp_replace(titulo,'[ ]*\(demostración\)','','gi')) WHERE titulo ILIKE '%(demostración)%';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('sesion_clase','titulo',n);
UPDATE sesion_clase SET bloque=regexp_replace(bloque,'^DEMO-','BLOQUE-') WHERE bloque LIKE 'DEMO-%';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('sesion_clase','bloque',n);
UPDATE sesion_clase SET contenido=replace(contenido,'de demostración','de práctica') WHERE contenido LIKE '%de demostración%';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('sesion_clase','contenido',n);
UPDATE comunicacion_estudiante SET detalle=replace(detalle,'para demostrar el portal','para recorrer el portal') WHERE detalle LIKE '%para demostrar el portal%';GET DIAGNOSTICS n=ROW_COUNT;INSERT INTO name_changes VALUES('comunicacion_estudiante','detalle',n);
IF credentials_before<>(SELECT md5(string_agg(id::text||email||coalesce(password_hash,''),'|' ORDER BY id)) FROM usuario) THEN RAISE EXCEPTION 'Credentials changed'; END IF;
IF academic_before<>(SELECT md5(string_agg(row_to_json(x)::text,'|' ORDER BY x.kind,x.id)) FROM (SELECT 'grade' kind,id,to_jsonb(g) data FROM calificacion g UNION ALL SELECT 'attendance',id,to_jsonb(a) FROM asistencia a)x) THEN RAISE EXCEPTION 'Academic facts changed'; END IF;
END $$;
SELECT json_build_object('operation','normalize_example_display_names','changes',json_agg(t),'updatedTextValues',sum(cantidad),'credentialsPreserved',true,'gradesAndAttendancePreserved',true,'result','passed') FROM name_changes t;
COMMIT;
