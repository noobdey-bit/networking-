/* ============ utils ============ */
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function logMsg(logEl, text){
  const p=document.createElement('div');
  p.className='logline';
  p.textContent=text;
  logEl.appendChild(p);
  logEl.scrollTop=logEl.scrollHeight;
}
function clearLog(logEl){ logEl.innerHTML=''; }
function moveDotThroughNodes(track, dot, nodeEls, stepDelay){
  stepDelay = stepDelay || 650;
  dot.classList.add('show');
  return new Promise(resolve=>{
    let i=0;
    function step(){
      if(i>=nodeEls.length){ resolve(); return; }
      const tr=track.getBoundingClientRect();
      const nr=nodeEls[i].getBoundingClientRect();
      dot.style.left=(nr.left-tr.left+nr.width/2)+'px';
      dot.style.top=(nr.top-tr.top+nr.height/2)+'px';
      i++;
      setTimeout(step, stepDelay);
    }
    step();
  });
}
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

/* ============ theme toggle ============ */
const themeToggle=document.getElementById('themeToggle');
const htmlEl=document.documentElement;
function applyThemeIcon(){
  const t=htmlEl.getAttribute('data-theme');
  themeToggle.querySelector('.knob').textContent = t==='dark' ? '🌙':'☀️';
}
applyThemeIcon();
themeToggle.addEventListener('click', ()=>{
  const c=htmlEl.getAttribute('data-theme');
  htmlEl.setAttribute('data-theme', c==='dark' ? 'light':'dark');
  applyThemeIcon();
});

/* ============ page routing (SPA) ============ */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target=document.getElementById('page-'+id) || document.getElementById('page-home');
  target.classList.add('active');
  document.querySelectorAll('.navlist a').forEach(a=>a.classList.remove('active'));
  const navA=document.querySelector('.navlist a[data-target="'+id+'"]');
  if(navA) navA.classList.add('active');
  document.querySelector('main').scrollTo(0,0);
  history.replaceState(null,'','#'+id);
}
document.querySelectorAll('.navgo').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    showPage(a.dataset.target);
  });
});
window.addEventListener('hashchange', ()=>{
  showPage(location.hash.replace('#','')||'home');
});
showPage(location.hash.replace('#','')||'home');

/* ============ mark-as-read progress ============ */
const totalTopics=30;
const readSet=new Set();
const progressFill=document.getElementById('progressFill');
const progressText=document.getElementById('progressText');
function updateProgress(){
  const n=readSet.size;
  progressFill.style.width=(n/totalTopics*100)+'%';
  progressText.textContent=n+' / '+totalTopics+' पूरा भयो';
}
document.querySelectorAll('.mark-read').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id=btn.dataset.topic;
    const navItem=document.querySelector('.navlist a[data-topic="'+id+'"]');
    if(readSet.has(id)){
      readSet.delete(id); btn.classList.remove('done'); btn.textContent='○ पढिसकें';
      navItem && navItem.classList.remove('done');
    } else {
      readSet.add(id); btn.classList.add('done'); btn.textContent='✓ पढियो';
      navItem && navItem.classList.add('done');
    }
    updateProgress();
  });
});

/* ============ T1: Network ============ */
(function(){
  const cutBtn=document.getElementById('t1-cut');
  const castBtn=document.getElementById('t1-cast');
  const resetBtn=document.getElementById('t1-reset');
  const arrow1=document.getElementById('t1-cutarrow');
  const arrow2=document.getElementById('t1-cutarrow2');
  const log=document.getElementById('t1log');
  const dot=document.getElementById('t1dot');
  const track=document.getElementById('t1trackLAN');
  let cut=false;
  logMsg(log,'Simulator तयार छ। Button थिच्नुहोस्।');
  cutBtn.addEventListener('click', ()=>{
    cut=!cut;
    arrow1.classList.toggle('cut',cut);
    arrow2.classList.toggle('cut',cut);
    cutBtn.textContent = cut ? '🔌 Internet line जोड्नुहोस्' : '🔌 Internet line काट्नुहोस्';
    logMsg(log, cut ? '❌ Internet line काटियो — ISP सम्म संकेत पुग्दैन।' : '✅ Internet line फेरि जोडियो।');
  });
  castBtn.addEventListener('click', async ()=>{
    castBtn.disabled=true;
    const nodes=[document.getElementById('t1-phone'),document.getElementById('t1-router'),document.getElementById('t1-tv')];
    logMsg(log,'▶ Phone ले TV लाई video cast पठाउँदैछ...');
    await moveDotThroughNodes(track, dot, nodes, 550);
    dot.classList.remove('show');
    logMsg(log,'✅ Local network ले काम गर्‍यो! TV मा video देखियो — Internet चाहिएन।');
    if(cut) logMsg(log,'ℹ️ Internet अझै काटिएकै छ, त्यसैले YouTube जस्तो website भने खोल्न सकिँदैन।');
    castBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    cut=false; arrow1.classList.remove('cut'); arrow2.classList.remove('cut');
    cutBtn.textContent='🔌 Internet line काट्नुहोस्';
    clearLog(log); logMsg(log,'Reset भयो।');
  });
})();

/* ============ T2: DNS Lookup ============ */
(function(){
  const goBtn=document.getElementById('t2-go');
  const resetBtn=document.getElementById('t2-reset');
  const input=document.getElementById('t2-domain');
  const log=document.getElementById('t2log');
  const track=document.getElementById('t2track');
  const dot=document.getElementById('t2dot');
  const nBrowser=document.getElementById('t2-browser');
  const nDns=document.getElementById('t2-dns');
  const nRouter=document.getElementById('t2-router');
  const nServer=document.getElementById('t2-server');
  const allNodes=[nBrowser,nDns,nRouter,nServer];
  function clearOn(){ allNodes.forEach(n=>n.classList.remove('on')); }
  function fakeIp(domain){
    let h=0; for(const c of domain) h=(h*31+c.charCodeAt(0))%223;
    return '142.'+(h%250)+'.'+randInt(1,254)+'.'+randInt(1,254);
  }
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log); clearOn();
    const domain=(input.value||'google.com').trim();
    const ip=fakeIp(domain);
    logMsg(log,'1. Browser ले DNS Server लाई "'+domain+'" को IP सोध्छ');
    nBrowser.classList.add('on'); await moveDotThroughNodes(track,dot,[nBrowser,nDns],550);
    nDns.classList.add('on');
    await sleep(300);
    logMsg(log,'2. DNS ले फर्काउँछ: '+domain+' → '+ip);
    await moveDotThroughNodes(track,dot,[nDns,nRouter],550);
    nRouter.classList.add('on');
    logMsg(log,'3. Browser ले '+ip+' मा Router मार्फत request पठाउँछ');
    await moveDotThroughNodes(track,dot,[nRouter,nServer],550);
    nServer.classList.add('on');
    logMsg(log,'4. Server ले webpage response पठाउँछ — browser ले देखाउँछ ✅');
    dot.classList.remove('show');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); clearOn(); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'Domain टाइप गरेर "Search गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T3: OSI encapsulation ============ */
