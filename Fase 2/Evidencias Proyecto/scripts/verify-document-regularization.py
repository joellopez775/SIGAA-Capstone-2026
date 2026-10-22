"""Comprueba los PDF y produce hojas de contacto para inspección humana."""
import argparse
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--render-to',required=True,type=Path)
parser.add_argument('--pdftoppm',required=True)
parser.add_argument('--manifest',type=Path,default=ROOT/'scripts/document-regularization.json')
args=parser.parse_args()
args.render_to.mkdir(parents=True,exist_ok=True)
manifest=json.loads(args.manifest.read_text())
assert len({e['output'] for e in manifest})==len(manifest)
records=[]
def verify(pair):
    index,entry=pair
    path=ROOT/entry['output'];pdf=PdfReader(path)
    texts=[p.extract_text() or '' for p in pdf.pages]
    assert all(len(t.strip())>50 for t in texts),path
    if 'Mapa mental' in path.name or 'Impact Mapping' in path.name:
        assert 'flowchart LR' not in '\n'.join(texts)
        assert 'root((SIGAA))' not in '\n'.join(texts)
    prefix=args.render_to/f'{index:02d}'
    subprocess.run([args.pdftoppm,'-scale-to','1050','-png',str(path),str(prefix)],check=True,capture_output=True)
    return {'index':index,'file':entry['output'],'pages':len(pdf.pages),'textChars':sum(map(len,texts))}
with ThreadPoolExecutor(max_workers=4) as pool:
    records=list(pool.map(verify,enumerate(manifest)))
images=sorted(args.render_to.glob('[0-9][0-9]-*.png'))
for start in range(0,len(images),6):
    sheet=Image.new('RGB',(1500,1500),'#dddddd');draw=ImageDraw.Draw(sheet)
    for j,path in enumerate(images[start:start+6]):
        im=Image.open(path).convert('RGB');im.thumbnail((484,700))
        x=(j%3)*500;y=(j//3)*750
        draw.text((x+8,y+8),path.name,fill='black')
        sheet.paste(im,(x+8,y+35))
    sheet.save(args.render_to/f'contact-{start//6:02d}.png')
(args.render_to/'verification.json').write_text(json.dumps({'pdfCount':len(records),'pageCount':len(images),'files':records},ensure_ascii=False,indent=2))
print(json.dumps({'pdfCount':len(records),'pages':len(images),'contacts':len(list(args.render_to.glob('contact-*.png'))),'directory':str(args.render_to)}))
