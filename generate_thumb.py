import argparse
import urllib.request
import io
import pillow_avif
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description="Générateur de poster/vignette F1")
parser.add_argument("--line1", type=str, default=None, help="Première ligne (ex: BARCELONE)")
parser.add_argument("--line2", type=str, default=None, help="Deuxième ligne optionnelle (ex: CATALOGNE)")
parser.add_argument("-i", "--image", type=str, default=None, help="URL de l'image du bas (optionnelle)")

parser.add_argument("-c", "--course", action="store_true", help="Affiche le statut COURSE (bleu fade)")
parser.add_argument("-q", "--qualif", action="store_true", help="Affiche le statut QUALIF (orange fade)")
parser.add_argument("-s", "--sprint", action="store_true", help="Ajoute le texte 'SPRINT' sous le statut (vert fade)")

args = parser.parse_args()

if args.line1 is None and args.line2 is None:
    line1_raw = "FORMULE 1"
    line2_raw = ""
else:
    line1_raw = args.line1 if args.line1 is not None else ""
    line2_raw = args.line2 if args.line2 is not None else ""

WIDTH, HEIGHT = 400, 600
BG_COLOR = "#101010"
WHITE = "#FFFFFF"
RED = "#E10600"

FADED_BLUE = "#3B6A8A"
FADED_ORANGE = "#C87D32"
FADED_GREEN = "#3B7A57"

if args.qualif and not args.course:
    status_text = "QUALIF"
    status_color = FADED_ORANGE
else:
    status_text = "COURSE"
    status_color = FADED_BLUE

canvas = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(canvas)

PADDING_X = 20
AVAILABLE_WIDTH = WIDTH - (PADDING_X * 2)

FONT_PATH = "Formula1.ttf"

title_text = "Grand Prix"
font_size = 10

while True:
    font_title = ImageFont.truetype(FONT_PATH, font_size)
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    text_w = bbox[2] - bbox[0]
    
    if text_w >= AVAILABLE_WIDTH or font_size > 100:
        break
    font_size += 1

font_year = ImageFont.truetype(FONT_PATH, int(font_size * 0.45))
font_status = ImageFont.truetype(FONT_PATH, int(font_size))

line1_clean = line1_raw.upper()
line2_clean = line2_raw.upper()

longest_line = line1_clean if len(line1_clean) >= len(line2_clean) else line2_clean

city_font_size = 10
if longest_line:
    while True:
        test_font = ImageFont.truetype(FONT_PATH, city_font_size)
        bbox = draw.textbbox((0, 0), longest_line, font=test_font)
        text_w = bbox[2] - bbox[0]
        
        if text_w >= AVAILABLE_WIDTH or city_font_size > 120:
            break
        city_font_size += 1

font_city = ImageFont.truetype(FONT_PATH, city_font_size)

current_y = 15

draw.text((PADDING_X, current_y), title_text, fill=WHITE, font=font_title)
bbox_title = draw.textbbox((0, 0), title_text, font=font_title)
current_y += (bbox_title[3] - bbox_title[1]) + 20

draw.text((PADDING_X, current_y), "2026", fill=WHITE, font=font_year)
bbox_year = draw.textbbox((0, 0), "2026", font=font_year)
current_y += (bbox_year[3] - bbox_year[1]) + 40

box_start_y = current_y

if line1_clean:
    draw.text((PADDING_X, current_y), line1_clean, fill=RED, font=font_city)
    bbox_l1 = draw.textbbox((0, 0), line1_clean, font=font_city)
    current_y += (bbox_l1[3] - bbox_l1[1]) + 5

if line2_clean:
    bbox_l2 = draw.textbbox((0, 0), line2_clean, font=font_city)
    l2_width = bbox_l2[2] - bbox_l2[0]
    x_l2 = WIDTH - PADDING_X - l2_width
    draw.text((x_l2, current_y), line2_clean, fill=RED, font=font_city)

bbox_ref = draw.textbbox((0, 0), "TEXT_REF", font=font_city)
single_line_height = bbox_ref[3] - bbox_ref[1]
current_y = box_start_y + (single_line_height * 2) + 5 + 40

draw.text((PADDING_X, current_y), status_text, fill=status_color, font=font_status)
bbox_status = draw.textbbox((0, 0), status_text, font=font_status)
current_y += (bbox_status[3] - bbox_status[1]) + 10

if args.sprint:
    draw.text((PADDING_X, current_y), "SPRINT", fill=FADED_GREEN, font=font_year)

if args.image:
    try:
        req = urllib.request.Request(args.image, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_data = response.read()
        
        user_img = Image.open(io.BytesIO(image_data))

        img_w, img_h = user_img.size
        target_w = WIDTH
        target_h = int(img_h * (target_w / img_w))
        
        user_img_resized = user_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        paste_y = HEIGHT - target_h
        
        if user_img_resized.mode in ('RGBA', 'LA'):
            canvas.paste(user_img_resized, (0, paste_y), user_img_resized)
        else:
            canvas.paste(user_img_resized, (0, paste_y))

    except Exception as e:
        print(f"Erreur lors du téléchargement de l'image : {e}")

canvas.save("thumb.png")
print("Vignette générée : thumb.png !")
