import argparse
import colorsys
import hashlib
import io
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import pillow_avif

# --- COULEURS SPÉCIFIQUES ---
BG_COLOR = "#101010"           # Noir de fond
OFF_WHITE = "#F5F2EB"          # Blanc beige / crème
TEXT_GRADIENT_BOTTOM = "#D8D0C5" # Teinte légèrement plus sombre pour le dégradé du texte

F1_RED_DARK = "#8B0000"        # Rouge plus sombre/discret (Dark Red) pour COURSE
MERCEDES_GREEN = "#00A19C"     # Vert Mercedes F1 pour QUALIF
FADED_GREEN = "#3B7A57"        # Vert pour SPRINT
WHITE = "#FFFFFF"

# Dictionnaire de traduction rapide des codes pays
COUNTRY_NAMES = {
    "BE": "BELGIQUE", "FR": "FRANCE", "ES": "ESPAGNE", "IT": "ITALIE",
    "DE": "ALLEMAGNE", "GB": "ROYAUME-UNI", "NL": "PAYS-BAS", "MC": "MONACO",
    "AT": "AUTRICHE", "HU": "HONGRIE", "AZ": "AZERBAÏDJAN", "QA": "QATAR",
    "SA": "ARABIE SAOUDITE", "AE": "ÉMIRATS ARABES UNIS", "US": "ÉTATS-UNIS",
    "MX": "MEXIQUE", "BR": "BRÉSIL", "CA": "CANADA", "JP": "JAPON",
    "SG": "SINGAPOUR", "AU": "AUSTRALIE", "CN": "CHINE", "BH": "BAHREÏN"
}

def get_country_name(code):
    """Retourne le nom du pays en majuscules à partir de son code à 2 lettres."""
    if not code:
        return ""
    code_upper = code.strip().upper()
    return COUNTRY_NAMES.get(code_upper, code_upper)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def lighten_color(color, factor=1.4):
    return (
        min(255, int(color[0] * factor)),
        min(255, int(color[1] * factor)),
        min(255, int(color[2] * factor))
    )

def create_gradient_texture(width, height, color1, color2):
    base = Image.new("RGB", (width, height), color1)
    top = Image.new("RGB", (width, height), color2)
    
    mask = Image.new("L", (width, height))
    for y in range(height):
        alpha = int(255 * (y / float(height)))
        for x in range(width):
            mask.putpixel((x, y), alpha)
            
    return Image.composite(top, base, mask)

def get_flag_image(country_code, target_width, target_height, opacity=0.35):
    """Télécharge et recadre le drapeau brut (sans transition en bas)."""
    code = country_code.strip().lower()
    url = f"https://flagcdn.com/w640/{code}.png"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        flag_img = Image.open(io.BytesIO(response.read())).convert("RGBA")
    
    fw, fh = flag_img.size
    scale = max(target_width / fw, target_height / fh)
    new_w = int(fw * scale)
    new_h = int(fh * scale)
    
    flag_resized = flag_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    left = (new_w - target_width) // 2
    top = (new_h - target_height) // 2
    flag_cropped = flag_resized.crop((left, top, left + target_width, top + target_height))
    
    alpha_mask = Image.new("L", (target_width, target_height), int(255 * opacity))
    flag_cropped.putalpha(alpha_mask)
    return flag_cropped

