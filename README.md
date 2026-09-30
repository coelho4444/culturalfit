# WHOOP Luanda — Site Cinemático de Vendas

Página de venda do WHOOP 5.0 para Angola (revendedor independente).
Todo o conteúdo está em português de Angola, com preços em Kwanza (Kz).

## Estrutura do projeto

| Ficheiro | Papel |
|---|---|
| `cinematic-template.html` | **FONTE PRINCIPAL** — template com placeholders de imagem/vídeo |
| `build_cinematic.py` | Script de build — injeta as imagens base64 e gera o `index.html` |
| `index.html` | **SAÍDA COMPILADA** — ficheiro final autónomo (NÃO editar diretamente) |
| `assets/carousel/` | 4 fotos oficiais WHOOP (IMG_0588/0589/0592/0593) |
| `assets/dashboards/` | Anéis reais da app WHOOP (sono, recuperação, esforço) |
| `assets/videos/` | 3 vídeos reais transcodificados + posters |
| `assets/luanda-hd/` | Fundo hero 4K da Marginal |
| `assets/ai/`, `assets/bg/`, `assets/ao/`, `assets/final/` | Bancos de imagem de apoio (Angola) |

## Como compilar (após editar o template)

```bash
python3 /tmp/build_cinematic.py
```

O script lê `cinematic-template.html`, substitui os placeholders
(HERO_IMG, WHOOP_STUDIO_588_IMG, VIDEO_01_POSTER_IMG, etc.) por data-URIs
base64 e escreve o `index.html` final.

## Vídeos: fonte e transcodificação

Os vídeos originais estão em `~/Downloads/` (HEVC/MOV do iPhone).
Para transcodificar um novo vídeo:

```bash
ffmpeg -y -i ~/Downloads/IMG_XXXX.MOV \
  -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k \
  -movflags +faststart assets/videos/video_XX_nome.mp4

# Poster (frame de referência)
ffmpeg -y -ss 00:00:01.5 -i ~/Downloads/IMG_XXXX.MOV \
  -vframes 1 -q:v 2 assets/videos/video_XX_poster.jpg
```

## Vídeos atuais

| Card | Vídeo fonte | MP4 | Título no site |
|---|---|---|---|
| 01 | IMG_0526.MOV | video_01_corrida.mp4 (2.0 MB) | Performance em Movimento |
| 02 | IMG_0527.MOV | video_02_aguas.mp4 (9.0 MB) | Resistência em Água |
| 03 | IMG_0584.MOV | video_03_rotina.mp4 (3.2 MB) | Rotina em Equilíbrio |

## Estado atual (2026-09-30)

- Carrossel: 4 slides autênticos WHOOP (sem imagens espúrias)
- 3 cards de vídeo com players interativos (click play/pause)
- Anéis de recuperação/sono/esforço reais da app
- Build: `python3 /tmp/build_cinematic.py` → 2837 KB

## IMPORTANTE

- O script de build vive em `/tmp/build_cinematic.py` (temporário!).
  Cópia de segurança: `build_cinematic.py` na raiz do projeto.
- Os vídeos fontes estão em `~/Downloads/` — copiar para `assets/videos/src/`
  se quiser preservar os originais.