(function(){
  const LAYERS=[
    {n:7,name:'Application',s:'Message तयार पारियो',r:'Message पढियो'},
    {n:6,name:'Presentation',s:'Encrypt/format गरियो',r:'Decrypt गरियो'},
    {n:5,name:'Session',s:'Session maintain भयो',r:'Session जाँचियो'},
    {n:4,name:'Transport',s:'TCP ले टुक्रा पार्यो',r:'टुक्रा जोडियो (TCP)'},
    {n:3,name:'Network',s:'IP address थपियो',r:'IP address हेरियो'},
    {n:2,name:'Data Link',s:'MAC address थपियो',r:'MAC address हेरियो'},
    {n:1,name:'Physical',s:'Wi-Fi signal भएर उड्यो',r:'Wi-Fi signal प्राप्त भयो'}
  ];
  const senderCol=document.getElementById('t3-sender');
  const recvCol=document.getElementById('t3-receiver');
  senderCol.innerHTML = LAYERS.map(l=>'<div class="layer-row" id="t3-s'+l.n+'"><b>L'+l.n+'</b>'+l.name+'<small>'+l.s+'</small></div>').join('');
  const rev=[...LAYERS].reverse();
  recvCol.innerHTML = rev.map(l=>'<div class="layer-row" id="t3-r'+l.n+'"><b>L'+l.n+'</b>'+l.name+'<small>'+l.r+'</small></div>').join('');
  const log=document.getElementById('t3log');
  const dot=document.getElementById('t3dot');
  const grid=dot.parentElement;
  const goBtn=document.getElementById('t3-go');
  const resetBtn=document.getElementById('t3-reset');
  function allRows(){ return document.querySelectorAll('#t3-sender .layer-row, #t3-receiver .layer-row'); }
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true;
    clearLog(log); allRows().forEach(r=>r.classList.remove('on'));
    const msg=(document.getElementById('t3-msg').value||'Hello').trim();
    logMsg(log,'📨 पठाउने Message: "'+msg+'"');
    for(const l of LAYERS){
      const row=document.getElementById('t3-s'+l.n);
      row.classList.add('on');
      logMsg(log,'L'+l.n+' ('+l.name+'): '+l.s);
      await sleep(280);
    }
    logMsg(log,'📡 Physical layer बाट transmit भयो...');
    const lastSender=document.getElementById('t3-s1');
    const firstRecv=document.getElementById('t3-r1');
    await moveDotThroughNodes(grid, dot, [lastSender, firstRecv], 700);
    dot.classList.remove('show');
    for(const l of rev){
      const row=document.getElementById('t3-r'+l.n);
      row.classList.add('on');
      logMsg(log,'L'+l.n+' ('+l.name+'): '+l.r);
      await sleep(280);
    }
    logMsg(log,'✅ Receiver ले पूरा message "'+msg+'" पढ्यो!');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); allRows().forEach(r=>r.classList.remove('on')); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'Message लेखेर "पठाउनुहोस्" थिच्नुहोस्।');
})();

/* ============ T4: TCP/IP 4 layers ============ */
(function(){
  const LAYERS=[
    {name:'Application Layer', proto:'HTTP, DNS, FTP, SMTP', desc:'HTTP request बन्छ — "मलाई feed देखाऊ"'},
    {name:'Transport Layer', proto:'TCP, UDP', desc:'TCP ले Facebook server सँग connection बनाउँछ'},
    {name:'Internet Layer', proto:'IP, ICMP', desc:'IP address हेरेर बाटो पत्ता लाग्छ'},
    {name:'Network Access Layer', proto:'Ethernet, Wi-Fi', desc:'Mobile data/Wi-Fi मार्फत signal भौतिक रूपमा पठाइन्छ'}
  ];
  const wrap=document.getElementById('t4-layers');
  wrap.innerHTML=LAYERS.map((l,i)=>'<div class="layer-row" id="t4-l'+i+'"><b>'+l.name+'</b> <span style="color:var(--amber)">'+l.proto+'</span><small>'+l.desc+'</small></div>').join('');
  const log=document.getElementById('t4log');
  const goBtn=document.getElementById('t4-go');
  const resetBtn=document.getElementById('t4-reset');
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log);
    document.querySelectorAll('#t4-layers .layer-row').forEach(r=>r.classList.remove('on'));
    logMsg(log,'📱 Facebook app खोलियो...');
    for(let i=0;i<LAYERS.length;i++){
      document.getElementById('t4-l'+i).classList.add('on');
      logMsg(log,LAYERS[i].name+' → '+LAYERS[i].desc);
      await sleep(500);
    }
    logMsg(log,'✅ Feed load भयो!');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); document.querySelectorAll('#t4-layers .layer-row').forEach(r=>r.classList.remove('on')); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"Facebook खोल्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T5: IP vs MAC ============ */
(function(){
  const ipEl=document.getElementById('t5-ip');
  const macEl=document.getElementById('t5-mac');
  const log=document.getElementById('t5log');
  const MAC='3C:97:0E:1A:B2:C4';
  const places={
    home:{ip:'192.168.1.15', label:'घर'},
    office:{ip:'192.168.5.22', label:'Office'},
    cafe:{ip:'10.20.30.44', label:'Cafe'}
  };
  function connect(key){
    const p=places[key];
    ipEl.textContent=p.ip;
    ipEl.classList.add('on');
    macEl.classList.remove('on');
    setTimeout(()=>ipEl.classList.remove('on'),600);
    logMsg(log, p.label+' को Wi-Fi मा जोडियो → नयाँ IP मिल्यो: '+p.ip+' | MAC उही नै रह्यो: '+MAC);
  }
  document.getElementById('t5-home').addEventListener('click', ()=>connect('home'));
  document.getElementById('t5-office').addEventListener('click', ()=>connect('office'));
  document.getElementById('t5-cafe').addEventListener('click', ()=>connect('cafe'));
  logMsg(log,'फरक-फरक Wi-Fi मा जोडेर IP बदलिने तर MAC नबदलिने हेर्नुहोस्।');
})();

/* ============ T6: Switch MAC table ============ */
(function(){
  const sendBtn=document.getElementById('t6-send');
  const resetBtn=document.getElementById('t6-reset');
  const log=document.getElementById('t6log');
  const track=document.getElementById('t6track');
  const dot=document.getElementById('t6dot');
  const tbody=document.getElementById('t6table');
  const pc1=document.getElementById('t6-pc1'), pc2=document.getElementById('t6-pc2'),
        pc3=document.getElementById('t6-pc3'), sw=document.getElementById('t6-switch');
  let learned=false;
  function setTable(){
    tbody.innerHTML = learned
      ? '<tr><td>PC1 MAC</td><td>Port 1</td></tr><tr><td>PC3 MAC</td><td>Port 3</td></tr>'
      : '<tr><td colspan="2" style="color:var(--text-dim)">— table खाली छ —</td></tr>';
  }
  sendBtn.addEventListener('click', async ()=>{
    sendBtn.disabled=true;
    if(!learned){
      logMsg(log,'PC1 → PC3: switch लाई PC3 कुन port मा छ थाहा छैन।');
      await moveDotThroughNodes(track,dot,[pc1,sw],500);
      pc2.classList.add('on'); pc3.classList.add('on');
      logMsg(log,'⚡ Flooding: सबै port मा पठाइयो (Port 2 र Port 3 दुवैमा)');
      await sleep(700);
      pc2.classList.remove('on');
      logMsg(log,'PC3 ले जवाफ फर्कायो → Switch ले "PC3 MAC = Port 3" table मा राख्यो ✅');
      await moveDotThroughNodes(track,dot,[pc3,sw],500);
      dot.classList.remove('show');
      pc3.classList.remove('on');
      learned=true; setTable();
      sendBtn.textContent='▶ फेरि PC1 → PC3 पठाउनुहोस्';
    } else {
      logMsg(log,'PC1 → PC3: यसपल्ट switch लाई थाहा छ, direct मात्र port 3 मा पठायो — flooding चाहिएन।');
      pc3.classList.add('on');
      await moveDotThroughNodes(track,dot,[pc1,sw,pc3],500);
      dot.classList.remove('show');
      pc3.classList.remove('on');
      logMsg(log,'✅ PC2 को bandwidth र privacy दुवै जोगियो — उसले यो traffic देख्दैन।');
    }
    sendBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    learned=false; setTable(); clearLog(log);
    sendBtn.textContent='▶ PC1 → PC3 पठाउनुहोस्';
    logMsg(log,'Table मेटियो। फेरि सुरुदेखि हेर्नुहोस्।');
  });
  setTable();
  logMsg(log,'"PC1 → PC3 पठाउनुहोस्" थिचेर flooding हेर्नुहोस्, अनि फेरि थिचेर direct forwarding हेर्नुहोस्।');
})();

