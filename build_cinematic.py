import base64, os

def b64(path):
    return 'data:image/jpeg;base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# Fundo 4K e atleta angolano
HERO_4K        = b64('/home/coelho/whoop-luanda/assets/luanda-hd/marginal-promenade-4k.jpg')
ATHLETE_ANGOLA = b64('/home/coelho/whoop-luanda/assets/athlete-angola.jpg')

# 3 Anéis reais da App WHOOP (extraídos de IMG_0591)
REAL_SLEEP  = b64('/home/coelho/whoop-luanda/assets/dashboards/real_sleep_ring.jpg')
REAL_REC    = b64('/home/coelho/whoop-luanda/assets/dashboards/real_recovery_ring.jpg')
REAL_STRAIN = b64('/home/coelho/whoop-luanda/assets/dashboards/real_strain_ring.jpg')

# Fotos reais do WHOOP (estúdio + app no smartphone + atleta com widget)
WHOOP_588   = b64('/home/coelho/whoop-luanda/assets/carousel/whoop_studio_588.jpg')
WHOOP_589   = b64('/home/coelho/whoop-luanda/assets/carousel/whoop_studio_589.jpg')
WHOOP_592   = b64('/home/coelho/whoop-luanda/assets/carousel/whoop_app_phone_592.jpg')
WHOOP_593   = b64('/home/coelho/whoop-luanda/assets/carousel/whoop_athlete_widget_593.jpg')

# Poster do Vídeo 1 (extraído de IMG_0526)
VIDEO_01_POSTER = b64('/home/coelho/whoop-luanda/assets/videos/video_01_poster.jpg')
VIDEO_02_POSTER = b64('/home/coelho/whoop-luanda/assets/videos/video_02_poster.jpg')
VIDEO_03_POSTER = b64('/home/coelho/whoop-luanda/assets/videos/video_03_poster.jpg')

# Apoio
SWIM   = b64('/home/coelho/whoop-luanda/assets/SWIM.opt.jpg')
CLINIC = b64('/home/coelho/whoop-luanda/assets/CLINIC.opt.jpg')

src = open('/home/coelho/whoop-luanda/cinematic-template.html', encoding='utf-8').read()

subs = {
    'HERO_IMG': HERO_4K,
    'ATHLETE_ANGOLA_IMG': ATHLETE_ANGOLA,
    'REAL_SLEEP_RING_IMG': REAL_SLEEP,
    'REAL_REC_RING_IMG': REAL_REC,
    'REAL_STRAIN_RING_IMG': REAL_STRAIN,
    'WHOOP_STUDIO_588_IMG': WHOOP_588,
    'WHOOP_STUDIO_589_IMG': WHOOP_589,
    'WHOOP_APP_592_IMG': WHOOP_592,
    'WHOOP_WIDGET_593_IMG': WHOOP_593,
    'VIDEO_01_POSTER_IMG': VIDEO_01_POSTER,
    'VIDEO_02_POSTER_IMG': VIDEO_02_POSTER,
    'VIDEO_03_POSTER_IMG': VIDEO_03_POSTER,
    'SWIM_IMG': SWIM,
    'CLINIC_IMG': CLINIC
}

for k, v in subs.items():
    if k in src:
        src = src.replace(k, v)
        print(f"Substituído com sucesso: {k}")
    else:
        print(f"AVISO: Placeholder {k} não encontrado no template!")

open('/home/coelho/whoop-luanda/index.html', 'w', encoding='utf-8').write(src)
kb = os.path.getsize('/home/coelho/whoop-luanda/index.html') // 1024
print(f"\nNOVO index.html COMPILADO COM O VÍDEO REAL: {kb} KB")
