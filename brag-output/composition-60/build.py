#!/usr/bin/env python3
"""Builds index.html and compositions/s1..s9.html from src/*.tpl, injecting the
baked QR pattern wherever <!--QR--> appears. Run: python build.py"""
import io
import os

QR = io.open("qr.svg.txt", encoding="utf-8").read()
TARGETS = {"src/index.html.tpl": "index.html"}
for i in range(1, 10):
    TARGETS["src/s%d.html.tpl" % i] = "compositions/s%d.html" % i

os.makedirs("compositions", exist_ok=True)
for src, dst in TARGETS.items():
    html = io.open(src, encoding="utf-8").read().replace("<!--QR-->", QR)
    io.open(dst, "w", encoding="utf-8", newline="\n").write(html)
    print("wrote", dst)