/* ============ T7: Router ============ */
(function(){
  const goBtn=document.getElementById('t7-go');
  const resetBtn=document.getElementById('t7-reset');
  const log=document.getElementById('t7log');
  const track=document.getElementById('t7track');
  const dot=document.getElementById('t7dot');
  const a=document.getElementById('t7-a'), r=document.getElementById('t7-router'), b=document.getElementById('t7-b');
  const row1=document.getElementById('t7row1'), row2=document.getElementById('t7row2');
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true;
    logMsg(log,'KTM Host ले Pokhara Host लाई packet पठायो (destination: 10.10.10.0/24)');
    row1.classList.remove('on'); row2.classList.remove('on');
    await moveDotThroughNodes(track,dot,[a,r],550);
    r.classList.add('on');
    logMsg(log,'📡 Router ले routing table हेर्‍यो...');
    await sleep(400);
    row2.classList.add('on');
    logMsg(log,'✅ Table मा भेटियो: 10.10.10.0/24 → Directly Connected');
    await moveDotThroughNodes(track,dot,[r,b],550);
    dot.classList.remove('show'); r.classList.remove('on');
    logMsg(log,'📬 Packet Pokhara Host सम्म सफलतापूर्वक पुग्यो!');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); row1.classList.remove('on'); row2.classList.remove('on'); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"Packet पठाउनुहोस्" थिचेर routing हेर्नुहोस्।');
})();

/* ============ T8: Packet journey / traceroute ============ */
(function(){
  const goBtn=document.getElementById('t8-go');
  const resetBtn=document.getElementById('t8-reset');
  const log=document.getElementById('t8log');
  const track=document.getElementById('t8track');
  const dot=document.getElementById('t8dot');
  const nodes=[1,2,3,4,5,6].map(i=>document.getElementById('t8-'+i));
  const hops=[
    {name:'PC (तिमी)', ip:'192.168.1.15'},
    {name:'Switch', ip:'192.168.1.1'},
    {name:'Home Router', ip:'192.168.1.1'},
    {name:'ISP Exchange', ip:'103.'+randInt(10,250)+'.4.1'},
    {name:'Internet Backbone', ip:'72.14.'+randInt(200,250)+'.1'},
    {name:'Google Server', ip:'142.250.'+randInt(1,250)+'.'+randInt(1,250)}
  ];
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log);
    nodes.forEach(n=>n.classList.remove('on'));
    logMsg(log,'▶ tracert google.com चलाइँदैछ...');
    for(let i=0;i<nodes.length;i++){
      await moveDotThroughNodes(track,dot,[nodes[i]],450);
      nodes[i].classList.add('on');
      const ms=(i+1)*randInt(8,25);
      logMsg(log,'Hop '+(i+1)+': '+hops[i].name+' ('+hops[i].ip+') — '+ms+' ms');
      await sleep(150);
    }
    dot.classList.remove('show');
    logMsg(log,'✅ Google Server सम्म पुग्यो — कुल समय १ सेकेन्ड भन्दा पनि कम!');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); nodes.forEach(n=>n.classList.remove('on')); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"Traceroute सुरु गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T9: TCP vs UDP ============ */
