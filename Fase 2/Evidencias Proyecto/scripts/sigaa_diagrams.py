"""Diagramas vectoriales de SIGAA: contenido explícito, sin imágenes generadas."""
from reportlab.platypus import Flowable, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors

GREEN = colors.HexColor('#0B3B33')
MINT = colors.HexColor('#EAF4F0')
GOLD = colors.HexColor('#BA8B21')

class Diagram(Flowable):
    def __init__(self, kind, width):
        super().__init__()
        self.kind, self.width = kind, width
        self.height = {'mindmap':440, 'impact':365, 'architecture':320, 'data':440,
                       'burn2':180, 'burn3':180, 'burn4':180}[kind]

    def box(self, x, y, w, h, title, body='', dark=False):
        c=self.canv
        c.setFillColor(GREEN if dark else MINT)
        c.setStrokeColor(colors.HexColor('#BCD2C7'))
        c.roundRect(x,y,w,h,7,fill=1,stroke=1)
        style=ParagraphStyle('box',fontName='SIGAA',fontSize=8.3,leading=11,
                             textColor=colors.white if dark else GREEN)
        p=Paragraph('<b>'+title+'</b>'+('<br/>'+body if body else ''),style)
        _, ph=p.wrap(w-18,h-12)
        if ph>h-12: raise ValueError('Diagram text overflow: '+title)
        p.drawOn(c,x+9,y+h-8-ph)

    def edge(self,x1,y1,x2,y2,label=None):
        c=self.canv;c.setStrokeColor(GOLD);c.setLineWidth(1.2);c.line(x1,y1,x2,y2)
        if label:
            c.setFont('SIGAA',7);c.setFillColor(GREEN);c.drawString((x1+x2)/2+3,(y1+y2)/2+3,label)

    def draw(self):
        w=self.width;c=self.canv
        if self.kind=='mindmap':
            mid=w/2; bw=(w-105)/2
            self.box(mid-43,196,86,55,'SIGAA','Colegios y liceos',True)
            groups=[('Usuarios','Docente, estudiante, profesor jefe<br/>UTP, Inspectoría, apoderado, dirección'),
                    ('Operación docente','Clases y asistencia<br/>Evaluaciones, notas y anotaciones'),
                    ('Gestión escolar','Establecimiento, año y cursos<br/>Asignaturas, estudiantes y matrículas'),
                    ('Portal estudiante','Consulta propia de notas y asistencia<br/>Anotaciones autorizadas y calendario'),
                    ('Alertas y seguimiento','Reglas explicables, priorización<br/>Casos, intervenciones y avisos'),
                    ('Plataforma y seguridad','React, Express, PostgreSQL y Docker<br/>HTTPS, roles, sesiones y auditoría'),
                    ('Gestión del proyecto','Scrum, Jira y GitHub<br/>Planificación, evidencias y revisión'),
                    ('Calidad','Pruebas de permisos y persistencia<br/>Validación escolar y mejora continua')]
            for i,(title,body) in enumerate(groups):
                left=i%2==0;x=0 if left else w-bw;y=350-(i//2)*108
                self.edge(mid-43 if left else mid+43,224,x+bw if left else x,y+36)
                self.box(x,y,bw,75,title,body)
        elif self.kind=='impact':
            self.box(0,310,w,48,'Objetivo','Detectar riesgo académico y coordinar apoyo con información confiable.',True)
            bw=(w-24)/3
            for j,title in enumerate(['Actor','Cambio esperado','Entrega que lo permite']):
                self.box(j*(bw+12),270,bw,30,title,dark=True)
            rows=[('Dirección / UTP','Priorizar casos y observar tendencias','Bandeja e indicadores'),
                  ('Docentes','Registrar oportunamente y comprender alertas','Notas, asistencia y reglas explicables'),
                  ('Inspectoría / orientación','Asignar acciones y conservar seguimiento','Casos, intervenciones e historial'),
                  ('Administración','Mantener contexto escolar y acceso','Cursos, matrículas y permisos')]
            for i,row in enumerate(rows):
                y=202-i*64
                for j,t in enumerate(row):
                    self.box(j*(bw+12),y,bw,52,t)
                    if j<2:self.edge(j*(bw+12)+bw,y+26,(j+1)*(bw+12),y+26)
        elif self.kind=='architecture':
            bw=(w-36)/4
            for i,(t,b) in enumerate([('Usuario','Roles escolares<br/>Administración / Inspectoría'),('Cloudflare','HTTPS público<br/>Túnel temporal'),('Web','React + Nginx<br/>Mismo origen /api'),('API','Node + Express<br/>Sesión, permisos, CSRF')]):
                self.box(i*(bw+12),215,bw,86,t,b,i==0)
                if i<3:self.edge(i*(bw+12)+bw,258,(i+1)*(bw+12),258)
            self.edge(w-bw/2,215,w-bw/2,155)
            self.box(w-bw*2-12,70,bw*2+12,85,'PostgreSQL 16','Red Docker interna, sin puerto publicado.<br/>Usuario de API limitado, transacciones y auditoría.',True)
            self.box(0,70,w-bw*2-30,85,'Límite de confianza','La interfaz no decide permisos.<br/>Solo la API accede a la base.<br/>No se entrega SSH al equipo.')
        elif self.kind=='data':
            bw=(w-30)/3
            nodes=[('usuario','email, hash, estado'),('sesion_usuario','token_hash, usuario_id, expiración'),('usuario_rol / rol','usuario_id, rol_id, vigencia'),
                   ('curso','periodo_id, nivel_id, letra'),('matricula','estudiante_id, curso_id, estado'),('estudiante','usuario_id, identificador'),
                   ('curso_asignatura','curso_id, asignatura_id'),('sesion_clase / asistencia','clase y estudiante; un registro'),('evaluacion / calificacion','evaluación y estudiante; publicación'),
                   ('asignacion_docente','funcionario_id, asignatura, permisos'),('anotacion_estudiante','estudiante, autor, visibilidad'),('evento_auditoria','actor, fecha, antes y después')]
            for i,(t,b) in enumerate(nodes):
                x=(i%3)*(bw+15);y=350-(i//3)*108
                self.box(x,y,bw,70,t,b,i<3)
            for a,b in [(0,1),(3,4),(4,5),(3,6),(6,7),(6,9)]:
                ax=(a%3)*(bw+15)+bw/2;ay=350-(a//3)*108
                bx=(b%3)*(bw+15)+bw/2;by=350-(b//3)*108+70
                if a//3==b//3:self.edge(ax+bw/2,ay+35,bx-bw/2,by-35)
                elif a%3==b%3:self.edge(ax,ay,bx,by)
            # Non-adjacent relationships route through gutters, not through cards.
            for a,b in [(0,2),(6,8)]:
                ax=(a%3)*(bw+15)+bw/2; ay=350-(a//3)*108+70
                bx=(b%3)*(bw+15)+bw/2
                self.edge(ax,ay,ax,ay+10)
                self.edge(ax,ay+10,bx,ay+10)
                self.edge(bx,ay+10,bx,ay)
            c.setFont('SIGAA',7);c.setFillColor(GREEN)
            c.drawString(0,5,'Vista resumida de relaciones. Cardinalidades e integridad se detallan en el diccionario y SQL.')
        else:
            n=int(self.kind[-1]);total={2:13,3:29,4:34}[n]
            c.setStrokeColor(colors.HexColor('#CEDBD4'));c.setFillColor(GREEN);c.setFont('SIGAA',8)
            for val in [0,total/2,total]:
                y=35+val/total*100;c.line(36,y,w-18,y);c.drawRightString(29,y-3,str(val).rstrip('0').rstrip('.') if val else '0')
            c.drawString(36,155,'Puntos pendientes de aceptación: corte verificable, no curva histórica')
            c.setFillColor(GOLD);c.circle(w-100,135,4,fill=1,stroke=0)
            c.setFillColor(GREEN);c.drawString(w-150,115,f'15-10-2026: {total} puntos')
            c.drawString(36,14,'Fechas anteriores: sin medición fiable. No se interpolan ni se inventan cierres.')

def diagram(kind,width):
    return Diagram(kind,width)
