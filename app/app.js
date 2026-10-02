(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('atlas-data').textContent);
  const byId = Object.fromEntries(D.cards.map(c => [c.id,c]));
  const byDomain = Object.fromEntries(D.domains.map(d => [d.id,d]));
  const byBook = Object.fromEntries(D.books.map(b => [b.id,b]));
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    nodes:'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
    book:'<path d="M12 6c-3-3-7-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2c0-4 12-4 12 0v2M17 5a3 3 0 0 1 0 6m1 4c2 0 4 1 4 3v2"/>',
    pulse:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    fingerprint:'<path d="M4 11a8 8 0 0 1 16 0m-4 8c1-2 1-5 1-8a5 5 0 0 0-10 0c0 3 0 6-2 9m7-12a3 3 0 0 0-2 3c0 4 0 7-2 11m5-11c0 5 0 8-1 11m8-9c0 3 0 5-1 8"/>',
    cycle:'<path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5"/>',
    growth:'<path d="M12 21V11m0 4c-7 0-9-4-9-8 7 0 9 4 9 8Zm0-4c7 0 9-4 9-8-7 0-9 4-9 8Z"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
    leaf:'<path d="M20 3C8 2 3 6 4 13s9 9 13 3c3-4 3-9 3-13ZM3 22l12-13"/>',
    copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 5V3H3v13h2"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.nodes}</svg>`;
  const domainCount = id => D.cards.filter(c=>c.domain===id).length;
  const related = id => D.relations.filter(r=>r.source===id||r.target===id).map(r=>({...r,other:r.source===id?r.target:r.source})).filter(r=>byId[r.other]);
  let limit=24, zoom=1, searchTimer, toastTimer, lastFocus;
  const readRoute = () => Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  let route=readRoute();
  function navigate(values,replace=false) {
    route={...values};
    const params=new URLSearchParams();
    Object.entries(route).forEach(([key,value])=>{if(value)params.set(key,value)});
    const hash='#'+params.toString();
    if(replace){history.replaceState(null,'',hash);render();}
    else if(location.hash===hash){render();}
    else location.hash=hash;
  }
  function normal(text) {return String(text).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").trim();}
  const synonyms=[
    ['习惯','习惯化','反复接触','重复刺激','适应','habituation','去敏化','脱敏'],
    ['群体压力','从众','社会影响','规范性影响','同伴','合群'],
    ['记不住','忘记','记忆','遗忘','记住','memory'],
    ['注意力','分心','注意','集中','选择性注意','attention'],
    ['情绪管理','调节情绪','情绪调节','认知重评','压抑','emotion regulation'],
    ['做决定','选择','决策','判断','decision','启发式','风险'],
    ['失去','得到','得失','损失厌恶','前景理论','参照点'],
    ['如果','那么','具体计划','行动线索','实施意图','if–then'],
    ['同一件事','同一事件','不同感受','认知评价','评价理论','个人关切'],
    ['自我矛盾','言行不一','认知失调','自我辩护','dissonance'],
    ['人的差异','个体差异','人格','性格','特质','personality'],
    ['奖励','奖赏','强化','操作性条件作用','reinforcement'],
    ['群体认同','社会认同','身份','内群体','外群体','identity'],
    ['成长','儿童','发展','童年','development'],
    ['关系','依恋','亲密','安全感','attachment'],
    ['害怕','恐惧','焦虑','威胁','fear'],
    ['愤怒','生气','情绪','anger'],
    ['先入为主','偏见','刻板印象','图式','期待'],
    ['归因','原因','解释行为','情境','attribution'],
    ['控制自己','自控','意志力','目标','自我调节'],
    ['方法','实验','测量','因果','研究设计','信度','效度']
  ];
  function searchCards(query) {
    const q=normal(query); if(!q)return [];
    const raw=q.split(/[\s，。？！、,?.!;；:：]+/).filter(Boolean);
    const terms=new Set(raw);
    const expanded=new Set();
    synonyms.forEach(group=>{if(group.some(t=>q.includes(t)))group.forEach(t=>expanded.add(t))});
    const ignored=['为什么','怎么','如何','什么','哪些','一个','我们','自己','时候','可以','可能','心理学','理论','影响','有关','想要','了解','探索','现象','容易','的人','了','的'];
    let clean=q; ignored.forEach(w=>clean=clean.split(w).join(' '));
    clean.split(/\s+/).filter(t=>t.length>1).forEach(t=>terms.add(t));
    const grams=new Set();
    [...terms].forEach(t=>{if(/[\u4e00-\u9fff]/.test(t)&&t.length>3)for(let i=0;i<t.length-1;i++)grams.add(t.slice(i,i+2))});
    return D.cards.map(c=>{
      const name=normal([c.title,c.english,...(c.aliases||[])].join(' '));
      const tags=normal([c.subdomain,...(c.keywords||[])].join(' '));
      const short=normal(c.summary+' '+(c.questions||[]).join(' '));
      const body=normal(c.sections.map(s=>s.text).join(' '));
      let score=0, reasons=[];
      if(name.includes(q)){score+=120;reasons.push('名称匹配')}
      if(tags.includes(q)){score+=50;reasons.push('主题匹配')}
      if(q.includes(normal(c.title))){score+=70;if(!reasons.length)reasons.push('名称匹配')}
      for(const word of c.keywords||[]){
        const t=normal(word);
        if(t.length>1&&q.includes(t)){score+=Math.min(12+t.length*2,24);if(reasons.length<2)reasons.push(word)}
      }
      for(const t of terms){
        if(name.includes(t))score+=40;
        else if(tags.includes(t))score+=20;
        else if(short.includes(t))score+=12;
        else if(t.length>1&&body.includes(t))score+=4;
      }
      let hits=0;
      for(const t of expanded){if(name.includes(t)||tags.includes(t)){score+=9;hits++;if(reasons.length<2)reasons.push(t)}}
      let gramHits=0;for(const t of grams)if(name.includes(t)||tags.includes(t))gramHits++;
      if(gramHits>=2)score+=Math.min(gramHits*3,18);
      let questionHits=0;for(const t of grams)if(short.includes(t))questionHits++;
      if(questionHits>=2)score+=Math.min(questionHits*4,20);
      if(score<9)score=0;
      return {card:c,score,reasons:[...new Set(reasons)].slice(0,2)};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.card.title.localeCompare(b.card.title,'zh-CN'));
  }
  window.PsychologyAtlas={data:D,search:searchCards,related};
  const titles={domains:'领域浏览',network:'知识网络',collections:'主题集合',books:'教材索引'};
  document.getElementById('app').innerHTML=`
    <aside class="sidebar" id="sidebar" aria-label="主导航">
      <button class="brand" data-view="domains" aria-label="心理学图谱首页"><span class="brand-mark" aria-hidden="true">ψ</span><span><span class="brand-title">心理学图谱</span><span class="brand-en" style="display:block">PSYCHOLOGY ATLAS</span></span></button>
      <nav class="side-section" aria-label="浏览方式"><div class="side-label">我的知识库</div>${[['domains','grid'],['network','nodes'],['collections','layers'],['books','book']].map(([v,i])=>`<button class="nav-button" data-view="${v}">${icon(i)}<span>${titles[v]}</span>${v==='books'?'<span class="nav-num">05</span>':''}</button>`).join('')}</nav>
      <nav class="side-section domain-nav" aria-label="心理学领域"><div class="side-label">按领域探索</div>${D.domains.map(d=>`<button class="nav-button" data-domain="${d.id}"><i class="domain-dot" style="--color:${d.color}"></i><span>${d.name}</span><span class="nav-num">${domainCount(d.id)}</span></button>`).join('')}</nav>
      <div class="sidebar-footer"><button data-action="export-all">${icon('download')}导出 Markdown</button><p>${D.books.length} 本教材 · ${D.cards.length} 张知识卡片</p></div>
    </aside><div class="mobile-shade" data-action="close-menu"></div>
    <div class="shell"><header class="topbar"><button class="menu-button" data-action="menu" aria-label="展开导航" aria-expanded="false">${icon('menu')}</button><div class="breadcrumbs" id="breadcrumbs"></div><form class="search-box" id="search-form" role="search">${icon('search')}<input id="search-input" type="search" autocomplete="off" aria-label="搜索理论、关键词或想探索的问题" placeholder="搜索理论、关键词，或一个问题…"><button type="button" class="search-clear" id="search-clear" aria-label="清除搜索" data-action="clear-search" hidden>×</button><kbd aria-hidden="true">⌘ K</kbd></form></header><main class="main" id="main" tabindex="-1"></main></div>`;
  const main=document.getElementById('main');
  const dialog=document.getElementById('card-dialog');
  const searchInput=document.getElementById('search-input');
  function heading(title,subtitle,eyebrow='EXPLORE',meta='') {
    return `<div class="page-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${subtitle?`<p class="subtitle">${esc(subtitle)}</p>`:''}</div>${meta?`<div class="heading-meta">${meta}</div>`:''}</div>`;
  }
  function cardHTML(c,reason='') {
    const d=byDomain[c.domain];
    const sourceBooks=[...new Set(c.sources.map(s=>s.book))];
    return `<button class="theory-card" data-card="${esc(c.id)}" style="--color:${d.color}"><div class="card-top"><span class="domain-tag"><i class="domain-dot"></i>${esc(c.subdomain)}</span><span class="kind">${esc(c.kind)}</span></div><h3>${esc(c.title)}</h3><div class="english">${esc(c.english)}</div><p class="summary">${esc(c.summary)}</p>${reason?`<p class="match-reason">关联：${esc(reason)}</p>`:''}<div class="card-footer"><span>${esc(sourceBooks.length===1?byBook[sourceBooks[0]].short:sourceBooks.length+' 本教材')}</span><span>${related(c.id).length} 个关联</span></div></button>`;
  }
  function grid(cards,reasons={}) {return `<div class="card-grid">${cards.slice(0,limit).map(c=>cardHTML(c,reasons[c.id]||'')).join('')||empty('这里还没有卡片','试试其他子领域或搜索词。')}</div>${cards.length>limit?`<div class="load-more"><button class="button secondary" data-action="load-more">再看 ${Math.min(24,cards.length-limit)} 张 · 共 ${cards.length} 张</button></div>`:''}`;}
  function empty(title,subtitle) {return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(subtitle)}</p><div class="suggestions">${['群体压力','记忆','情绪调节'].map(q=>`<button class="suggestion" data-search="${q}">${q}</button>`).join('')}</div></div>`;}
  function footer() {return `<footer class="page-foot"><span>依据本地教材整理 · PDF 定位采用文件页序</span><span>更新于 ${D.updated}</span></footer>`;}
  function home() {
    if(route.domain&&byDomain[route.domain])return domainPage();
    const featured=pickCards(['认知失调','工作记忆','情绪评价','人与情境','经典条件','社会认同']);
    return heading('从一个领域，开始探索','沿着理论、模型与心理过程，建立对心理学的整体理解。','YOUR KNOWLEDGE ATLAS',`<b>${D.cards.length}</b> 张知识卡片`)+`
    <div class="overview"><div class="domain-grid">${D.domains.map(d=>`<button class="domain-tile" data-domain="${d.id}" style="--color:${d.color}"><div class="domain-top"><span class="domain-icon">${icon(d.icon)}</span><span class="domain-count">${domainCount(d.id)} 张卡片</span></div><h2>${d.name}</h2><div class="domain-en">${d.english}</div><p>${d.description}</p></button>`).join('')}</div>
    <aside class="reading-note"><p class="eyebrow">A CONNECTED LIBRARY</p><h2>让知识逐渐连起来</h2><p>从卡片理解一个概念，再沿着关联，看看它与其他解释有什么联系。</p><div class="reading-rule"></div><div class="stat-line"><span>参考教材</span><strong>${D.books.length}</strong></div><div class="stat-line"><span>覆盖章节与模块</span><strong>${D.chapters.length}</strong></div><div class="stat-line"><span>卡片关联</span><strong>${D.relations.length}</strong></div><div class="reading-rule"></div><p>也可以从一个问题开始</p><div class="suggestions">${['为什么会习惯','群体压力','如何做决定'].map(q=>`<button class="suggestion" data-search="${q}">${q}</button>`).join('')}</div></aside></div>
    <div class="section-row"><h2>打开一张知识卡片</h2><button class="text-button" data-view="network">在知识网络中探索</button></div>${grid(featured)}${footer()}`;
  }
  function pickCards(names) {
    const chosen=names.map(t=>D.cards.find(c=>c.title.includes(t))).filter(Boolean);
    for(const c of D.cards)if(chosen.length<6&&!chosen.includes(c))chosen.push(c);
    return chosen.slice(0,6);
  }
  function domainPage() {
    const d=byDomain[route.domain];let cards=D.cards.filter(c=>c.domain===d.id);
    const subs=[...new Set(cards.map(c=>c.subdomain))];
    const filters=`<div class="filter-bar" aria-label="子领域筛选"><button class="filter-chip ${!route.sub?'active':''}" data-sub="">全部<span>${cards.length}</span></button>${subs.map(s=>`<button class="filter-chip ${route.sub===s?'active':''}" data-sub="${esc(s)}">${esc(s)}<span>${cards.filter(c=>c.subdomain===s).length}</span></button>`).join('')}</div>`;
    if(route.sub)cards=cards.filter(c=>c.subdomain===route.sub);
    return heading(d.name,d.description,d.english,`<b>${cards.length}</b> 张知识卡片`)+filters+grid(cards)+footer();
  }
  function searchPage() {
    const results=searchCards(route.q);const matches={};results.forEach(r=>matches[r.card.id]=r.reasons.join(' · '));
    return heading(`探索「${route.q}」`,'搜索名称、中英文别名、主题与卡片正文。','SEARCH THE ATLAS')+
      `<div class="search-info"><strong>${results.length}</strong> 张相关卡片<span>·</span><span>按相关程度排列</span></div>`+
      (results.length?grid(results.map(r=>r.card),matches):empty('暂时没有找到相关卡片','换成简短的概念或关键词试试，例如“注意”“归因”“奖赏”。'))+footer();
  }
  function collectionPage() {
    const current=D.collections.find(c=>c.id===route.collection);
    if(current){const cards=current.cardIds.map(id=>byId[id]).filter(Boolean);return heading(current.title,current.description,'THEMATIC COLLECTION',`<b>${cards.length}</b> 张卡片`)+`<p class="collection-intro">${esc(current.prompt||'沿着同一个问题，阅读来自不同领域的解释。')}</p>`+grid(cards)+footer()}
    return heading('把相关的知识，放在一起','围绕一个主题，跨越领域边界阅读。','THEMATIC COLLECTIONS')+`<div class="collection-grid">${D.collections.map((c,i)=>{const domains=[...new Set(c.cardIds.map(id=>byId[id]?.domain).filter(Boolean))];return `<button class="collection-tile" data-collection="${c.id}"><div class="collection-number">${String(i+1).padStart(2,'0')}</div><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><div class="collection-bottom"><span>${c.cardIds.length} 张卡片 · ${domains.length} 个领域</span><span class="domain-dots">${domains.map(d=>`<i style="--color:${byDomain[d].color}"></i>`).join('')}</span></div></button>`}).join('')}</div>${footer()}`;
  }
  function booksPage() {
    return heading('五本教材，一张知识地图','逐章整理核心概念；卡片保留原书章节及具体位置。','SOURCE LIBRARY')+`<div class="book-list">${D.books.map((b,i)=>{const chapters=D.chapters.filter(c=>c.book===b.id);const count=D.cards.filter(c=>c.sources.some(s=>s.book===b.id)).length;return `<details class="book-panel" ${route.book===b.id?'open':''}><summary class="book-header"><div class="book-spine" style="--color:${b.color}" aria-hidden="true"><span>${i+1}</span><small>${b.format}</small></div><div class="book-heading"><h2>${esc(b.title)}</h2><p>${esc(b.authors)}</p><p>${esc(b.edition)}${b.year?' · '+esc(b.year):''} · ${esc(b.description)}</p></div><div class="book-progress"><strong>${chapters.length} 个章节 / 模块</strong>${count} 张关联卡片</div></summary><div class="chapter-list">${chapters.map(ch=>`<div class="chapter-row"><div class="chapter-top"><strong>${esc(ch.title)}</strong><span>${ch.pdfStart?'PDF '+ch.pdfStart+'–'+ch.pdfEnd:'EPUB 章节定位'}</span></div><div class="chapter-links">${ch.cardIds.filter(id=>byId[id]).map(id=>`<button data-card="${id}">${esc(byId[id].title)}</button>`).join('')}</div></div>`).join('')||'<p class="source-note">章节索引整理中。</p>'}</div></details>`}).join('')}</div><p class="source-note">PDF 页数为当前文件的页序，可能与纸书印刷页码不同。EPUB 以章节和小节定位。卡片是对教材核心内容的学习整理，完整论证与图表请参阅原书。</p>${footer()}`;
  }
  function networkPage() {
    const focus=byId[route.focus];
    const suggestions=pickCards(['认知失调','工作记忆','情绪评价','人与情境']);
    const picks=`<div class="graph-picks"><span class="small muted" style="align-self:center">从一张卡开始</span>${suggestions.slice(0,4).map(c=>`<button class="suggestion" data-focus="${c.id}">${esc(c.title)}</button>`).join('')}</div>`;
    return heading(focus?focus.title+'的知识网络':'在联系中，理解知识',focus?'点击相邻节点，继续沿着概念探索。':'每个点是一张卡片。点击节点，展开它的关联。','KNOWLEDGE NETWORK')+picks+
      `<div class="${focus?'network-detail':''}"><div><div class="graph-panel"><div class="graph-toolbar"><select id="network-domain" aria-label="筛选知识网络领域"><option value="">全部领域</option>${D.domains.map(d=>`<option value="${d.id}" ${route.graphDomain===d.id?'selected':''}>${d.name}</option>`).join('')}</select><div class="graph-tools"><button data-action="zoom-out" aria-label="缩小网络">${icon('minus')}</button><button data-action="zoom-in" aria-label="放大网络">${icon('plus')}</button><button data-action="graph-reset" aria-label="返回完整网络">${icon('reset')}</button></div></div><div class="graph-wrap">${networkSVG(focus)}</div><div class="graph-footer"><span>${focus?`${related(focus.id).length} 个直接关联`:`${route.graphDomain?domainCount(route.graphDomain):D.cards.length} 个知识节点`}</span><span>连线表示阅读关联，具体关系见卡片说明</span></div></div><div class="graph-legend">${D.domains.map(d=>`<span><i class="domain-dot" style="--color:${d.color}"></i>${d.name}</span>`).join('')}</div></div>${focus?networkAside(focus):''}</div>${footer()}`;
  }
  function networkAside(c){const rel=related(c.id);return `<aside class="network-side" style="--color:${byDomain[c.domain].color}"><span class="domain-tag"><i class="domain-dot"></i>${byDomain[c.domain].name}</span><h2>${esc(c.title)}</h2><div class="english">${esc(c.english)}</div><p>${esc(c.summary)}</p><button class="button" data-card="${c.id}">阅读知识卡片</button><div class="relation-list">${rel.map(r=>`<button class="relation-item" data-focus="${r.other}"><strong>${esc(byId[r.other].title)}</strong><span>${esc(r.reason)}</span></button>`).join('')||'<p>这张卡片暂未连接其他卡片。</p>'}</div></aside>`;}
  function networkSVG(focus){
    const points=new Map();let cards, edges; const compact=window.innerWidth<600; const centerX=focus?380:550, centerY=focus?300:355;
    if(focus){
      const neighbors=related(focus.id).map(r=>byId[r.other]); cards=[focus,...neighbors];
      points.set(focus.id,{x:380,y:300,r:30});
      neighbors.forEach((c,i)=>{const a=-Math.PI/2+i*2*Math.PI/Math.max(neighbors.length,1);points.set(c.id,{x:380+245*Math.cos(a),y:300+200*Math.sin(a),r:19})});
      edges=D.relations.filter(e=>(e.source===focus.id||e.target===focus.id)&&points.has(e.source)&&points.has(e.target));
    }else{
      cards=D.cards.filter(c=>!route.graphDomain||c.domain===route.graphDomain);
      const domains=D.domains.filter(d=>cards.some(c=>c.domain===d.id));
      domains.forEach((d,i)=>{
        const a=-Math.PI/2+i*2*Math.PI/Math.max(domains.length,1);
        const center=domains.length===1?{x:550,y:350}:{x:550+360*Math.cos(a),y:350+230*Math.sin(a)};
        const group=cards.filter(c=>c.domain===d.id);
        const radius=domains.length===1?250:Math.min(110,Math.max(65,Math.sqrt(group.length)*17));
        group.forEach((c,j)=>{const theta=j*2.399963;const r=radius*Math.sqrt((j+.6)/group.length);points.set(c.id,{x:center.x+Math.cos(theta)*r*(domains.length===1?1.4:1),y:center.y+Math.sin(theta)*r,r:domains.length===1?10:6+Math.min(related(c.id).length,8)*.45})});
      });
      edges=D.relations.filter(e=>points.has(e.source)&&points.has(e.target));
    }
    const visibleIds=new Set(cards.map(c=>c.id));
    let svg=`<svg class="network-svg ${focus?'focus-network':''}" viewBox="${focus?'0 0 760 620':'0 0 1100 710'}" role="group" aria-label="${focus?esc(focus.title)+'的关联网络':'心理学卡片知识网络'}"><g id="graph-layer" data-cx="${centerX}" data-cy="${centerY}" transform="translate(${centerX} ${centerY}) scale(${zoom}) translate(-${centerX} -${centerY})">`;
    svg+=edges.map(e=>{const a=points.get(e.source),b=points.get(e.target);return `<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="${focus?'opacity:.5;stroke-width:1.5':''}"/>`}).join('');
    if(!focus){const domains=D.domains.filter(d=>cards.some(c=>c.domain===d.id));svg+=domains.map((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/domains.length;const x=domains.length===1?550:550+360*Math.cos(a),y=domains.length===1?32:350+230*Math.sin(a)-Math.min(110,Math.max(65,Math.sqrt(cards.filter(c=>c.domain===d.id).length)*17))-19;return `<text class="domain-label" x="${x}" y="${Math.max(y,24)}">${d.name}</text>`}).join('')}
    svg+=cards.map(c=>{const p=points.get(c.id);const center=c.id===focus?.id;const showLabel=!!focus||cards.length<35;return `<g class="node ${center?'center':''}" role="button" tabindex="0" data-focus="${c.id}" aria-label="${esc(c.title)}，${related(c.id).length} 个关联"><title>${esc(c.title)} · ${esc(c.english)}</title><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${byDomain[c.domain].color}" opacity="${center?1:.88}"/>${showLabel?`<text class="node-label" x="${p.x}" y="${p.y+p.r+23}">${esc(c.title.length>(compact?5:13)?c.title.slice(0,compact?4:12)+'…':c.title)}</text>`:''}</g>`}).join('');
    return svg+'</g></svg>';
  }
  function showCard(c){
    const d=byDomain[c.domain];const rel=related(c.id);
    dialog.innerHTML=`<div class="dialog-top"><span class="domain-tag" style="--color:${d.color}"><i class="domain-dot"></i>${d.name} / ${esc(c.subdomain)}</span><div class="dialog-actions"><button class="icon-button" data-action="export-card" aria-label="下载这张卡片的 Markdown">${icon('download')}</button><button class="icon-button" data-action="close-card" aria-label="关闭卡片" autofocus>${icon('close')}</button></div></div><article class="dialog-body" style="--color:${d.color}"><header class="dialog-heading"><span class="kind">${esc(c.kind)}</span><h1 id="dialog-title">${esc(c.title)}</h1><div class="english">${esc(c.english)}</div></header><p class="card-lead">${esc(c.summary)}</p>${c.sections.map(s=>`<section class="detail-section"><h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p></section>`).join('')}<section class="detail-section"><h2>关联知识</h2><div class="dialog-related">${rel.map(r=>`<button class="relation-item" data-card="${r.other}"><strong>${esc(byId[r.other].title)}</strong><span>${esc(r.reason)}</span></button>`).join('')||'<p>后续阅读中继续补充关联。</p>'}</div></section><section class="detail-section"><h2>教材出处</h2>${c.sources.map(s=>{const b=byBook[s.book];return `<div class="source-box"><strong>${esc(b.title)} · ${esc(b.edition)}</strong><p>${esc(s.chapter)}<br>${esc(s.locator)}</p>${location.protocol==='file:'?`<a href="../../books/${encodeURIComponent(b.filename)}${s.pdfPages?.length?'#page='+s.pdfPages[0]:''}" target="_blank" rel="noopener">打开本地原书</a>`:''}</div>`}).join('')}<p class="dialog-note">PDF 页码为文件页序；EPUB 使用章节与小节定位。例子中的“理解用例”为辅助理解的自编情境。</p></section><div class="detail-tags">${(c.keywords||[]).slice(0,8).map(t=>`<button data-search="${esc(t)}">${esc(t)}</button>`).join('')}</div></article><div class="dialog-footer"><button class="button" data-focus="${c.id}">${icon('nodes')}在网络中查看</button><button class="button secondary" data-action="export-card">${icon('download')}下载 Markdown</button></div>`;
    if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('body-lock')}
    dialog.scrollTop=0;
  }
  function render(){
    const view=route.view||'domains';
    document.title=(route.q?'搜索 · ':route.domain&&byDomain[route.domain]?byDomain[route.domain].name+' · ':titles[view]+' · ')+'心理学图谱';
    main.innerHTML=route.q?searchPage():view==='network'?networkPage():view==='collections'?collectionPage():view==='books'?booksPage():home();
    document.getElementById('breadcrumbs').innerHTML=`<span>知识库</span><span class="separator">/</span><strong>${esc(route.q?'搜索':route.domain&&byDomain[route.domain]?byDomain[route.domain].name:titles[view]||titles.domains)}</strong>`;
    document.querySelectorAll('.sidebar [data-view]').forEach(b=>{const active=b.dataset.view===view&&!route.domain&&!route.q;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    document.querySelectorAll('.sidebar [data-domain]').forEach(b=>{const active=b.dataset.domain===route.domain&&!route.q;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    if(document.activeElement!==searchInput)searchInput.value=route.q||'';
    document.getElementById('search-clear').hidden=!route.q;
    if(route.card&&byId[route.card])showCard(byId[route.card]);
    else if(dialog.open){dialog.close();document.body.classList.remove('body-lock');if(lastFocus?.isConnected)lastFocus.focus()}
  }
  function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
  function download(filename,text){const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Markdown 已准备下载')}
  function cardMarkdown(c){let text=`# ${c.title}\n\n${c.english}\n\n${c.kind} / ${byDomain[c.domain].name} / ${c.subdomain}\n\n${c.summary}\n`;c.sections.forEach(s=>text+=`\n## ${s.heading}\n\n${s.text}\n`);text+='\n## 教材出处\n\n';c.sources.forEach(s=>text+=`- ${byBook[s.book].title}，${byBook[s.book].edition}；${s.chapter}；${s.locator}\n`);if(related(c.id).length){text+='\n## 关联知识\n\n';related(c.id).forEach(r=>text+=`- ${byId[r.other].title}：${r.reason}\n`)}return text}
  function exportAll(){let text=`# 心理学图谱\n\n更新：${D.updated}\n\n${D.books.length} 本教材 · ${D.cards.length} 张卡片 · ${D.chapters.length} 个章节与模块\n\n`;D.domains.forEach(d=>{text+=`\n# ${d.name}\n\n`;D.cards.filter(c=>c.domain===d.id).forEach(c=>text+=cardMarkdown(c).replace(/^#/gm,'##')+'\n---\n')});download('心理学知识库.md',text)}
  function closeMenu(){document.getElementById('sidebar').classList.remove('open');document.querySelector('[data-action="menu"]').setAttribute('aria-expanded','false')}
  function clickHandler(event){
    const el=event.target.closest('[data-view],[data-domain],[data-sub],[data-card],[data-search],[data-collection],[data-focus],[data-action]');if(!el)return;
    if(el.dataset.view){limit=24;zoom=1;navigate({view:el.dataset.view});closeMenu();window.scrollTo(0,0)}
    else if(el.dataset.domain){limit=24;navigate({view:'domains',domain:el.dataset.domain});closeMenu();window.scrollTo(0,0)}
    else if('sub' in el.dataset){limit=24;navigate({view:'domains',domain:route.domain,sub:el.dataset.sub})}
    else if(el.dataset.card){navigate({...route,card:el.dataset.card})}
    else if(el.dataset.search){limit=24;searchInput.value=el.dataset.search;navigate({view:'domains',q:el.dataset.search});window.scrollTo(0,0)}
    else if(el.dataset.collection){limit=24;navigate({view:'collections',collection:el.dataset.collection});window.scrollTo(0,0)}
    else if(el.dataset.focus){zoom=1;navigate({view:'network',focus:el.dataset.focus});window.scrollTo(0,0)}
    else {switch(el.dataset.action){
      case'menu':document.getElementById('sidebar').classList.toggle('open');el.setAttribute('aria-expanded',document.getElementById('sidebar').classList.contains('open'));break;
      case'close-menu':closeMenu();break;
      case'close-card':{const{card,...rest}=route;navigate(rest,true);break}
      case'clear-search':searchInput.value='';limit=24;navigate({view:'domains'},true);searchInput.focus();break;
      case'load-more':limit+=24;render();break;
      case'export-all':exportAll();break;
      case'export-card':if(byId[route.card])download(byId[route.card].title+'.md',cardMarkdown(byId[route.card]));break;
      case'zoom-in':zoom=Math.min(zoom+.2,2);updateZoom();break;
      case'zoom-out':zoom=Math.max(zoom-.2,.6);updateZoom();break;
      case'graph-reset':zoom=1;navigate({view:'network'});break;
    }}
  }
  function updateZoom(){const layer=document.getElementById('graph-layer');if(layer){const{x,y}={x:layer.dataset.cx,y:layer.dataset.cy};layer.setAttribute('transform',`translate(${x} ${y}) scale(${zoom}) translate(-${x} -${y})`)}}
  document.addEventListener('click',clickHandler);
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(dialog.open){const{card,...rest}=route;navigate(rest,true)}searchInput.focus();searchInput.select()}if((event.key==='Enter'||event.key===' ')&&event.target.matches('g.node')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
  searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{limit=24;navigate({view:'domains',q:searchInput.value.trim()},true)},180)});
  document.getElementById('search-form').addEventListener('submit',event=>{event.preventDefault();clearTimeout(searchTimer);limit=24;navigate({view:'domains',q:searchInput.value.trim()},true)});
  document.addEventListener('change',event=>{if(event.target.id==='network-domain'){zoom=1;navigate({view:'network',graphDomain:event.target.value})}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();const{card,...rest}=route;navigate(rest,true)});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom){const{card,...rest}=route;navigate(rest,true)}}});
  window.addEventListener('hashchange',()=>{route=readRoute();render()});
  render();
  if(['localhost','127.0.0.1'].includes(location.hostname)){
    fetch('/__version').then(r=>r.ok?r.json():null).then(first=>{
      if(!first)return;
      setInterval(()=>fetch('/__version',{cache:'no-store'}).then(r=>r.json()).then(next=>{if(next.version!==first.version)location.reload()}).catch(()=>{}),2500);
    }).catch(()=>{});
  }
})();
