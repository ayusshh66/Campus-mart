"""Creates original transparent character sprite sheet, 15 columns x 7 rows.
No third-party illustrations or font assets are redistributed.
"""
from PIL import Image, ImageDraw
import random
from pathlib import Path

random.seed(91)
scale=3
w,h=64,96
cols,rows=15,7
out=Image.new('RGBA',(w*cols*scale,h*rows*scale),(0,0,0,0))
skins=['#F6C7A8','#D99B72','#A6654C','#F1B693','#C98B5B','#824E42']
clothes=['#9C7CF0','#F1D17C','#63B6BB','#FF8C89','#9CCC82','#5C83A6','#E7A7D6','#7BA39B','#F0AF78']
trousers=['#263D60','#3A3C5C','#344B5B','#465D6A','#826E65']
hair=['#222535','#4C322A','#6B4638','#A66941','#1E2634']

for j in range(rows):
 for i in range(cols):
  x0,y0=i*w*scale,j*h*scale
  im=Image.new('RGBA',(w*scale,h*scale),(0,0,0,0))
  d=ImageDraw.Draw(im)
  def box(coords,fill,outline='#273248',width=1):
   c=tuple(round(q*scale) for q in coords)
   d.rounded_rectangle(c,radius=4*scale,fill=fill,outline=outline,width=width*scale)
  skin=random.choice(skins); shirt=random.choice(clothes)
  pant=random.choice(trousers); haircolor=random.choice(hair)
  cx=random.randint(29,35); walk=random.randint(-4,4)
  # back backpack for a few students
  if random.random()<.25:box((cx+11,44,cx+19,67),'#C08A54',width=1)
  # legs
  box((cx-12,65,cx-3+walk,88),pant,width=1)
  box((cx+3,65,cx+12-walk,88),pant,width=1)
  # shoes
  box((cx-14,86,cx-2+walk,92),'#1B263D',width=0)
  box((cx+2,86,cx+15-walk,92),'#1B263D',width=0)
  # arms
  arm=random.randint(-5,5)
  box((cx-18,43,cx-12,66+arm),skin,width=1)
  box((cx+12,43,cx+18,66-arm),skin,width=1)
  # jacket and shirt
  box((cx-14,38,cx+14,69),shirt,width=1)
  if random.random()<.35:
   d.line([(round((cx)*scale),round(41*scale)),(round(cx*scale),round(67*scale))],fill='#FFFFFF',width=scale)
  # neck
  box((cx-4,33,cx+4,42),skin,width=0)
  # head
  d.ellipse(((cx-12)*scale,10*scale,(cx+12)*scale,37*scale),fill=skin,outline='#303044',width=scale)
  # hair variations
  style=random.randint(0,3)
  if style==0: d.pieslice(((cx-13)*scale,7*scale,(cx+13)*scale,30*scale),180,350,fill=haircolor)
  elif style==1:
   d.arc(((cx-13)*scale,8*scale,(cx+13)*scale,32*scale),190,345,fill=haircolor,width=5*scale)
  elif style==2:box((cx-13,9,cx+12,19),haircolor,width=0)
  else:
   d.ellipse(((cx-13)*scale,5*scale,(cx+12)*scale,22*scale),fill=haircolor)
  # eyes
  for dx in [-4,4]: d.ellipse(((cx+dx-1)*scale,25*scale,(cx+dx+1)*scale,27*scale),fill='#172436')
  # occasional glasses
  if random.random()<.18:
   for dx in [-5,5]:d.ellipse(((cx+dx-4)*scale,21*scale,(cx+dx+4)*scale,31*scale),outline='#273248',width=scale)
  # smile
  d.arc(((cx-3)*scale,27*scale,(cx+3)*scale,33*scale),5,170,fill='#A55A62',width=scale)
  out.alpha_composite(im,(x0,y0))

out=out.resize((w*cols,h*rows), Image.Resampling.LANCZOS)
path=Path(__file__).parent/'client/public/images/peeps/all-peeps.png'
out.save(path,optimize=True)
print(path, out.size)
