#!/usr/bin/env python3
# ============================================================
# Plataforma da Física — aplicar acessibilidade em TODAS as páginas
#
# Percorre todos os .html do projeto e insere, antes de </body>,
# as duas linhas dos recursos de acessibilidade (Modo Calmo +
# botão Voltar padronizado):
#
#     <script src="/Plataforma-da-Fisica/modo-calmo.js"></script>
#     <script src="/Plataforma-da-Fisica/voltar.js"></script>
#
# Caminho ABSOLUTO: funciona no GitHub Pages (dellzzz.github.io/
# Plataforma-da-Fisica/). ATENÇÃO: aberto direto do PC (file://)
# os botões NÃO aparecem — teste sempre pelo link publicado.
#
# Se você renomear o repositório ou usar domínio próprio, troque
# o valor de BASE abaixo (ex.: BASE = "/" para domínio próprio).
#
# É seguro rodar várias vezes: páginas que já têm as linhas são
# puladas. Não altera mais nada no HTML.
#
# COMO USAR:
#   1) coloque modo-calmo.js e voltar.js na RAIZ do projeto;
#   2) coloque este arquivo na RAIZ também;
#   3) rode:   python aplicar-acessibilidade.py
#      (no Windows, se preciso:  py aplicar-acessibilidade.py)
#   4) confira o relatório, dê commit e publique.
# ============================================================

import os

BASE = "/Plataforma-da-Fisica/"     # caminho do site no GitHub Pages

INCLUDES = (
    '  <script src="{b}modo-calmo.js"></script>\n'
    '  <script src="{b}voltar.js"></script>\n'
).format(b=BASE)

MARCADOR = "modo-calmo.js"           # se já existir no arquivo, pula
IGNORAR = {".git", "node_modules", ".github"}

raiz = os.path.dirname(os.path.abspath(__file__))
inseridos, pulados, sem_body = [], [], []

for pasta, subpastas, arquivos in os.walk(raiz):
    subpastas[:] = [d for d in subpastas if d not in IGNORAR]
    for nome in arquivos:
        if not nome.lower().endswith(".html"):
            continue
        caminho = os.path.join(pasta, nome)
        rel = os.path.relpath(caminho, raiz)
        try:
            html = open(caminho, encoding="utf-8").read()
        except Exception as e:
            print("  ! erro ao ler", rel, "->", e)
            continue

        if MARCADOR in html:
            pulados.append(rel)
            continue

        idx = html.lower().rfind("</body>")
        if idx == -1:
            sem_body.append(rel)
            continue

        novo = html[:idx] + INCLUDES + html[idx:]
        open(caminho, "w", encoding="utf-8").write(novo)
        inseridos.append(rel)

print("\n=== Acessibilidade aplicada ===")
print("Inseridos : %d" % len(inseridos))
for r in sorted(inseridos):
    print("   +", r)
print("Ja tinham : %d" % len(pulados))
if sem_body:
    print("SEM </body> (revisar a mao): %d" % len(sem_body))
    for r in sorted(sem_body):
        print("   ?", r)
print("\nPronto. Confira, de commit e publique. Teste pelo link do")
print("GitHub Pages (nao pelo arquivo local).")
