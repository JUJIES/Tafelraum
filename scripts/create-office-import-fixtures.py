"""Generate neutral layout fixtures for importer QA; never writes classroom material."""
from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw
out=Path(__file__).resolve().parents[1]/'output/office-import-qa'
out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(800,220),'#f1f3f5');draw=ImageDraw.Draw(im)
for i,h in enumerate([70,120,160,90]):draw.rectangle((70+i*170,190-h,170+i*170,190),fill='#245d82')
im.save(out/'chart.png')
def setup(doc):
 sec=doc.sections[0];sec.page_width=Cm(21);sec.page_height=Cm(29.7)
 sec.top_margin=sec.bottom_margin=Cm(2);sec.left_margin=sec.right_margin=Cm(2)
 normal=doc.styles['Normal'];normal.font.name='Calibri';normal.font.size=Pt(11)
 sec.header.paragraphs[0].text='TAFELRAUM  |  WORD IMPORT TEST'
 p=sec.footer.paragraphs[0];p.text='Neutraler Testbestand  |  Seite '
 field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');p._p.append(field)
 return sec
one=Document();setup(one)
one.add_heading('Tabellen und Bilder',0)
one.add_paragraph('Dieses Dokument prüft DOCX zu PDF. Keine Unterrichts- oder Personendaten. Umlaute: Ä Ö Ü ä ö ü ß. Sonderzeichen: € und ½.')
one.add_heading('Tabelle',1)
t=one.add_table(rows=1,cols=3);t.style='Table Grid'
for cell,text in zip(t.rows[0].cells,['Position','Beschreibung','Wert']):cell.text=text
for values in [('1','Kurzer Text','12,50 €'),('2','Längerer Text mit automatischem Zeilenumbruch innerhalb der Tabellenzelle','38'),('3','Umlaute und Sonderzeichen bleiben lesbar','½')]:
 for cell,text in zip(t.add_row().cells,values):cell.text=text
one.add_heading('Eingebettete Grafik',1);one.add_picture(str(out/'chart.png'),width=Cm(15))
one.add_paragraph('Die Grafik muss vollständig unterhalb der Tabelle stehen.')
one.add_page_break();one.add_heading('Zweite Seite',0)
one.add_paragraph('Dieser Absatz muss nach dem expliziten Seitenumbruch auf Seite 2 beginnen.')
for i in range(1,5):one.add_paragraph(f'{i}. Kurzer Prüftext mit ausreichend Abstand und unverändertem Seitenrand.')
one.add_paragraph('ENDE DES ZWEISEITIGEN TESTDOKUMENTS')
one.save(out/'Tabellen und Bilder.docx')
two=Document();sec=setup(two)
sec.page_width=Cm(29.7);sec.page_height=Cm(21)
cols=sec._sectPr.find(qn('w:cols'));cols.set(qn('w:num'),'2');cols.set(qn('w:space'),'720')
two.add_heading('Linke Spalte',0)
two.add_paragraph('Dieses Querformatdokument prüft den zweispaltigen Satz. Die nächste Überschrift soll rechts beginnen.')
for i in range(3):two.add_paragraph('Neutraler Prüftext: Seitenformat, Spaltenabstand und Schrift sollen erhalten bleiben.')
p=two.add_paragraph();p.add_run().add_break(WD_BREAK.COLUMN)
two.add_heading('Rechte Spalte',0)
two.add_paragraph('Diese Spalte enthält eine kleine Tabelle. Beide Spalten sollen auf einer Seite liegen.')
t=two.add_table(rows=2,cols=2);t.style='Table Grid'
for cell,text in zip([c for r in t.rows for c in r.cells],['A','B','10','20']):cell.text=text
two.add_paragraph('ENDE DES QUERFORMATTESTS')
# Retain the over-wide source as an explicit negative layout case.
two.save(out/'Spalten mit breiter Tabelle.docx')
t.autofit=False
for column in t.columns:column.width=Cm(5.5)
for row in t.rows:
 for cell in row.cells:cell.width=Cm(5.5)
two.save(out/'Spalten im Querformat.docx')
print(out)
