-- Add fictional staff records without passwords or course assignments.
-- Existing login credentials and academic responsibilities are preserved.
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(20261029);
CREATE TEMP TABLE staff_accounts_before ON COMMIT DROP AS SELECT id,email,password_hash FROM usuario;
CREATE TEMP TABLE staff_catalog(nombres text,apellidos text,email text) ON COMMIT DROP;
INSERT INTO staff_catalog VALUES
 ('Camila Antonia','Paredes Muñoz','camila.paredes@sigaa.invalid'),
 ('Diego Alejandro','Salazar Rojas','diego.salazar@sigaa.invalid'),
 ('Francisca Belén','Navarro Soto','francisca.navarro@sigaa.invalid'),
 ('Nicolás Esteban','Contreras Vega','nicolas.contreras@sigaa.invalid'),
 ('Daniela Paz','Morales Herrera','daniela.morales@sigaa.invalid'),
 ('Tomás Javier','Sepúlveda Castro','tomas.sepulveda@sigaa.invalid'),
 ('Javiera Constanza','Aguilera Díaz','javiera.aguilera@sigaa.invalid'),
 ('Felipe Eduardo','Arancibia Silva','felipe.arancibia@sigaa.invalid');
DO $$ DECLARE x record; uid uuid; fid uuid; BEGIN
 FOR x IN SELECT * FROM (VALUES
 ('cd95ae7f-4c21-4825-8d13-f346c4b6b93a'::uuid,'Matías Andrés','Valdés Riquelme'),
 ('93476cfd-1745-53f9-a992-6ee1f56b6087'::uuid,'Valentina Isabel','Torres Medina'),
 ('bb06df3a-082e-538e-ad39-b78df429584c'::uuid,'Sebastián Ignacio','Ríos Carrasco'),
 ('82523daa-ec43-560d-a5b2-63d0018e8056'::uuid,'Catalina Fernanda','Fuentes Lagos')
 ) AS existing(id,nombres,apellidos) LOOP
  UPDATE usuario SET nombre=x.nombres||' '||x.apellidos WHERE id=x.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expected existing teacher missing'; END IF;
  UPDATE funcionario SET nombres=x.nombres,apellidos=x.apellidos WHERE usuario_id=x.id;
 END LOOP;
 FOR x IN SELECT * FROM staff_catalog LOOP
  uid:=md5('SIGAA-STAFF-2026-10:user:'||x.email)::uuid;
  fid:=md5('SIGAA-STAFF-2026-10:staff:'||x.email)::uuid;
  INSERT INTO usuario(id,email,nombre,password_hash) VALUES(uid,x.email,x.nombres||' '||x.apellidos,NULL) ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM usuario WHERE id=uid AND email=x.email AND nombre=x.nombres||' '||x.apellidos) THEN RAISE EXCEPTION 'Existing record differs'; END IF;
  INSERT INTO usuario_rol(id,usuario_id,rol_id) SELECT md5('SIGAA-STAFF-2026-10:role:'||x.email)::uuid,uid,id FROM rol WHERE codigo='PROFESOR_ASIGNATURA' ON CONFLICT DO NOTHING;
  INSERT INTO funcionario(id,usuario_id,nombres,apellidos,email_institucional) VALUES(fid,uid,x.nombres,x.apellidos,x.email) ON CONFLICT(id) DO NOTHING;
 END LOOP;
 IF EXISTS(SELECT 1 FROM staff_accounts_before b LEFT JOIN usuario u ON u.id=b.id WHERE u.id IS NULL OR u.email IS DISTINCT FROM b.email OR u.password_hash IS DISTINCT FROM b.password_hash) THEN RAISE EXCEPTION 'Existing account credentials changed'; END IF;
END $$;
INSERT INTO evento_auditoria(id,accion,entidad,valor_nuevo,motivo,origen)
VALUES(md5('SIGAA-STAFF-2026-10:audit')::uuid,'expand_synthetic_staff','funcionario','{"synthetic":true,"newStaff":8,"existingNamesCompleted":4,"newLoginCredentials":false}'::jsonb,'Ampliación autorizada del catálogo de docentes con nombres ficticios completos.','maintenance') ON CONFLICT(id) DO NOTHING;
SELECT json_build_object('operation','expand_fictional_teacher_catalog','teachers',(SELECT json_agg(t) FROM (SELECT u.nombre AS name,f.nombres,f.apellidos,(u.password_hash IS NOT NULL) AS loginEnabled,count(a.id) AS assignments FROM usuario u JOIN funcionario f ON f.usuario_id=u.id LEFT JOIN asignacion_docente a ON a.funcionario_id=f.id WHERE EXISTS(SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id=ur.rol_id WHERE ur.usuario_id=u.id AND r.codigo='PROFESOR_ASIGNATURA') GROUP BY u.id,f.id ORDER BY u.nombre)t),'existingCredentialsPreserved',true,'newPasswordsCreated',false,'newAssignmentsCreated',false,'result','passed');
COMMIT;
