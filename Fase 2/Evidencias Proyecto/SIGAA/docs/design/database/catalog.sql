SELECT json_build_object(
 'postgres_version',current_setting('server_version'),
 'tables',(SELECT json_agg(t ORDER BY t.name) FROM (
  SELECT c.relname AS name,
   (SELECT json_agg(json_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'nullable',NOT a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'position',a.attnum) ORDER BY a.attnum)
    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
   COALESCE((SELECT json_agg(json_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid),'columns',(SELECT json_agg(a.attname ORDER BY x.ord) FROM unnest(k.conkey) WITH ORDINALITY x(num,ord) JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=x.num)) ORDER BY k.conname) FROM pg_constraint k WHERE k.conrelid=c.oid AND k.contype<>'f'),'[]') AS constraints,
   COALESCE((SELECT json_agg(json_build_object('name',ic.relname,'unique',i.indisunique,'primary',i.indisprimary,'predicate',pg_get_expr(i.indpred,i.indrelid),'definition',pg_get_indexdef(i.indexrelid),'columns',(SELECT json_agg(a.attname ORDER BY x.ord) FROM unnest(i.indkey::smallint[]) WITH ORDINALITY x(num,ord) LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=x.num)) ORDER BY ic.relname) FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid WHERE i.indrelid=c.oid),'[]') AS indexes
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'
 ) t),
 'foreign_keys',(SELECT json_agg(f ORDER BY f.source,f.name) FROM (
  SELECT k.conname AS name,s.relname AS source,t.relname AS target,pg_get_constraintdef(k.oid) AS definition,
   (SELECT json_agg(a.attname ORDER BY x.ord) FROM unnest(k.conkey) WITH ORDINALITY x(num,ord) JOIN pg_attribute a ON a.attrelid=s.oid AND a.attnum=x.num) AS source_columns,
   (SELECT json_agg(a.attname ORDER BY x.ord) FROM unnest(k.confkey) WITH ORDINALITY x(num,ord) JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=x.num) AS target_columns,
   k.confdeltype AS on_delete,k.confupdtype AS on_update
  FROM pg_constraint k JOIN pg_class s ON s.oid=k.conrelid JOIN pg_class t ON t.oid=k.confrelid JOIN pg_namespace n ON n.oid=s.relnamespace
  WHERE k.contype='f' AND n.nspname='public'
 ) f),
 'views',(SELECT COALESCE(json_agg(c.relname ORDER BY c.relname),'[]') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v')
);