def draw_text_with_shadow(
    target_canvas, text, position, font, fill_color,
    shadow_alpha=200, shadow_color=(0, 0, 0),
    custom_offset=None, custom_blur=None
):
    if not text:
        return
    
    font_size = getattr(font, "size", 40)
    scale = font_size / 40.0
    
    shadow_blur = custom_blur if custom_blur is not None else max(1, int(4 * scale))
    shadow_offset = custom_offset if custom_offset is not None else (max(1, int(3 * scale)), max(1, int(4 * scale)))
    
    x, y = position
    bbox = font.getbbox(text)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    padding = shadow_blur * 3
    img_w = text_w + padding * 2
    img_h = text_h + padding * 2
    
    text_mask = Image.new("L", (img_w, img_h), 0)
    draw_mask = ImageDraw.Draw(text_mask)
    draw_mask.text((padding - bbox[0], padding - bbox[1]), text, font=font, fill=255)
    
    shadow_mask = text_mask.filter(ImageFilter.GaussianBlur(shadow_blur))
    shadow_mask = Image.eval(shadow_mask, lambda p: int(p * (shadow_alpha / 255.0)))
    shadow_layer = Image.new("RGBA", (img_w, img_h), shadow_color + (0,))
    shadow_layer.putalpha(shadow_mask)
    
    if isinstance(fill_color, (tuple, list)) and len(fill_color) == 2 and isinstance(fill_color[0], (tuple, list)):
        fill_img = create_gradient_texture(img_w, img_h, fill_color[0], fill_color[1])
    elif isinstance(fill_color, str):
        fill_img = Image.new("RGB", (img_w, img_h), hex_to_rgb(fill_color))
    else:
        fill_img = Image.new("RGB", (img_w, img_h), fill_color)
        
    text_layer = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
    text_layer.paste(fill_img, (0, 0), text_mask)
    
    sx = x - padding + shadow_offset[0]
    sy = y - padding + shadow_offset[1]
    target_canvas.paste(shadow_layer, (sx, sy), shadow_layer)
    
    gx = x - padding
    gy = y - padding
    target_canvas.paste(text_layer, (gx, gy), text_layer)

def draw_text_with_outline(
    target_canvas, text, position, font, fill_color, stroke_color=None, stroke_width=2
):
    if not text:
        return
    
    x, y = position
    bbox = font.getbbox(text)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    padding = stroke_width + 10
    img_w = text_w + padding * 2
    img_h = text_h + padding * 2
    
    if isinstance(fill_color, str):
        fill_color = hex_to_rgb(fill_color)
        
    if stroke_color is None:
        stroke_color = lighten_color(fill_color, factor=1.4)
    elif isinstance(stroke_color, str):
        stroke_color = hex_to_rgb(stroke_color)
    
    stroke_mask = Image.new("L", (img_w, img_h), 0)
    draw_stroke = ImageDraw.Draw(stroke_mask)
    draw_stroke.text(
        (padding - bbox[0], padding - bbox[1]), 
        text, font=font, fill=255, 
        stroke_width=stroke_width
    )
    
    stroke_layer = Image.new("RGBA", (img_w, img_h), stroke_color + (255,))
    
    text_mask = Image.new("L", (img_w, img_h), 0)
    draw_text = ImageDraw.Draw(text_mask)
    draw_text.text((padding - bbox[0], padding - bbox[1]), text, font=font, fill=255)
    
    if isinstance(fill_color, (tuple, list)) and len(fill_color) == 2 and isinstance(fill_color[0], (tuple, list)):
        fill_img = create_gradient_texture(img_w, img_h, fill_color[0], fill_color[1])
    else:
        fill_img = Image.new("RGB", (img_w, img_h), fill_color)

    text_layer = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
    text_layer.paste(fill_img, (0, 0), text_mask)
    
    gx = x - padding
    gy = y - padding
    
    target_canvas.paste(stroke_layer, (gx, gy), stroke_mask)
    target_canvas.paste(text_layer, (gx, gy), text_layer)


# --- SCRIPT PRINCIPAL ---

parser = argparse.ArgumentParser(description="Générateur de poster/vignette F1")
parser.add_argument("--line1", type=str, default=None, help="Première ligne (ex: BARCELONE)")
parser.add_argument("--line2", type=str, default=None, help="Deuxième ligne optionnelle (ex: CATALOGNE)")
parser.add_argument("-i", "--image", type=str, default=None, help="URL de l'image du bas (optionnelle)")
parser.add_argument("-f", "--flag", type=str, default=None, help="Code pays à 2 lettres pour le drapeau (ex: BE, FR, ES)")

