#!/usr/bin/env python3
"""Build the self-contained website from local Markdown cards. Python stdlib only."""
import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]

def read_card(path):
    text = path.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        raise ValueError(f'{path.name}: missing front matter')
    head, body = text[4:].split('\n---\n', 1)
    meta = {}
    for line in head.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        key, sep, value = line.partition(':')
        if not sep:
            raise ValueError(f'{path.name}: invalid metadata: {line}')
        value = value.strip()
        try:
            meta[key.strip()] = json.loads(value)
        except json.JSONDecodeError:
            meta[key.strip()] = value
    sections = []
    for part in re.split(r'^## ', body, flags=re.M)[1:]:
        heading, _, content = part.partition('\n')
        sections.append({'heading':heading.strip(), 'text':content.strip()})
    meta['sections'] = sections
    meta['markdown'] = text
    return meta

def build():
    catalog = json.loads((ROOT/'knowledge/catalog.json').read_text())
    cards = [read_card(p) for p in sorted((ROOT/'knowledge/cards').glob('*.md')) if not p.name.startswith('._')]
    ids = [c['id'] for c in cards]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate card IDs')
    valid = set(ids)
    domains = {d['id'] for d in catalog['domains']}
    books = {b['id']: b for b in catalog['books']}
    for c in cards:
        for key in ['id','title','english','kind','domain','subdomain','summary','sources']:
            if not c.get(key): raise ValueError(f'{c.get("id")}: missing {key}')
        if c['domain'] not in domains: raise ValueError(f'Unknown domain: {c["domain"]}')
        if not c['sections']: raise ValueError(f'{c["id"]}: no body')
        for s in c['sources']:
            if s['book'] not in books or not s.get('locator') or not s.get('chapter'):
                raise ValueError(f'{c["id"]}: invalid source')
            if s.get('pdfPages') and any(p < 1 or p > books[s['book']].get('pages',10000) for p in s['pdfPages']):
                raise ValueError(f'{c["id"]}: invalid PDF page')
    def optional(name, default):
        path = ROOT/'knowledge'/name
        return json.loads(path.read_text()) if path.exists() else default
    relations = optional('relations.json', [])
    chapters = optional('chapters.json', [])
    collections = optional('collections.json', [])
    for edge in relations:
        if edge['source'] not in valid or edge['target'] not in valid or edge['source']==edge['target']:
            raise ValueError(f'Invalid relation: {edge}')
    for chapter in chapters:
        if chapter['book'] not in books or not set(chapter['cardIds']) <= valid:
            raise ValueError(f'Invalid chapter: {chapter}')
    for collection in collections:
        if not set(collection['cardIds']) <= valid:
            raise ValueError(f'Invalid collection: {collection}')
    data = {**catalog, 'cards':cards, 'relations':relations, 'chapters':chapters, 'collections':collections}
    (ROOT/'dist').mkdir(exist_ok=True)
    html = (ROOT/'app/index.html').read_text()
    html = html.replace('__STYLE__',(ROOT/'app/style.css').read_text())
    html = html.replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('<','\\u003c'))
    html = html.replace('__APP__',(ROOT/'app/app.js').read_text())
    (ROOT/'dist/index.html').write_text(html,encoding='utf-8')
    archive = ['# 心理学图谱\n',f'更新：{catalog["updated"]}\n','内容根据 books 目录内教材整理。PDF 页码为文件页序，EPUB 使用章节与小节定位。\n']
    for domain in catalog['domains']:
        subset = [c for c in cards if c['domain']==domain['id']]
        archive.append(f'\n# {domain["name"]}（{len(subset)} 张）\n')
        for c in subset:
            archive.extend([f'\n## {c["title"]} · {c["english"]}\n',f'{c["kind"]} / {c["subdomain"]}\n',c['summary']+'\n'])
            for section in c['sections']:
                archive.append(f'\n### {section["heading"]}\n\n{section["text"]}\n')
            archive.append('\n### 教材出处\n')
            for s in c['sources']:
                archive.append(f'- {books[s["book"]]["title"]}，{books[s["book"]]["edition"]}；{s["chapter"]}；{s["locator"]}\n')
            linked = [e for e in relations if c['id'] in (e['source'],e['target'])]
            if linked:
                archive.append('\n### 关联卡片\n')
                lookup={x['id']:x for x in cards}
                for e in linked:
                    other=e['target'] if e['source']==c['id'] else e['source']
                    archive.append(f'- {lookup[other]["title"]}：{e["reason"]}\n')
    backup='\n'.join(archive)
    (ROOT/'backups/心理学知识库.md').write_text(backup,encoding='utf-8')
    (ROOT/'dist/心理学知识库.md').write_text(backup,encoding='utf-8')
    print(json.dumps({'cards':len(cards),'chapters':len(chapters),'relations':len(relations),'collections':len(collections),'byBook':{b:sum(b in {s['book'] for s in c['sources']} for c in cards) for b in books},'byDomain':dict(Counter(c['domain'] for c in cards))},ensure_ascii=False))

if __name__=='__main__': build()