(function(){
  const tcpBtn=document.getElementById('t9-tcp');
  const udpBtn=document.getElementById('t9-udp');
  const resetBtn=document.getElementById('t9-reset');
  const log=document.getElementById('t9log');
  const track=document.getElementById('t9track');
  const dot=document.getElementById('t9dot');
  const a=document.getElementById('t9-a'), b=document.getElementById('t9-b');
  tcpBtn.addEventListener('click', async ()=>{
    tcpBtn.disabled=true; udpBtn.disabled=true; clearLog(log);
    logMsg(log,'🏦 Banking app: TCP connection बनाउँदैछ (3-way handshake)...');
    await moveDotThroughNodes(track,dot,[a,b],500); logMsg(log,'→ SYN पठायो');
    await moveDotThroughNodes(track,dot,[b,a],500); logMsg(log,'← SYN-ACK फर्कियो');
    await moveDotThroughNodes(track,dot,[a,b],500); logMsg(log,'→ ACK पठायो — connection बन्यो ✅');
    for(let i=1;i<=3;i++){
      await moveDotThroughNodes(track,dot,[a,b],450);
      logMsg(log,'→ Data packet '+i+' पठायो (रकम: Rs. '+(i*1000)+')');
      await moveDotThroughNodes(track,dot,[b,a],450);
      logMsg(log,'← ACK: packet '+i+' सही ठाउँमा पुग्यो');
    }
    dot.classList.remove('show');
    logMsg(log,'✅ पूरै रकम सही र सुरक्षित transfer भयो — एउटै byte हराएन।');
    tcpBtn.disabled=false; udpBtn.disabled=false;
  });
  udpBtn.addEventListener('click', async ()=>{
    tcpBtn.disabled=true; udpBtn.disabled=true; clearLog(log);
    logMsg(log,'📹 Video call: UDP ले handshake नगरी सीधै frame पठाउँदैछ...');
    for(let i=1;i<=5;i++){
      const dropped = i===3;
      await moveDotThroughNodes(track,dot,[a,b],320);
      if(dropped){ logMsg(log,'✗ Frame '+i+' बाटोमै हरायो — तर पर्खिएन, call जारी छ'); }
      else{ logMsg(log,'→ Frame '+i+' पुग्यो (कुनै ACK चाहिएन)'); }
    }
    dot.classList.remove('show');
    logMsg(log,'✅ Call चालु नै रह्यो — एक frame हराए पनि थोरै lag देखियो मात्र, call रोकिएन।');
    tcpBtn.disabled=false; udpBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'TCP र UDP दुवै चलाएर भिन्नता तुलना गर्नुहोस्।');
})();

/* ============ T10: VLAN ============ */
(function(){
  const goBtn=document.getElementById('t10-go');
  const resetBtn=document.getElementById('t10-reset');
  const fromSel=document.getElementById('t10-from');
  const toSel=document.getElementById('t10-to');
  const log=document.getElementById('t10log');
  function vlanOf(name){ return name.split('-')[0]; }
  goBtn.addEventListener('click', ()=>{
    const from=fromSel.value, to=toSel.value;
    const same=vlanOf(from)===vlanOf(to);
    if(from===to){ logMsg(log,'⚠️ एउटै device छान्नुभयो — फरक device छान्नुहोस्।'); return; }
    if(same){
      logMsg(log,'✅ '+from+' → '+to+': दुवै उही VLAN मा छन् — Access मिल्यो!');
    } else {
      logMsg(log,'🚫 '+from+' → '+to+': फरक VLAN — Blocked! (जस्तै Finance ले HR को PC access गर्न खोज्दा)');
    }
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'दुई device छानेर "Access प्रयास गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T11: Subnetting ============ */
(function(){
  const buttons=document.querySelectorAll('.t11-btn');
  const countEl=document.getElementById('t11-count');
  const usableEl=document.getElementById('t11-usable');
  const blocksEl=document.getElementById('t11-blocks');
  function render(prefix){
    const blockSize=Math.pow(2,32-prefix);
    const numSubnets=Math.max(1,Math.floor(256/blockSize));
    const usable = prefix>=31 ? blockSize : blockSize-2;
    countEl.textContent=numSubnets;
    usableEl.textContent=usable;
    let html='';
    for(let i=0;i<numSubnets;i++){
      const start=i*blockSize;
      const end=start+blockSize-1;
      html+='<div class="subnet-block"><span>Subnet '+(i+1)+': 192.168.1.'+start+'/'+prefix+'</span><span style="color:var(--text-dim)">192.168.1.'+start+' – 192.168.1.'+end+'</span></div>';
    }
    blocksEl.innerHTML=html;
  }
  buttons.forEach(b=>{
    b.addEventListener('click', ()=>{
      buttons.forEach(x=>x.classList.remove('primary'));
      b.classList.add('primary');
      render(parseInt(b.dataset.p));
    });
  });
  render(25);
})();

/* ============ T12: DHCP -> DNS -> NAT ============ */
(function(){
  const dhcpBtn=document.getElementById('t12-dhcp');
  const dnsBtn=document.getElementById('t12-dns');
  const natBtn=document.getElementById('t12-nat');
  const resetBtn=document.getElementById('t12-reset');
  const log=document.getElementById('t12log');
  let privateIp=null;
  dhcpBtn.addEventListener('click', ()=>{
    privateIp='192.168.1.'+randInt(10,99);
    logMsg(log,'📶 Phone ले Router (DHCP) लाई IP मागेको छ...');
    logMsg(log,'✅ DHCP ले automatic IP दियो: '+privateIp);
    dhcpBtn.disabled=true; dnsBtn.disabled=false;
  });
  dnsBtn.addEventListener('click', ()=>{
    const fakeIp='157.240.'+randInt(1,250)+'.'+randInt(1,250);
    logMsg(log,'🔍 Facebook app खोल्दा DNS लाई facebook.com को IP सोधियो...');
    logMsg(log,'✅ DNS ले फर्कायो: facebook.com → '+fakeIp);
    dnsBtn.disabled=true; natBtn.disabled=false;
  });
  natBtn.addEventListener('click', ()=>{
    const publicIp='103.'+randInt(1,250)+'.'+randInt(1,250)+'.'+randInt(1,250);
    logMsg(log,'🌐 Request घर बाहिर internet मा जाँदैछ...');
    logMsg(log,'✅ NAT ले '+privateIp+' (private) लाई '+publicIp+' (public, ISP दिएको) मा बदलिदियो');
    logMsg(log,'ℹ️ घरका ५ वटै device बाहिरबाट हेर्दा एउटै Public IP मार्फत देखिन्छन्।');
    natBtn.disabled=true;
  });
  resetBtn.addEventListener('click', ()=>{
    privateIp=null; clearLog(log);
    dhcpBtn.disabled=false; dnsBtn.disabled=true; natBtn.disabled=true;
    logMsg(log,'Reset भयो। "DHCP: IP माग्नुहोस्" बाट सुरु गर्नुहोस्।');
  });
  logMsg(log,'क्रमैसँग 1️⃣ → 2️⃣ → 3️⃣ थिच्नुहोस्।');
})();

/* ============ T13: VLSM ============ */
(function(){
  const goBtn=document.getElementById('t13-go');
  const resetBtn=document.getElementById('t13-reset');
  const log=document.getElementById('t13log');
  const result=document.getElementById('t13-result');
  const plan=[
    {name:'Sales', need:50, prefix:26, usable:62, start:'192.168.1.0'},
    {name:'IT', need:20, prefix:27, usable:30, start:'192.168.1.64'},
    {name:'Finance', need:10, prefix:28, usable:14, start:'192.168.1.96'},
    {name:'Router-to-Router Link', need:2, prefix:30, usable:2, start:'192.168.1.112'}
  ];
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log); result.innerHTML='';
    logMsg(log,'192.168.1.0/24 लाई चाहिने Host अनुसार बाँड्दैछ...');
    for(const p of plan){
      await sleep(500);
      logMsg(log,p.name+': '+p.need+' host चाहियो → /'+p.prefix+' दिइयो ('+p.usable+' usable)');
      const tr=document.createElement('tr');
      tr.innerHTML='<td>'+p.name+'</td><td>'+p.start+'/'+p.prefix+'</td><td>'+p.usable+'</td>';
      result.appendChild(tr);
    }
    logMsg(log,'✅ हरेक department लाई ठ्याक्कै चाहिने जति IP मिल्यो — फालतु waste भएन।');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); result.innerHTML='<tr><td colspan="3" style="color:var(--text-dim)">— अझै allocate गरिएको छैन —</td></tr>';
    logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"VLSM Allocate गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T14: CIDR Summarization ============ */
(function(){
  const goBtn=document.getElementById('t14-go');
  const resetBtn=document.getElementById('t14-reset');
  const log=document.getElementById('t14log');
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log);
    logMsg(log,'4 वटा /24 network को common binary prefix जाँचिँदैछ...');
    await sleep(500);
    logMsg(log,'192.168.0.0, .1.0, .2.0, .3.0 — सुरुका 22 bit सबैमा उस्तै छन्');
    await sleep(500);
    logMsg(log,'✅ Summary Route: 192.168.0.0/22');
    await sleep(400);
    logMsg(log,'ℹ️ अब routing table मा 4 वटा line को सट्टा 1 वटा मात्र line राख्दा पुग्छ — router छिटो हुन्छ।');
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'"Summarize गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T15: Static vs Dynamic Routing ============ */
(function(){
  const failBtn=document.getElementById('t15-fail');
  const staticBtn=document.getElementById('t15-static');
  const dynamicBtn=document.getElementById('t15-dynamic');
  const resetBtn=document.getElementById('t15-reset');
  const log=document.getElementById('t15log');
  const track=document.getElementById('t15track');
  const dot=document.getElementById('t15dot');
  const a=document.getElementById('t15-a'), b=document.getElementById('t15-b');
  const primaryArrow=document.getElementById('t15-primary');
  let failed=false;
  failBtn.addEventListener('click', ()=>{
    failed=!failed;
    primaryArrow.classList.toggle('cut',failed);
    primaryArrow.textContent = failed ? '✗ Primary (Fail भयो) ✗' : '— Primary —';
    logMsg(log, failed ? '⚡ Primary link fail भयो!' : '✅ Primary link फेरि ठीक भयो।');
  });
  staticBtn.addEventListener('click', async ()=>{
    if(!failed){ logMsg(log,'Static route ले Primary link मार्फत सजिलै पुर्‍यायो ✅'); await moveDotThroughNodes(track,dot,[a,b],500); dot.classList.remove('show'); return; }
    logMsg(log,'📍 Static route ले अझै Primary link नै प्रयोग गर्न खोज्यो...');
    await sleep(500);
    logMsg(log,'❌ Packet पुगेन — Static route ले अर्को बाटो आफै थाहा पाउँदैन, network admin ले हातले बदल्नुपर्छ।');
  });
  dynamicBtn.addEventListener('click', async ()=>{
    if(!failed){ logMsg(log,'Dynamic (OSPF) ले पनि Primary link मार्फत नै पठायो ✅'); await moveDotThroughNodes(track,dot,[a,b],500); dot.classList.remove('show'); return; }
    logMsg(log,'🔄 OSPF ले Primary link fail भएको तुरुन्तै थाहा पायो...');
    await sleep(500);
    logMsg(log,'✅ OSPF ले आफै Backup link भेट्टायो र packet त्यहीबाट पठायो — admin ले केही गर्नु परेन!');
    await moveDotThroughNodes(track,dot,[a,b],500); dot.classList.remove('show');
  });
  resetBtn.addEventListener('click', ()=>{
    failed=false; primaryArrow.classList.remove('cut'); primaryArrow.textContent='— Primary —';
    clearLog(log); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'पहिले Link Fail गराउनुहोस्, अनि Static र Dynamic दुवै प्रयास गरेर तुलना गर्नुहोस्।');
})();

/* ============ T16: Routing Protocols ============ */
(function(){
  const buttons=document.querySelectorAll('.t16-btn');
  const detail=document.getElementById('t16-detail');
  const info={
    rip:{title:'RIP (Routing Information Protocol)', metric:'Hop Count (जति कम router हुँदै जान्छ, उति राम्रो)', conv:'ढिलो (मिनेट लाग्न सक्छ)', note:'सानो network को लागि सजिलो, तर ठूलो network मा राम्रो होइन — max 15 hop मात्र।'},
    ospf:{title:'OSPF (Open Shortest Path First)', metric:'Cost (Bandwidth मा आधारित)', conv:'छिटो (सेकेन्डमै)', note:'ठूलो enterprise network मा सबैभन्दा बढी प्रयोग हुन्छ, industry standard।'},
    eigrp:{title:'EIGRP (Cisco को Protocol)', metric:'Bandwidth + Delay मिलाएर composite metric', conv:'धेरै छिटो', note:'Cisco device हरूमा मात्र राम्रोसँग चल्छ, RIP र OSPF दुवैको फाइदा लिन्छ।'}
  };
  function render(key){
    const d=info[key];
    detail.innerHTML='<h3 style="font-family:var(--display);color:var(--cyan);margin-bottom:8px;">'+d.title+'</h3>'+
      '<p style="margin-bottom:6px;"><b style="color:var(--amber)">Metric:</b> '+d.metric+'</p>'+
      '<p style="margin-bottom:6px;"><b style="color:var(--amber)">Convergence Speed:</b> '+d.conv+'</p>'+
      '<p>'+d.note+'</p>';
  }
  buttons.forEach(b=>b.addEventListener('click', ()=>{
    buttons.forEach(x=>x.classList.remove('primary'));
    b.classList.add('primary');
    render(b.dataset.p);
  }));
  render('rip');
})();

/* ============ T17: ACL ============ */
(function(){
  const hrBtn=document.getElementById('t17-hr');
  const netBtn=document.getElementById('t17-net');
  const resetBtn=document.getElementById('t17-reset');
  const log=document.getElementById('t17log');
  hrBtn.addEventListener('click', ()=>{
    logMsg(log,'Finance → HR Server: Rule 10 (deny) मिल्यो → 🚫 Blocked!');
  });
  netBtn.addEventListener('click', ()=>{
    logMsg(log,'Finance → Internet: Rule 10 नमिलेकोले Rule 20 (permit) मा गयो → ✅ Allowed!');
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'दुवै traffic पठाएर ACL ले कसरी छान्छ हेर्नुहोस्।');
})();

/* ============ T18: NAT Types ============ */
(function(){
  const goBtn=document.getElementById('t18-go');
  const resetBtn=document.getElementById('t18-reset');
  const sel=document.getElementById('t18-type');
  const log=document.getElementById('t18log');
  goBtn.addEventListener('click', async ()=>{
    goBtn.disabled=true; clearLog(log);
    const type=sel.value;
    const devices=['PC1 (192.168.1.10)','PC2 (192.168.1.11)','PC3 (192.168.1.12)'];
    if(type==='static'){
      logMsg(log,'Static NAT: हरेक device लाई पहिल्यै तोकिएको fixed public IP मिल्छ।');
      for(const [i,d] of devices.entries()){ await sleep(400); logMsg(log,d+' → 103.20.10.'+(i+1)+' (सधैं उही)'); }
    } else if(type==='dynamic'){
      logMsg(log,'Dynamic NAT: Public IP Pool (103.20.10.1 – .3) बाट फुर्सद भएको जुनसुकै IP मिल्छ।');
      for(const d of devices){ await sleep(400); logMsg(log,d+' → 103.20.10.'+randInt(1,3)+' (pool बाट)'); }
      logMsg(log,'⚠️ Pool भन्दा बढी device एकैचोटि जोडिन खोजे केही device लाई IP भेट्टिँदैन।');
    } else {
      logMsg(log,'PAT: सबै device ले एउटै Public IP शेयर गर्छन्, port number ले फरक छुट्याउँछ।');
      for(const d of devices){ await sleep(400); logMsg(log,d+' → 103.20.10.1:'+randInt(20000,60000)); }
      logMsg(log,'✅ एउटै Public IP बाट धेरै device — घर router मा सबैभन्दा बढी यही प्रयोग हुन्छ।');
    }
    goBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'NAT Type छानेर "Internet पठाउनुहोस्" थिच्नुहोस्।');
})();

/* ============ T19: Firewall Zones ============ */
(function(){
  const b1=document.getElementById('t19-1'), b2=document.getElementById('t19-2'), b3=document.getElementById('t19-3');
  const resetBtn=document.getElementById('t19-reset');
  const log=document.getElementById('t19log');
  b1.addEventListener('click', ()=>logMsg(log,'Internet → DMZ (port 80): ✅ Allowed — Web server ले public traffic लिनैपर्छ।'));
  b2.addEventListener('click', ()=>logMsg(log,'Internet → LAN (सीधै): 🚫 Blocked — Untrusted zone बाट Trusted zone मा सीधै जान पाइँदैन।'));
  b3.addEventListener('click', ()=>logMsg(log,'LAN → Internet: ✅ Allowed — भित्रबाट बाहिर जान सामान्यतया अनुमति हुन्छ।'));
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'फरक-फरक zone बीचको traffic परीक्षण गर्नुहोस्।');
})();

/* ============ T20: VPN ============ */
(function(){
  const plainBtn=document.getElementById('t20-plain');
  const vpnBtn=document.getElementById('t20-vpn');
  const resetBtn=document.getElementById('t20-reset');
  const log=document.getElementById('t20log');
  const track=document.getElementById('t20track');
  const dot=document.getElementById('t20dot');
  const a=document.getElementById('t20-a'), mid=document.getElementById('t20-mid'), b=document.getElementById('t20-b');
  plainBtn.addEventListener('click', async ()=>{
    plainBtn.disabled=true; vpnBtn.disabled=true;
    logMsg(log,'🔓 Data plain text मै Internet हुँदै पठाइयो...');
    await moveDotThroughNodes(track,dot,[a,mid,b],550);
    dot.classList.remove('show');
    logMsg(log,'⚠️ बीचमा कसैले traffic समात्यो भने data सजिलै पढ्न सकिन्छ — खतरा!');
    plainBtn.disabled=false; vpnBtn.disabled=false;
  });
  vpnBtn.addEventListener('click', async ()=>{
    plainBtn.disabled=true; vpnBtn.disabled=true;
    logMsg(log,'🔒 Data पहिले Encrypt गरियो, अनि VPN Tunnel भित्र पठाइयो...');
    mid.classList.add('on');
    await moveDotThroughNodes(track,dot,[a,mid,b],550);
    dot.classList.remove('show'); mid.classList.remove('on');
    logMsg(log,'✅ बीचमा कसैले समाते पनि data अर्थहीन कोड मात्र देख्छ — सुरक्षित!');
    plainBtn.disabled=false; vpnBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'दुवै तरिका चलाएर फरक हेर्नुहोस्।');
})();

/* ============ T21: Wireless Security ============ */
(function(){
  const goBtn=document.getElementById('t21-go');
  const sel=document.getElementById('t21-sec');
  const log=document.getElementById('t21log');
  const info={
    open:'🔴 जोखिम धेरै — कुनै encryption छैन, जो कोहीले traffic पढ्न सक्छ। Public place मा जोगिनु राम्रो।',
    wep:'🟠 जोखिम — पुरानो र सजिलै crack हुने encryption, अहिले प्रयोग गर्न हुँदैन।',
    wpa2:'🟡 राम्रो — AES encryption प्रयोग गर्छ, धेरैजसो घर/office मा यही चलेको हुन्छ।',
    wpa3:'🟢 सबैभन्दा सुरक्षित — नयाँ standard, brute-force attack बाट पनि जोगाउँछ।'
  };
  goBtn.addEventListener('click', ()=>{
    logMsg(log,sel.options[sel.selectedIndex].text+' मा जोडियो → '+info[sel.value]);
  });
  logMsg(log,'Security type छानेर जोड्नुहोस्।');
})();

/* ============ T22: STP ============ */
(function(){
  const noloopBtn=document.getElementById('t22-noloop');
  const stpBtn=document.getElementById('t22-stp');
  const resetBtn=document.getElementById('t22-reset');
  const log=document.getElementById('t22log');
  const track=document.getElementById('t22track');
  const dot=document.getElementById('t22dot');
  const sw1=document.getElementById('t22-sw1'), sw2=document.getElementById('t22-sw2');
  const link2label=document.getElementById('t22-link2label');
  noloopBtn.addEventListener('click', async ()=>{
    noloopBtn.disabled=true; stpBtn.disabled=true; clearLog(log);
    logMsg(log,'⚡ Broadcast frame Switch 1 बाट पठाइयो — तर 2 वटै link खुला छन्...');
    for(let i=0;i<4;i++){
      await moveDotThroughNodes(track,dot,[sw1,sw2],350);
      await moveDotThroughNodes(track,dot,[sw2,sw1],350);
      logMsg(log,'🔁 उही frame फेरि घुमेर आयो... (loop #'+(i+1)+')');
    }
    dot.classList.remove('show');
    logMsg(log,'💥 Broadcast Storm! Frame अनन्तसम्म घुम्दै जान्छ, network साह्रै slow हुन्छ।');
    noloopBtn.disabled=false; stpBtn.disabled=false;
  });
  stpBtn.addEventListener('click', async ()=>{
    noloopBtn.disabled=true; stpBtn.disabled=true; clearLog(log);
    link2label.innerHTML='↔ Link 2 <b style="color:var(--red)">(STP द्वारा Blocked — backup को लागि मात्र)</b> ↔';
    logMsg(log,'🛡️ STP ले 2 वटा link भेट्यो, एउटालाई Blocking state मा राख्यो।');
    await sleep(400);
    logMsg(log,'▶ अब broadcast frame Link 1 बाट मात्र जान्छ:');
    await moveDotThroughNodes(track,dot,[sw1,sw2],500);
    dot.classList.remove('show');
    logMsg(log,'✅ Loop भएन! अनि Link 1 कहिल्यै fail भयो भने STP ले तुरुन्तै Link 2 लाई सक्रिय बनाउँछ।');
    noloopBtn.disabled=false; stpBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    clearLog(log); link2label.textContent='↔ Link 2 (redundant) ↔ पनि जोडिएको छ';
    logMsg(log,'Reset भयो।');
  });
  logMsg(log,'पहिले "STP बिना" चलाएर समस्या हेर्नुहोस्, अनि "STP सक्रिय" चलाएर समाधान हेर्नुहोस्।');
})();

/* ============ T23: EtherChannel ============ */
(function(){
  const failBtn=document.getElementById('t23-fail');
  const resetBtn=document.getElementById('t23-reset');
  const log=document.getElementById('t23log');
  const l1=document.getElementById('t23-l1'), l2=document.getElementById('t23-l2');
  const bw=document.getElementById('t23-bw');
  let failed=false;
  failBtn.addEventListener('click', ()=>{
    failed=!failed;
    if(failed){
      l1.textContent='Link 1 (1 Gbps) ❌ Fail'; l1.classList.add('bad');
      bw.textContent='कुल Bandwidth: 1 Gbps मात्र (Link 2 ले धानिरहेको छ) — तर connection टुटेन!';
      logMsg(log,'⚡ Link 1 fail भयो — तर EtherChannel bundle मा भएकोले traffic स्वतः Link 2 बाट मात्र जान थाल्यो, downtime शून्य!');
    } else {
      l1.textContent='Link 1 (1 Gbps) ✅'; l1.classList.remove('bad');
      bw.textContent='कुल Bandwidth: 2 Gbps';
      logMsg(log,'✅ Link 1 फेरि ठीक भयो, फेरि 2 Gbps पूरा भयो।');
    }
  });
  resetBtn.addEventListener('click', ()=>{
    failed=false; l1.textContent='Link 1 (1 Gbps) ✅'; l1.classList.remove('bad');
    bw.textContent='कुल Bandwidth: 2 Gbps'; clearLog(log); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"Link 1 Fail गराउनुहोस्" थिचेर के हुन्छ हेर्नुहोस्।');
})();

/* ============ T24: HSRP/VRRP ============ */
(function(){
  const failBtn=document.getElementById('t24-fail');
  const sendBtn=document.getElementById('t24-send');
  const resetBtn=document.getElementById('t24-reset');
  const log=document.getElementById('t24log');
  const track=document.getElementById('t24track');
  const dot=document.getElementById('t24dot');
  const pc=document.getElementById('t24-pc'), r1=document.getElementById('t24-r1'), r2=document.getElementById('t24-r2');
  let r1down=false;
  failBtn.addEventListener('click', ()=>{
    r1down=!r1down;
    if(r1down){
      r1.textContent='📡 R1 (Down ❌)'; r1.classList.add('bad');
      r2.textContent='📡 R2 (अब Active भयो ✅)'; r2.classList.add('on');
      logMsg(log,'⚡ R1 down भयो! R2 ले Virtual IP (192.168.1.1) आफैले सम्हाल्यो — सेकेन्डभित्रै।');
    } else {
      r1.textContent='📡 R1 (Active)'; r1.classList.remove('bad');
      r2.textContent='📡 R2 (Standby)'; r2.classList.remove('on');
      logMsg(log,'✅ R1 फेरि ठीक भयो, फेरि Active बन्यो।');
    }
  });
  sendBtn.addEventListener('click', async ()=>{
    sendBtn.disabled=true;
    const activeRouter = r1down ? r2 : r1;
    logMsg(log,'PC ले Gateway (192.168.1.1) मा packet पठायो — PC लाई कुन router Active छ भन्ने थाहै हुँदैन।');
    await moveDotThroughNodes(track,dot,[pc,activeRouter],550);
    dot.classList.remove('show');
    logMsg(log,'✅ Packet सफलतापूर्वक '+(r1down?'R2':'R1')+' मार्फत गयो — PC को config मा केही बदल्नु परेन!');
    sendBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{
    r1down=false; r1.textContent='📡 R1 (Active)'; r1.classList.remove('bad');
    r2.textContent='📡 R2 (Standby)'; r2.classList.remove('on');
    clearLog(log); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"R1 Fail गराउनुहोस्" अनि "Packet पठाउनुहोस्" दुवै थिचेर हेर्नुहोस्।');
})();

/* ============ T25: Load Balancing ============ */
(function(){
  const sendBtn=document.getElementById('t25-send');
  const resetBtn=document.getElementById('t25-reset');
  const log=document.getElementById('t25log');
  const servers=[document.getElementById('t25-s1'),document.getElementById('t25-s2'),document.getElementById('t25-s3')];
  const counts=[document.getElementById('t25-c1'),document.getElementById('t25-c2'),document.getElementById('t25-c3')];
  let idx=0, total=[0,0,0];
  sendBtn.addEventListener('click', ()=>{
    servers.forEach(s=>s.classList.remove('on'));
    servers[idx].classList.add('on');
    total[idx]++;
    counts[idx].textContent=total[idx];
    logMsg(log,'Request → Server '+(idx+1)+' मा पठाइयो (Round-robin)');
    idx=(idx+1)%3;
  });
  resetBtn.addEventListener('click', ()=>{
    idx=0; total=[0,0,0];
    servers.forEach(s=>s.classList.remove('on'));
    counts.forEach(c=>c.textContent='0');
    clearLog(log); logMsg(log,'Reset भयो।');
  });
  logMsg(log,'"Request पठाउनुहोस्" धेरैपटक थिचेर बाँडिने क्रम हेर्नुहोस्।');
})();

/* ============ T26: Cloud VPC ============ */
(function(){
  const b1=document.getElementById('t26-priv2net');
  const b2=document.getElementById('t26-net2priv');
  const resetBtn=document.getElementById('t26-reset');
  const log=document.getElementById('t26log');
  const track=document.getElementById('t26track');
  const dot=document.getElementById('t26dot');
  const priv=document.getElementById('t26-priv'), nat=document.getElementById('t26-nat'),
        igw=document.getElementById('t26-igw'), web=document.getElementById('t26-web');
  b1.addEventListener('click', async ()=>{
    b1.disabled=true;
    logMsg(log,'Database (Private Subnet) सँग सीधै Internet पहुँच छैन, त्यसैले NAT Gateway हुँदै जान्छ...');
    await moveDotThroughNodes(track,dot,[priv,nat,igw],500);
    dot.classList.remove('show');
    logMsg(log,'✅ Update download भयो — तर बाहिरबाट कसैले Database लाई सीधै देख्न/पहुँच गर्न सक्दैन (सुरक्षित)।');
    b1.disabled=false;
  });
  b2.addEventListener('click', async ()=>{
    b2.disabled=true;
    logMsg(log,'Internet बाट सीधै Database (Private Subnet) मा पुग्ने प्रयास...');
    await sleep(500);
    logMsg(log,'🚫 Blocked — Private Subnet को कुनै Public IP वा Internet Gateway route नै छैन।');
    b2.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'दुवै दिशाबाट traffic पठाएर Public vs Private Subnet को फरक हेर्नुहोस्।');
})();

/* ============ T27: Security Threats ============ */
(function(){
  const buttons=document.querySelectorAll('.t27-btn');
  const log=document.getElementById('t27log');
  const info={
    phishing:'🎣 Phishing: Attacker ले साँचो जस्तै देखिने email/website पठाएर password वा card details चोर्न खोज्छ। बचाव: link क्लिक गर्नुअघि sender र URL राम्ररी जाँच्नुहोस्।',
    mitm:'🕵️ Man-in-the-Middle: Attacker ले दुई पक्षको बीचमा बसेर traffic चोर्छ वा बदल्छ (जस्तै असुरक्षित public Wi-Fi मा)। बचाव: HTTPS र VPN प्रयोग गर्नुहोस्।',
    ddos:'💥 DDoS: हजारौं compromised device (botnet) ले एकैचोटि एउटा server मा अत्यधिक traffic पठाएर त्यसलाई ठप्प पार्छ। बचाव: traffic filtering र CDN/Anti-DDoS service प्रयोग गर्नुहोस्।'
  };
  buttons.forEach(b=>b.addEventListener('click', ()=>{
    buttons.forEach(x=>x.classList.remove('primary'));
    b.classList.add('primary');
    clearLog(log);
    logMsg(log,info[b.dataset.t]);
  }));
  logMsg(log,'माथिबाट कुनै एउटा threat छानेर हेर्नुहोस्।');
})();

/* ============ T28: IPv6 ============ */
(function(){
  const goBtn=document.getElementById('t28-go');
  const log=document.getElementById('t28log');
  function hex(){ return Math.floor(Math.random()*65536).toString(16).padStart(4,'0'); }
  goBtn.addEventListener('click', ()=>{
    const addr=[hex(),hex(),hex(),hex(),hex(),hex(),hex(),hex()].join(':');
    logMsg(log,'Generated IPv6: '+addr);
    logMsg(log,'IPv4 (32-bit) भन्दा IPv6 (128-bit) मा धेरै गुणा बढी address सम्भव छ — भविष्यमा arबौं IoT device लाई पुग्छ।');
  });
  logMsg(log,'"IPv6 Address Generate गर्नुहोस्" थिच्नुहोस्।');
})();

/* ============ T29: QoS ============ */
(function(){
  const noBtn=document.getElementById('t29-no');
  const yesBtn=document.getElementById('t29-yes');
  const resetBtn=document.getElementById('t29-reset');
  const log=document.getElementById('t29log');
  noBtn.addEventListener('click', async ()=>{
    noBtn.disabled=true; yesBtn.disabled=true; clearLog(log);
    logMsg(log,'📹 Video Call, 📁 File Download, 📧 Email — सबैलाई बराबर treat गरियो...');
    await sleep(600);
    logMsg(log,'⚠️ File Download ले धेरै bandwidth खायो → Video Call अड्किन थाल्यो, आवाज कट्दै गयो।');
    noBtn.disabled=false; yesBtn.disabled=false;
  });
  yesBtn.addEventListener('click', async ()=>{
    noBtn.disabled=true; yesBtn.disabled=true; clearLog(log);
    logMsg(log,'📹 Video Call लाई "High Priority" मार्क गरियो...');
    await sleep(600);
    logMsg(log,'✅ Video Call लाई पहिले bandwidth दिइयो, बाँकीबाट File Download अलि पर्खियो — Call एकदम smooth चल्यो।');
    noBtn.disabled=false; yesBtn.disabled=false;
  });
  resetBtn.addEventListener('click', ()=>{ clearLog(log); logMsg(log,'Reset भयो।'); });
  logMsg(log,'दुवै अवस्था चलाएर भिन्नता तुलना गर्नुहोस्।');
})();

/* ============ T30: Troubleshooting ============ */
(function(){
  const stepBtn=document.getElementById('t30-step');
  const resetBtn=document.getElementById('t30-reset');
  const log=document.getElementById('t30log');
  const steps=[
    '1️⃣ Cable/Wi-Fi जडान जाँच्नुहोस् → ✅ ठीक छ',
    '2️⃣ IP Address जाँच्नुहोस् (ipconfig) → ✅ 192.168.1.15 देखियो',
    '3️⃣ Gateway लाई ping गर्नुहोस् (192.168.1.1) → ✅ जवाफ आयो',
    '4️⃣ DNS Server लाई ping गर्नुहोस् → ❌ जवाफ आएन!',
    '🔍 समस्या भेटियो: DNS सम्म पुगेन। समाधान: DNS settings जाँच्नुहोस् वा ISP लाई सम्पर्क गर्नुहोस्।'
  ];
  let idx=0;
  stepBtn.addEventListener('click', ()=>{
    if(idx>=steps.length){ logMsg(log,'✅ Troubleshooting सकियो। Reset थिचेर फेरि सुरु गर्नुहोस्।'); return; }
    logMsg(log,steps[idx]);
    idx++;
    if(idx>=steps.length) stepBtn.textContent='✓ सकियो';
  });
  resetBtn.addEventListener('click', ()=>{
    idx=0; stepBtn.textContent='▶ अर्को step जाँच्नुहोस्';
    clearLog(log); logMsg(log,'Reset भयो। Step-by-step जाँच सुरु गर्नुहोस्।');
  });
  logMsg(log,'"अर्को step जाँच्नुहोस्" क्रमैसँग थिचेर समस्या पत्ता लगाउनुहोस्।');
})();

/* ============ Quiz (reused) ============ */
const QUESTIONS=[
  {q:"1. Network भनेको के हो?", options:["एउटा मात्र device जसले data बनाउँछ","दुई वा दुईभन्दा बढी devices जोडिएर data आदानप्रदान गर्ने प्रणाली","Internet चलाउने कम्पनी","एउटा website"], correct:1},
  {q:"2. Browser मा google.com टाइप गर्दा सबैभन्दा पहिले कुन काम हुन्छ?", options:["Router ले सीधै webpage देखाउँछ","Google server ले automatic IP दिन्छ","Browser ले DNS Server लाई google.com को IP सोध्छ","Switch ले MAC table बनाउँछ"], correct:2},
  {q:"3. OSI Model मा IP addressing कुन तहमा हुन्छ?", options:["Application (7)","Transport (4)","Network (3)","Physical (1)"], correct:2},
  {q:"4. TCP/IP Model मा HTTP, DNS, FTP कुन तहमा पर्छन्?", options:["Network Access Layer","Internet Layer","Transport Layer","Application Layer"], correct:3},
  {q:"5. MAC Address को बारेमा कुन कुरा सही हो?", options:["यो network फेरिँदा बदलिन्छ","यो device को physical/hardware address हो, बदलिँदैन","यो DHCP सर्भरले दिन्छ","यो domain नाम हो"], correct:1},
  {q:"6. Switch ले frame कसरी पठाउँछ?", options:["सबै port मा एकैचोटि पठाउँछ","MAC Address Table हेरेर सही port मा मात्र पठाउँछ","Random port मा पठाउँछ","DNS लाई सोधेर पठाउँछ"], correct:1},
  {q:"7. Router को मुख्य काम के हो?", options:["फरक-फरक network हरूलाई जोड्ने र IP अनुसार packet forward गर्ने","MAC address table बनाउने","Domain नाम IP मा बदल्ने","Broadcast domain छुट्याउने मात्र"], correct:0},
  {q:"8. PC बाट Google सम्मको सही यात्रा क्रम कुन हो?", options:["PC → Router → Switch → ISP → Google","PC → Switch → Router → ISP → Internet → Google","PC → Internet → Switch → Google","PC → ISP → PC → Google"], correct:1},
  {q:"9. TCP मा connection बनाउन प्रयोग हुने 3-way handshake क्रम कुन हो?", options:["ACK → SYN → SYN-ACK","SYN → SYN-ACK → ACK","SYN-ACK → SYN → ACK","ACK → ACK → SYN"], correct:1},
  {q:"10. VLAN ले मुख्यतया के गर्छ?", options:["Internet को speed बढाउँछ","एउटै physical switch लाई logically अलग-अलग network मा बाँड्छ","IP address लाई MAC मा बदल्छ","DNS server चलाउँछ"], correct:1},
  {q:"11. 192.168.1.0/24 लाई /25 मा subnet गर्दा कति usable address प्रति subnet हुन्छ?", options:["256","128","126","64"], correct:2},
  {q:"12. Private IP लाई Internet मा जाँदा Public IP मा बदल्ने काम कुनले गर्छ?", options:["DNS","DHCP","VLAN","NAT"], correct:3}
];
const form=document.getElementById('quizForm');
QUESTIONS.forEach((item,qi)=>{
  const card=document.createElement('div');
  card.className='qcard';
  card.innerHTML=`
    <div class="qnum">प्रश्न ${qi+1} / ${QUESTIONS.length}</div>
    <div class="qtext">${item.q}</div>
    <div class="options">
      ${item.options.map((opt,oi)=>`
        <label class="opt" data-q="${qi}" data-o="${oi}">
          <input type="radio" name="q${qi}" value="${oi}">
          <span>${opt}</span>
        </label>
      `).join('')}
    </div>`;
  form.appendChild(card);
});
const submitBtn=document.getElementById('submitBtn');
const retryBtn=document.getElementById('retryBtn');
const scoreBox=document.getElementById('scoreBox');
const scoreNum=document.getElementById('scoreNum');
const scoreRemark=document.getElementById('scoreRemark');
function checkAllAnswered(){
  const answered=QUESTIONS.every((_,qi)=>form.querySelector(`input[name="q${qi}"]:checked`));
  submitBtn.disabled=!answered;
}
form.addEventListener('change', checkAllAnswered);
submitBtn.addEventListener('click', ()=>{
  let score=0;
  QUESTIONS.forEach((item,qi)=>{
    const selected=form.querySelector(`input[name="q${qi}"]:checked`);
    const selectedVal=selected?parseInt(selected.value):-1;
    const labels=form.querySelectorAll(`.opt[data-q="${qi}"]`);
    labels.forEach(label=>{
      const oi=parseInt(label.dataset.o);
      label.classList.add('disabled');
      if(oi===item.correct) label.classList.add('correct');
      else if(oi===selectedVal) label.classList.add('wrong');
    });
    if(selectedVal===item.correct) score++;
  });
  scoreNum.textContent=`${score} / ${QUESTIONS.length}`;
  let remark;
  if(score===QUESTIONS.length) remark="उत्कृष्ट! तिमीले सबै networking concept राम्ररी बुझेका छौ।";
  else if(score>=9) remark="राम्रो! थोरै topic फेरि हेर्नुहोस्।";
  else if(score>=6) remark="ठीकै छ, माथिका notes फेरि पढेर अभ्यास गर्नुहोस्।";
  else remark="फिक्री नगर्नुहोस् — notes फेरि पढेर एक पटक फेरि प्रयास गर्नुहोस्।";
  scoreRemark.textContent=remark;
  scoreBox.style.display='block';
  submitBtn.style.display='none';
  retryBtn.style.display='inline-block';
  scoreBox.scrollIntoView({behavior:'smooth', block:'center'});
});
retryBtn.addEventListener('click', ()=>{
  form.reset();
  form.querySelectorAll('.opt').forEach(el=>el.classList.remove('correct','wrong','disabled'));
  scoreBox.style.display='none';
  submitBtn.style.display='inline-block';
  retryBtn.style.display='none';
  submitBtn.disabled=true;
});