parser.add_argument("-c", "--course", action="store_true", help="Affiche le statut COURSE (rouge sombre F1)")
parser.add_argument("-q", "--qualif", action="store_true", help="Affiche le statut QUALIF (vert Mercedes F1)")
parser.add_argument("-s", "--sprint", action="store_true", help="Ajoute le texte 'SPRINT' sous le statut (vert fade)")

args = parser.parse_args()

if args.line1 is None and args.line2 is None:
    line1_raw = "FORMULE 1"
    line2_raw = ""
else:
    line1_raw = args.line1 if args.line1 is not None else ""
    line2_raw = args.line2 if args.line2 is not None else ""

WIDTH, HEIGHT = 400, 600

if args.qualif and not args.course:
    status_text = "QUALIF"
    status_color = MERCEDES_GREEN
else:
    status_text = "COURSE"
    status_color = F1_RED_DARK

# 1. CRÉATION DU CANEVAS
canvas = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(canvas)

# 2. PRÉPARATION DES POLICES ET ZONES
PADDING_X = 20
AVAILABLE_WIDTH = WIDTH - (PADDING_X * 2)
FONT_PATH = "Formula1.ttf"

FLAG_HEIGHT = 220
LINE_SPACING = 5
COUNTRY_MARGIN_BOTTOM = 50
FLAG_BOTTOM_MARGIN = 10  # Marge de sécurité au bas du drapeau

country_text = get_country_name(args.flag)
line1_clean = line1_raw.upper()
line2_clean = line2_raw.upper()

# A. CALCUL POLICE PAYS (~50% du canvas)
TARGET_COUNTRY_WIDTH = WIDTH * 0.50
font_country_size = 10
if country_text:
    while True:
        test_font = ImageFont.truetype(FONT_PATH, font_country_size)
        bbox = draw.textbbox((0, 0), country_text, font=test_font)
        w = bbox[2] - bbox[0]
        if w >= TARGET_COUNTRY_WIDTH or font_country_size >= 45:
            break
        font_country_size += 1

font_country = ImageFont.truetype(FONT_PATH, font_country_size) if country_text else None

if country_text:
    bbox_c = draw.textbbox((0, 0), country_text, font=font_country)
    h_country = bbox_c[3] - bbox_c[1]
else:
    h_country = 0

# B. CALCUL POLICE DES LIGNES 1 ET 2
country_y_start = 15
available_flag_h = FLAG_HEIGHT - (country_y_start + h_country + COUNTRY_MARGIN_BOTTOM) - FLAG_BOTTOM_MARGIN

city_font_size = 10
while True:
    test_font = ImageFont.truetype(FONT_PATH, city_font_size)
    
    w_l1 = draw.textbbox((0, 0), line1_clean, font=test_font)[2] - draw.textbbox((0, 0), line1_clean, font=test_font)[0] if line1_clean else 0
    w_l2 = draw.textbbox((0, 0), line2_clean, font=test_font)[2] - draw.textbbox((0, 0), line2_clean, font=test_font)[0] if line2_clean else 0
    max_w = max(w_l1, w_l2)
    
    h_l1 = (draw.textbbox((0, 0), line1_clean, font=test_font)[3] - draw.textbbox((0, 0), line1_clean, font=test_font)[1]) if line1_clean else 0
    h_l2 = (draw.textbbox((0, 0), line2_clean, font=test_font)[3] - draw.textbbox((0, 0), line2_clean, font=test_font)[1]) if line2_clean else 0
    
    num_lines = (1 if line1_clean else 0) + (1 if line2_clean else 0)
    total_h = h_l1 + h_l2 + (LINE_SPACING if num_lines > 1 else 0)
    
    if max_w >= AVAILABLE_WIDTH or total_h >= available_flag_h or city_font_size >= 80:
        break
    city_font_size += 1

