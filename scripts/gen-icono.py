"""
Genera el ícono fuente PWA (1024x1024): monograma 'RG' blanco sobre #003DA5.
Placeholder de marca — reemplazable luego por un logo oficial.
Lo consume @vite-pwa/assets-generator para producir los tamaños finales.
"""
from PIL import Image, ImageDraw, ImageFont

S = 1024
AZUL = (0, 61, 165)  # #003DA5
TEXTO = "RG"

img = Image.new("RGB", (S, S), AZUL)
d = ImageDraw.Draw(img)

# Busca una fuente bold disponible en el sistema (macOS)
CANDIDATAS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
]

def cargar(size):
    for ruta in CANDIDATAS:
        try:
            return ImageFont.truetype(ruta, size)
        except Exception:
            continue
    return ImageFont.load_default()

# Escala la fuente para que 'RG' ocupe ~72% del ancho
base = cargar(100)
bb = d.textbbox((0, 0), TEXTO, font=base)
ancho_base = bb[2] - bb[0]
objetivo = 0.72 * S
size = max(40, int(100 * objetivo / max(1, ancho_base)))
font = cargar(size)

d.text((S / 2, S / 2), TEXTO, fill="white", font=font, anchor="mm")

img.save("public/icon-source.png")
print("OK -> public/icon-source.png (%dx%d, font size %d)" % (S, S, size))
