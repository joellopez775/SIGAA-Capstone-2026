-- Remove presentation labels only. Preserve identifiers, synthetic metadata and audit history.
-- Execute through an authorized database administrator after taking a backup.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(20261029);
CREATE TEMP TABLE cleaned_labels(tabla text,columna text,cantidad bigint) ON COMMIT DROP;
DO $$
DECLARE c record; n bigint; before_count bigint; after_count bigint;
BEGIN
FOR c IN SELECT * FROM (VALUES
 ('alerta','titulo'),('anotacion_estudiante','categoria'),('anotacion_estudiante','detalle'),
 ('asignatura','nombre'),('asistencia','observacion'),('comunicacion_estudiante','titulo'),
 ('estudiante_apoderado','parentesco'),('evaluacion','nombre'),('funcionario','apellidos'),
 ('intervencion','nota'),('justificacion_ausencia','motivo'),('justificacion_ausencia','observacion_revision'),
 ('nivel_educativo','nombre'),('sesion_clase','titulo'),('usuario','nombre')
) AS fields(tabla,columna) LOOP
 EXECUTE format('SELECT count(*) FROM %I',c.tabla) INTO before_count;
 EXECUTE format('UPDATE %I SET %I=btrim(regexp_replace(%I,%L,%L,%L)) WHERE %I ~* %L',
  c.tabla,c.columna,c.columna,'[ \t]*(\[DEMOS?\]|\(DEMOS?\))[ \t]*',' ','gi',c.columna,'\[DEMOS?\]|\(DEMOS?\)');
 GET DIAGNOSTICS n=ROW_COUNT;
 INSERT INTO cleaned_labels VALUES(c.tabla,c.columna,n);
 EXECUTE format('SELECT count(*) FROM %I',c.tabla) INTO after_count;
 IF before_count<>after_count THEN RAISE EXCEPTION 'Row count changed'; END IF;
 EXECUTE format('SELECT count(*) FROM %I WHERE %I ~* %L',c.tabla,c.columna,'\[DEMOS?\]|\(DEMOS?\)') INTO n;
 IF n<>0 THEN RAISE EXCEPTION 'Labels remain'; END IF;
END LOOP;
UPDATE alerta SET evidencia=jsonb_set(evidencia,'{explanation}',to_jsonb(btrim(regexp_replace(evidencia->>'explanation','[ \t]*(\[DEMOS?\]|\(DEMOS?\))[ \t]*',' ','gi'))))
 WHERE evidencia->>'explanation' ~* '\[DEMOS?\]|\(DEMOS?\)';
GET DIAGNOSTICS n=ROW_COUNT;
INSERT INTO cleaned_labels VALUES('alerta','evidencia.explanation',n);
END $$;
SELECT json_build_object('operation','remove_demo_display_labels','columns',json_agg(t),'updatedTextValues',sum(cantidad),'rowsDeleted',0,'identifiersChanged',false,'credentialsChanged',false,'syntheticMetadataPreserved',true,'result','passed') FROM cleaned_labels t;
COMMIT;
