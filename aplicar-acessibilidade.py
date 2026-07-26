#!/usr/bin/env python3
# ============================================================
# Plataforma da Física — aplicar o PAINEL de acessibilidade em
# TODAS as páginas (novo: um único arquivo acessibilidade.js).
#
# Para cada .html do projeto, este script:
#   1) remove os includes antigos (modo-calmo.js e voltar.js),
#      caso a página tenha a versão anterior;
#   2) insere, antes de </body>, a linha do painel unificado:
#
#      <script src="/Plataforma-da-Fisica/acessibilidade.js"></script>
#
# Caminho ABSOLUTO: funciona no GitHub Pages. Aberto direto do PC
# (file://) os botões NÃO aparecem — teste pelo link publicado.
# Se renomear o repositório/usar domínio próprio, troque BASE.
#
# É seguro rodar várias vezes (idempotente).
#
# USO:  coloque acessibilidade.js e este arquivo na raiz do
#       projeto e rode:  python aplicar-acessibilidade.py
#       (no Windows, se preciso:  py aplicar-acessibilidade.py)
#
# Depois de rodar e publicar, você pode apagar os arquivos
# antigos modo-calmo.js e voltar.js — não são mais usados.
# ============================================================

import os, re

BASE = "/Plataforma-da-Fisica/"
NOVO = '<script src="{b}acessibilidade.js"></script>'.format(b=BASE)
LINHA = "  " + NOVO + "\n"
MARCADOR = "acessibilidade.js"
ANTIGOS = ["modo-calmo.js", "voltar.js"]
IGNORAR = {".git", "node_modules", ".github"}

raiz = os.path.dirname(os.path.abspath(__file__))
inseridos, atualizados, pulados, sem_body = [], [], [], []

# remove qualquer linha <script ...> que aponte para os arquivos antigos
def tirar_antigos(html):
    mudou = False
    for nome in ANTIGOS:
        padrao = re.compile(r'[ \t]*<script[^>]+' + re.escape(nome) + r'[^>]*>\s*</script>\s*\n?', re.I)
        novo, qtd = padrao.subn("", html)
        if qtd:
            html = novo; mudou = True
    return html, mudou

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
            print("  ! erro ao ler", rel, "->", e); continue

        html, removeu = tirar_antigos(html)

        if MARCADOR in html:
            if removeu:
                open(caminho, "w", encoding="utf-8").write(html)
                atualizados.append(rel)
            else:
                pulados.append(rel)
            continue

        idx = html.lower().rfind("</body>")
        if idx == -1:
            sem_body.append(rel); continue
        html = html[:idx] + LINHA + html[idx:]
        open(caminho, "w", encoding="utf-8").write(html)
        (atualizados if removeu else inseridos).append(rel)

print("\n=== Painel de acessibilidade aplicado ===")
print("Inseridos (novos) : %d" % len(inseridos))
for r in sorted(inseridos): print("   +", r)
print("Migrados (tinham a versao antiga) : %d" % len(atualizados))
for r in sorted(atualizados): print("   ~", r)
print("Ja estavam ok : %d" % len(pulados))
if sem_body:
    print("SEM </body> (revisar a mao): %d" % len(sem_body))
    for r in sorted(sem_body): print("   ?", r)
print("\nPronto. De commit e publique. Teste pelo link do GitHub")
print("Pages. Depois pode apagar modo-calmo.js e voltar.js.")
