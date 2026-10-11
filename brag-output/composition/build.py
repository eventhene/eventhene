#!/usr/bin/env python3
"""Builds index.html and compositions/s*.html from src/*.tpl, injecting the baked
QR pattern wherever <!--QR--> appears. Run: python build.py"""
import io
import os

QR = io.open("qr.svg.txt", encoding="utf-8").read()
TARGETS = {
    "src/index.html.tpl": "index.html",
    "src/s1.html.tpl": "compositions/s1.html",
    "src/s2.html.tpl": "compositions/s2.html",
    "src/s3.html.tpl": "compositions/s3.html",
    "src/s4.html.tpl": "compositions/s4.html",
    "src/s5.html.tpl": "compositions/s5.html",
}

os.makedirs("compositions", exist_ok=True)
for src, dst in TARGETS.items():
    html = io.open(src, encoding="utf-8").read().replace("<!--QR-->", QR)
    io.open(dst, "w", encoding="utf-8", newline="\n").write(html)
    print("wrote", dst)
