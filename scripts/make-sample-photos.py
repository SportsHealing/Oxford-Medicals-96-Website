#!/usr/bin/env python3
"""Generate placeholder sample photos for the prototype.

Each image is a sepia-toned SVG with anonymous silhouettes placed where
the sample tags expect faces. No real people are shown.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "photos"
OUT.mkdir(parents=True, exist_ok=True)

# (filename, label, head positions as (x%, y%))
PHOTOS = [
    ("photo-01.svg", "Matriculation, 1990", [(22, 48), (50, 46), (76, 50)]),
    ("photo-02.svg", "Anatomy lab, 1991", [(30, 45), (68, 47)]),
    ("photo-03.svg", "Tingewick, 1995", [(20, 55), (48, 42), (78, 52)]),
    ("photo-04.svg", "Osler House, 1994", [(35, 50), (62, 48)]),
    ("photo-05.svg", "Ward round, 1995", [(55, 44)]),
    ("photo-06.svg", "Graduation, 1996", [(18, 50), (40, 48), (62, 50), (84, 49)]),
]

W, H = 800, 600


def figure(xp: float, yp: float) -> str:
    x, y = W * xp / 100, H * yp / 100
    return (
        f'<circle cx="{x:.0f}" cy="{y:.0f}" r="34" fill="#8a6f52"/>'
        f'<path d="M{x-70:.0f} {H} C{x-70:.0f} {y+60:.0f} {x+70:.0f} {y+60:.0f} {x+70:.0f} {H} Z" fill="#6f563d"/>'
    )


for name, label, heads in PHOTOS:
    body = "".join(figure(*h) for h in heads)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Sample photo: {label}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9d9c0"/>
      <stop offset="1" stop-color="#c9b28e"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#sky)"/>
  <rect y="{H*0.62:.0f}" width="{W}" height="{H*0.38:.0f}" fill="#b89b74"/>
  {body}
  <rect width="{W}" height="{H}" fill="url(#vignette)"/>
  <text x="24" y="{H-24}" font-family="Georgia, serif" font-size="26" fill="#fff8ec" opacity="0.9">{label}</text>
  <text x="{W-24}" y="{H-24}" text-anchor="end" font-family="sans-serif" font-size="18" fill="#fff8ec" opacity="0.8">sample</text>
</svg>
"""
    (OUT / name).write_text(svg)
    print("wrote", OUT / name)