font_city = ImageFont.truetype(FONT_PATH, city_font_size)
font_status = ImageFont.truetype(FONT_PATH, 52)  # Agrandissement de 42px -> 52px pour COURSE/QUALIF
font_sprint = ImageFont.truetype(FONT_PATH, 22)  # Ajustement proportionnel pour SPRINT

# 3. INJECTION DU DRAPEAU BRUT EN HAUT
if args.flag:
    try:
        flag_banner = get_flag_image(args.flag, WIDTH, FLAG_HEIGHT, opacity=0.35)
        canvas.paste(flag_banner, (0, 0), flag_banner)
    except Exception as e:
        print(f"Erreur lors du téléchargement du drapeau '{args.flag}' : {e}")

# 4. INJECTION DU TRACÉ DU CIRCUIT EN BAS
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

# 5. DESSIN DES TEXTES

# A. Nom du Pays tout en haut
if country_text and font_country:
    draw_text_with_shadow(
        canvas, country_text, (PADDING_X, country_y_start), font_country, 
        fill_color=WHITE, shadow_alpha=230, shadow_color=(0, 0, 0)
    )

# B. CALCUL DE LA POSITION Y ALIGNÉE EN BAS DU DRAPEAU
h_l1 = (draw.textbbox((0, 0), line1_clean, font=font_city)[3] - draw.textbbox((0, 0), line1_clean, font=font_city)[1]) if line1_clean else 0
h_l2 = (draw.textbbox((0, 0), line2_clean, font=font_city)[3] - draw.textbbox((0, 0), line2_clean, font=font_city)[1]) if line2_clean else 0

num_lines = (1 if line1_clean else 0) + (1 if line2_clean else 0)
total_text_height = h_l1 + h_l2 + (LINE_SPACING if num_lines > 1 else 0)

# Aligner le bas du bloc de texte avec le bas du drapeau
start_y_lines = FLAG_HEIGHT - total_text_height - FLAG_BOTTOM_MARGIN

# Sécurité : vérifier que ça ne remonte pas par-dessus la marge du pays
min_allowed_y = country_y_start + h_country + COUNTRY_MARGIN_BOTTOM
start_y_lines = max(start_y_lines, min_allowed_y)

current_y = start_y_lines

circuit_fill = (hex_to_rgb(OFF_WHITE), hex_to_rgb(TEXT_GRADIENT_BOTTOM))

if line1_clean:
    draw_text_with_shadow(
        canvas, line1_clean, (PADDING_X, current_y), font_city, 
        fill_color=circuit_fill, shadow_alpha=220, shadow_color=(0, 0, 0)
    )
    current_y += h_l1 + LINE_SPACING

if line2_clean:
    bbox_l2 = draw.textbbox((0, 0), line2_clean, font=font_city)
    l2_width = bbox_l2[2] - bbox_l2[0]
    x_l2 = WIDTH - PADDING_X - l2_width
    draw_text_with_shadow(
        canvas, line2_clean, (x_l2, current_y), font_city, 
        fill_color=circuit_fill, shadow_alpha=220, shadow_color=(0, 0, 0)
    )

# C. Statut au milieu (COURSE / QUALIF / SPRINT)
status_center_y = max(280, FLAG_HEIGHT + 15)  # Légèrement réajusté pour la taille 52px
STATUS_STROKE_WIDTH = 2

draw_text_with_outline(
    canvas, status_text, (PADDING_X, status_center_y), font_status, 
    fill_color=status_color, stroke_width=STATUS_STROKE_WIDTH
)

if args.sprint:
    bbox_status = draw.textbbox((0, 0), status_text, font=font_status)
    sprint_y = status_center_y + (bbox_status[3] - bbox_status[1]) + 8
    draw_text_with_outline(
        canvas, "SPRINT", (PADDING_X, sprint_y), font_sprint, 
        fill_color=FADED_GREEN, stroke_width=STATUS_STROKE_WIDTH
    )

# Sauvegarde finale
canvas.convert("RGB").save("thumb.png")
print("Vignette générée avec succès : thumb.png !")
