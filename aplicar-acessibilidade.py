#!/usr/bin/env python3
# ============================================================
# Plataforma da Física — aplicar os recursos de acessibilidade
# em TODAS as páginas, de uma vez:
#
#   1) o PAINEL de acessibilidade (acessibilidade.js)
#   2) o widget de LIBRAS (vlibras.js — VLibras do Governo)
#
# Para cada .html do projeto, este script:
#   - remove os includes antigos (modo-calmo.js e voltar.js),
#     caso a página tenha a versão anterior;
#   - insere, antes de </body>, as linhas que faltarem:
#
#       <script src="/Plataforma-da-Fisica/acessibilidade.js"></script>
#       <script src="/Plataforma-da-Fisica/vlibras.js"></script>
#
# Caminho ABSOLUTO: funciona no GitHub Pages. Aberto direto do PC
# (file://) os recursos NÃO aparecem — teste pelo link publicado.
# O VLibras também precisa de INTERNET (carrega do gov.br).
# Se renomear o repositório/usar domínio próprio, troque BASE.
#
# É seguro rodar várias vezes (idempotente).
#
# USO:  coloque acessibilidade.js, vlibras.js e este arquivo na
#       raiz do projeto e rode:  python aplicar-acessibilidade.py
#       (no Windows, se preciso:  py aplicar-acessibilidade.py)
#
# Se NÃO quiser algum dos recursos em determinada página, basta
# remover a linha correspondente daquela página depois de rodar.
# ============================================================

import os, re

BASE = "/Plataforma-da-Fisica/"

# lista de includes a garantir em cada página: (marcador, arquivo)
INCLUDES = [
    ("acessibilidade.js", "acessibilidade.js"),
    ("vlibras.js",        "vlibras.js"),
]
ANTIGOS = ["modo-calmo.js", "voltar.js"]
IGNORAR = {".git", "node_modules", ".github"}

def linha(arquivo):
    return '  <script src="{b}{a}"></script>\n'.format(b=BASE, a=arquivo)

raiz = os.path.dirname(os.path.abspath(__file__))
inseridos, atualizados, pulados, sem_body = [], [], [], []

# remove qualquer <script ...> que aponte para os arquivos antigos
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

        html, mudou = tirar_antigos(html)
        faltando = [arq for (marc, arq) in INCLUDES if marc not in html]

        if not faltando:
            if mudou:
                open(caminho, "w", encoding="utf-8").write(html)
                atualizados.append(rel)
            else:
                pulados.append(rel)
            continue

        idx = html.lower().rfind("</body>")
        if idx == -1:
            sem_body.append(rel); continue

        bloco = "".join(linha(arq) for arq in faltando)
        html = html[:idx] + bloco + html[idx:]
        open(caminho, "w", encoding="utf-8").write(html)
        (atualizados if (mudou or "acessibilidade.js" not in faltando) else inseridos).append(rel)

print("\n=== Recursos de acessibilidade aplicados ===")
print("Paginas novas (receberam os includes) : %d" % len(inseridos))
for r in sorted(inseridos): print("   +", r)
print("Paginas atualizadas (faltava algo/versao antiga) : %d" % len(atualizados))
for r in sorted(atualizados): print("   ~", r)
print("Ja estavam completas : %d" % len(pulados))
if sem_body:
    print("SEM </body> (revisar a mao): %d" % len(sem_body))
    for r in sorted(sem_body): print("   ?", r)
print("\nPronto. De commit e publique. Teste pelo link do GitHub Pages")
print("(o VLibras precisa de internet). Depois pode apagar modo-calmo.js e voltar.js.")
