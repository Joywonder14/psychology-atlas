#!/usr/bin/env python3
"""Import source-checked editorial records as editable Markdown. Maintainer utility."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def write_card(card):
    meta = {k:v for k,v in card.items() if k not in ('sections','markdown')}
    head = '\n'.join(f'{k}: {json.dumps(v,ensure_ascii=False)}' for k,v in meta.items())
    body = '\n\n'.join(f'## {s["heading"]}\n\n{s["text"]}' for s in card['sections'])
    (ROOT/'knowledge/cards'/f'{card["id"]}.md').write_text(f'---\n{head}\n---\n\n{body}\n',encoding='utf-8')

if __name__=='__main__':
    chapters=[]
    for arg in sys.argv[1:]:
        data=json.loads(Path(arg).read_text())
        for card in data['cards']: write_card(card)
        chapters.extend(data.get('chapters',[]))
    (ROOT/'knowledge/chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2))
    print(f'Imported {len([p for p in (ROOT/"knowledge/cards").glob("*.md") if not p.name.startswith("._")])} Markdown files.')
