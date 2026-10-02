#!/usr/bin/env python3
"""Merge source-checked editorial imports, preserving provenance and chapter coverage."""
import json
import re
import sys
from pathlib import Path
from collections import Counter
from import_cards import write_card

ROOT=Path(__file__).resolve().parents[1]

def norm(value):
    return re.sub(r'[^a-z0-9\u4e00-\u9fff]','',str(value).lower())

def unique(items):
    result=[]
    for item in items:
        if item not in result: result.append(item)
    return result

def curate(paths):
    incoming=[];chapters=[]
    for path in paths:
        obj=json.loads(Path(path).read_text())
        incoming.extend(obj['cards']);chapters.extend(obj['chapters'])
    cards=[];index={};redirects={};merges=[]
    # Only exact names are automatic. Related but differently scoped constructs stay separate.
    for original in incoming:
        c=dict(original)
        names=[norm(c['id']),norm(c['title']),norm(c['english'])]
        match=next((index[x] for x in names if x in index),None)
        if match:
            redirects[c['id']]=match['id'];merges.append([c['id'],match['id']])
            for key in ['sources','aliases','keywords','questions','candidateRelated']:
                match[key]=unique(match.get(key,[])+c.get(key,[]))
            match['aliases']=unique(match.get('aliases',[])+[c['title'],c['english']])
        else:
            cards.append(c);match=c
        for name in names:index[name]=match
    for c in cards:
        for name in [c['id'],c['title'],c['english']]+c.get('aliases',[]):index[norm(name)]=c
    # These two imports describe the same appraisal framework at the same level.
    canonical_pairs=[('emotion-cognitive-appraisal','emotion-appraisal')]
    for old_id,new_id in canonical_pairs:
        old=next((c for c in cards if c['id']==old_id),None)
        new=next((c for c in cards if c['id']==new_id),None)
        if old and new:
            for key in ['sources','aliases','keywords','questions','candidateRelated']:
                new[key]=unique(new.get(key,[])+old.get(key,[]))
            new['aliases']=unique(new.get('aliases',[])+[old['title'],old['english']])
            redirects[old_id]=new_id;merges.append([old_id,new_id]);cards.remove(old)
            for name,target in list(index.items()):
                if target['id']==old_id:index[name]=new
    overrides={
        'social-random-assignment':('foundations','研究设计'),
        'social-reliability-validity':('foundations','心理测量'),
        'personality-blis-data':('foundations','人格研究方法'),
        'personality-construct-validity':('foundations','心理测量'),
        'personality-effect-size':('foundations','理解研究结果'),
        'personality-replication-open-science':('foundations','研究可靠性'),
        'personality-convergent-validation':('foundations','心理测量'),
        'social-confirmation-bias':('cognition','判断与推理'),
        'social-schemas':('cognition','知识表征'),
        'personality-observational-learning':('learning','社会学习'),
        'social-broaden-build':('emotion','积极情绪'),
        'social-affective-forecasting':('emotion','情绪与判断'),
        'social-attachment':('development','依恋与关系'),
        'personality-psychosocial-development':('development','人格发展'),
        'personality-dimensional-personality-pathology':('clinical','人格与心理困扰'),
        'social-implicit-intelligence-theories':('learning','学习动机'),
        'social-teacher-expectancy':('learning','社会学习环境')
    }
    for c in cards:
        if c['id'] in overrides:c['domain'],c['subdomain']=overrides[c['id']]
    # Explicit editorial alias mappings. Do not conflate general and specialized mechanisms.
    alias_groups=[
        ['工作记忆模型','多成分工作记忆模型','工作记忆的多成分模型','Working memory model','Baddeley’s working memory model'],
        ['情绪评价理论','认知评价理论','情绪的认知评价','Appraisal theory'],
        ['大五人格','大五人格模型','五因素模型','Big Five','Big Five personality traits'],
        ['认知失调','认知失调理论','Cognitive dissonance'],
        ['依恋理论','依恋与安全基地','Attachment theory'],
        ['社会认同','社会认同理论','Social identity theory'],
        ['图式','图式理论','Schemas','Schema theory'],
        ['人格与情境','人与情境','人—情境交互','Person–situation interaction'],
        ['确认偏误','确认偏差','证实偏差','Confirmation bias'],
        ['情绪调节过程模型','情绪调节的过程模型','Process model of emotion regulation'],
        ['经典条件作用','经典条件反射','Classical conditioning'],
        ['操作性条件作用','操作条件作用','Operant conditioning'],
        ['观察学习','社会学习','Observational learning'],
        ['习惯化','Habituation'],
        ['损失厌恶','Loss aversion'],
        ['情感即信息','情绪即信息','Affect-as-information'],
        ['光流','光流与运动知觉','Optic flow'],
        ['易感性—压力模型','素质—压力模型','Diathesis–stress model']
    ]
    for group in alias_groups:
        found=[index[norm(name)] for name in group if norm(name) in index]
        if found:
            for name in group:index.setdefault(norm(name),found[0])
    edges=[];seen=set();unresolved=[]
    def link(a,b,reason,kind='关联阅读'):
        if a==b:return
        key=tuple(sorted([a,b]))
        if key in seen:return
        seen.add(key);edges.append({'source':a,'target':b,'reason':reason,'kind':kind})
    for c in cards:
        for candidate in c.get('candidateRelated',[]):
            name=candidate.get('id') or candidate.get('title') or candidate.get('concept') or candidate.get('name','')
            target=index.get(norm(redirects.get(name,name)))
            if target:
                link(c['id'],target['id'],candidate['reason'])
            else:unresolved.append({'from':c['id'],'target':name,'reason':candidate.get('reason','')})
    for chapter in chapters:
        chapter['cardIds']=unique([redirects.get(x,x) for x in chapter['cardIds']])
    degree=Counter(x for e in edges for x in (e['source'],e['target']))
    # An isolated card gets one factual same-chapter reading connection, explicitly labelled.
    for c in cards:
        if not degree[c['id']]:
            chapter=next((ch for ch in chapters if c['id'] in ch['cardIds'] and len(ch['cardIds'])>1),None)
            if chapter:
                other=next(x for x in chapter['cardIds'] if x!=c['id'])
                link(c['id'],other,'同章阅读：'+chapter['title'],'同章阅读')
                degree[c['id']]+=1;degree[other]+=1
    collection_specs=[
        ('judgment','判断与选择','理解人如何形成判断、权衡风险并做出选择。','把信息加工、情绪与决策放在一起阅读。','判断|决策|启发|前景|框架|偏误|偏差|推理|风险|记忆|注意|认知负荷|双加工'),
        ('self','自我与身份','从自我概念到群体归属，理解“我是谁”。','比较自我、文化、身份与自我维护的不同解释。','自我|认同|身份|失调|自尊|社会比较|印象管理|人格判断|自我建构'),
        ('social-life','群体中的个人','探索他人在场、群体规范与关系怎样影响行动。','沿着社会影响、合作与群体过程建立联系。','从众|规范|社会影响|群体|服从|合作|偏见|刻板|助人|利他|社会认同|道德|关系'),
        ('emotion','情绪如何产生与改变','从评价与身体反应，到记忆、判断和情绪调节。','留意不同理论如何解释同一种情绪体验。','情绪|情感|心境|评价理论|正念|反刍|躯体标记|应激|杏仁核'),
        ('learning','经验如何塑造行为','将条件作用、学习、习惯与动机联系起来。','比较重复接触、结果反馈与观察他人的作用。','条件作用|强化|习惯化|去敏化|脱敏|奖赏|奖励|观察学习|学习理论|联结|动机|目标|效能|模仿'),
        ('person-context','个体与情境','理解稳定差异怎样与环境共同作用。','将人格、文化和情境放进同一个阅读视野。','人格|特质|气质|情境|遗传|易感|基因|文化|依恋|个体差异|相互决定'),
        ('development','成长与关系','关注认知、情绪和社会关系随时间的变化。','从发展过程理解稳定、改变与早期经验。','发展|儿童|童年|依恋|教养|社会化|气质|心智理论|道德发展|游戏|韧性'),
        ('evidence','如何理解心理学证据','从测量与研究设计，到不同解释的比较。','在阅读理论时，理解它依靠什么样的证据。','实验|研究|方法|测量|效度|信度|分离|可重复|复制|开放科学|因果|相关|评估|人群|心理测量')
    ]
    collections=[]
    for cid,title,description,prompt,pattern in collection_specs:
        ids=[c['id'] for c in cards if re.search(pattern,' '.join([c['title'],c['subdomain']]+c.get('keywords',[])))]
        collections.append({'id':cid,'title':title,'description':description,'prompt':prompt,'cardIds':ids})
    known={c['id'] for c in cards}
    for p in (ROOT/'knowledge/cards').glob('*.md'):
        if not p.name.startswith('._') and p.stem not in known:p.unlink()
    for c in cards:write_card(c)
    for name,obj in [('relations',edges),('chapters',chapters),('collections',collections)]:
        (ROOT/'knowledge'/f'{name}.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2))
    report={'inputCards':len(incoming),'uniqueCards':len(cards),'chapters':len(chapters),'relations':len(edges),'merges':merges,'unresolvedRelations':unresolved,'chapterCounts':dict(Counter(ch['book'] for ch in chapters))}
    (ROOT/'knowledge/整理记录.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='unresolvedRelations'},ensure_ascii=False))
    print('Unresolved relation candidates:',len(unresolved))

if __name__=='__main__':curate(sys.argv[1:])
