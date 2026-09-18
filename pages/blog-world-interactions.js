const ARK_ROOMS = [
  {id:'R-01',name:'ORION',x:330,y:235,radius:92,rotation:-.08,points:[[-30,-42],[27,-38],[-15,-4],[0,0],[16,-3],[-25,38],[26,41],[-2,-60]],edges:[[7,0],[7,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[5,6]]},
  {id:'R-02',name:'CASSIOPEIA',x:780,y:170,radius:88,rotation:.06,points:[[-42,8],[-22,-12],[0,8],[24,-13],[45,6]],edges:[[0,1],[1,2],[2,3],[3,4]]},
  {id:'R-03',name:'CYGNUS',x:1390,y:220,radius:94,rotation:-.13,points:[[-48,0],[-20,0],[8,0],[46,0],[8,-48],[8,42]],edges:[[0,1],[1,2],[2,3],[4,2],[2,5]]},
  {id:'R-04',name:'LYRA',x:1670,y:520,radius:86,rotation:.12,points:[[-34,-27],[-5,-11],[18,-6],[22,21],[-8,25]],edges:[[0,1],[1,2],[2,3],[3,4],[4,1]]},
  {id:'R-05',name:'SCORPIUS',x:1470,y:900,radius:98,rotation:-.16,points:[[-45,-32],[-27,-18],[-10,-7],[6,5],[20,20],[31,38],[19,53],[3,47],[-11,33]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]},
  {id:'R-06',name:'GEMINI',x:970,y:980,radius:92,rotation:.08,points:[[-26,-45],[-33,-19],[-36,9],[-44,38],[26,-42],[31,-16],[34,13],[43,39],[0,-3]],edges:[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[1,8],[5,8]]},
  {id:'R-07',name:'ANDROMEDA',x:520,y:900,radius:94,rotation:-.08,points:[[-52,13],[-28,2],[0,-8],[25,-17],[50,-8],[19,9],[-9,22]],edges:[[0,1],[1,2],[2,3],[3,4],[2,5],[2,6]]},
  {id:'R-08',name:'URSA MAJOR',x:215,y:600,radius:95,rotation:.14,points:[[-50,-13],[-29,-25],[-6,-17],[15,-3],[38,-9],[51,9],[36,28]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]]}
];

const ARK_OBJECTS = [
  {id:'globe',kind:'globe',x:1180,y:380,radius:62,prompt:'TOUCH CELESTIAL INDEX',tag:'RELIC CONSTELLATION / CELESTIAL INDEX',title:'CELESTIAL GLOBE'},
  {id:'bell',kind:'bell',x:650,y:440,radius:62,prompt:'TOUCH RESONANCE SIGIL',tag:'RELIC CONSTELLATION / RESONANCE',title:'RESONANCE BELL'},
  {id:'crystal',kind:'crystal',x:1280,y:705,radius:62,prompt:'TOUCH MEMORY CONSTELLATION',tag:'RELIC CONSTELLATION / MEMORY',title:'MEMORY CRYSTAL'},
  {id:'reliquary',kind:'reliquary',x:720,y:760,radius:68,prompt:'TOUCH SEALED CONSTELLATION',tag:'RELIC CONSTELLATION / RELIQUARY',title:'SEALED RELIQUARY'},
  {id:'clock',kind:'clock',x:1060,y:835,radius:72,prompt:'TOUCH HOROLOGIUM',tag:'CONSTELLATION / HOROLOGIUM',title:'HOROLOGIUM'}
];

const arkObjectState={starChartOn:false,crystalAwake:false,reliquaryOpen:false,bellPulseStart:-99999};
const loreTagNode=loreModal.querySelector('.tag');
const loreBodyNode=loreModal.querySelector('p');
let currentStarLightVolume=0;
let targetStarLightVolume=0;

function getNearestArkInteraction(){
  const candidates=[];
  const exitDist=Math.hypot(player.x-exitDoor.x,player.y-exitDoor.y);
  if(exitDist<exitDoor.radius)candidates.push({type:'exit',dist:exitDist,radius:exitDoor.radius,prompt:'RETURN TO MAIN ARCHIVE'});

  const plutoDist=Math.hypot(player.x-score.x,player.y-score.y);
  if(plutoDist<76)candidates.push({type:'pluto',dist:plutoDist,radius:76,prompt:ritualComplete?'OPEN THE HIDDEN PAGE':'TOUCH PLUTO'});

  ARK_ROOMS.forEach(room=>{
    const dist=Math.hypot(player.x-room.x,player.y-room.y);
    if(dist<room.radius)candidates.push({type:'room',dist,radius:room.radius,room,prompt:`ENTER ${room.id} · ${room.name}`});
  });

  ARK_OBJECTS.forEach(object=>{
    const dist=Math.hypot(player.x-object.x,player.y-object.y);
    if(dist<object.radius)candidates.push({type:'object',dist,radius:object.radius,object,prompt:object.prompt});
  });

  candidates.sort((a,b)=>(a.dist/a.radius)-(b.dist/b.radius));
  return candidates[0]||null;
}

openLore=function openArkLore(data=null){
  const content=data||{
    tag:'CENTRAL OBJECT / PLUTO',
    title:'PLUTO',
    body:'방주의 중심에 떠 있는 명왕성. 가까워질수록 자장가가 더 선명해지고, 오랫동안 곁에 머물면 주변의 별자리와 룬이 반응하기 시작합니다.'
  };
  loreTagNode.textContent=content.tag;
  document.getElementById('loreTitle').textContent=content.title;
  loreBodyNode.textContent=content.body;
  modalOpen=true;
  keys.clear();
  loreModal.classList.add('open');
  loreClose.focus();
};

function enterArchiveRoom(room){
  openLore({
    tag:`CONSTELLATION GATE / ${room.id}`,
    title:`${room.id} · ${room.name}`,
    body:'별자리의 선이 잠시 벌어지며 기록 공간으로 이어지는 틈이 생깁니다. 현재 이 구획은 블로그 기록 슬롯으로 준비되어 있으며, 실제 LOG가 연결되면 이 별자리를 통해 바로 들어가게 됩니다.'
  });
}

function openObjectLore(object){
  if(object.id==='globe'){
    arkObjectState.starChartOn=!arkObjectState.starChartOn;
    openLore({tag:object.tag,title:object.title,body:arkObjectState.starChartOn?'천구 투영이 켜졌습니다. 구체 주변에 희미한 궤도와 방향선이 겹쳐 보입니다.':'천구 투영이 꺼지고 작은 별빛만 남습니다.'});
    return;
  }
  if(object.id==='bell'){
    arkObjectState.bellPulseStart=performance.now();
    openLore({tag:object.tag,title:object.title,body:'종을 울리자 소리보다 먼저 빛의 파동이 우주 공간을 가로질러 퍼집니다.'});
    return;
  }
  if(object.id==='crystal'){
    arkObjectState.crystalAwake=!arkObjectState.crystalAwake;
    openLore({tag:object.tag,title:object.title,body:arkObjectState.crystalAwake?'수정 내부의 기억 입자가 깨어나 별가루처럼 떠오릅니다.':'수정의 빛이 가라앉고 기억 입자가 다시 잠듭니다.'});
    return;
  }
  if(object.id==='reliquary'){
    if(!ritualComplete){
      openLore({tag:object.tag,title:object.title,body:'봉인은 반응하지만 열리지 않습니다. 중앙의 PLUTO 공명을 완전히 결속해야 잠금이 해제될 것 같습니다.'});
      return;
    }
    arkObjectState.reliquaryOpen=true;
    openLore({tag:'UNSEALED RELIC / RELIQUARY',title:'RELIQUARY OPENED',body:'봉인이 풀렸습니다. 내부에는 물질 대신 오래된 좌표와 희미한 기록 파편이 빛으로 남아 있습니다.'});
    return;
  }
  if(object.id==='clock'){
    openLore({
      tag:object.tag,
      title:object.title,
      body:'시계자리(Horologium)를 본뜬 희미한 별자리입니다. 더 이상 회전하지 않으며, 주변 별빛과 함께 조용히 고정된 형태로 떠 있습니다.'
    });
  }
}

updateAudio=function updateArkAudio(dt){
  const dist=Math.hypot(player.x-score.x,player.y-score.y);
  const fadeDistance=720;
  const distanceMix=clamp(dist/fadeDistance,0,1);
  const proximity=1-distanceMix;

  // Existing Ark theme grows as the player moves away from Pluto.
  const arkNear=0.018;
  const arkFar=0.18;
  targetVolume=bgmEnabled&&bgmStarted
    ? arkNear+(arkFar-arkNear)*Math.pow(distanceMix,.9)
    : 0;

  // STAR LIGHT stays deliberately softer and becomes clearest close to Pluto.
  const starFar=0.0012;
  const starNear=0.057;
  targetStarLightVolume=bgmEnabled&&bgmStarted
    ? starFar+(starNear-starFar)*Math.pow(proximity,1.45)
    : 0;

  const smoothing=1-Math.pow(.001,dt);
  currentVolume+=(targetVolume-currentVolume)*smoothing;
  currentStarLightVolume+=(targetStarLightVolume-currentStarLightVolume)*smoothing;

  currentVolume=clamp(currentVolume,0,arkFar);
  currentStarLightVolume=clamp(currentStarLightVolume,0,starNear);

  bgm.volume=currentVolume;
  starLightBgm.volume=currentStarLightVolume;

  volumeText.textContent=`ARK ${Math.round(currentVolume*100)}% · STAR ${Math.round(currentStarLightVolume*100)}%`;
  distanceText.textContent=`${(dist/TILE).toFixed(1)} TILE`;
  proximityBar.style.width=`${Math.round(proximity*100)}%`;

  const nearby=getNearestArkInteraction();
  const show=Boolean(nearby)&&!modalOpen;
  interaction.classList.toggle('visible',show);
  interaction.classList.toggle('unlocked',nearby?.type==='pluto'&&ritualComplete);
  interaction.classList.toggle('exit-door',nearby?.type==='exit');
  interaction.classList.toggle('world-object',nearby?.type==='object');
  interaction.classList.toggle('constellation-room',nearby?.type==='room');
  interaction.textContent=show?`E  /  ${nearby.prompt}`:'';
};

interactCenter=function interactWithArk(){
  if(modalOpen)return;
  const nearby=getNearestArkInteraction();
  if(!nearby)return;

  if(nearby.type==='exit'){keys.clear();window.location.href='../index.html';return;}
  if(nearby.type==='pluto'){
    if(ritualComplete){sessionStorage.setItem('plutoArkHiddenUnlocked','1');window.location.href='hidden.html';return;}
    openLore();return;
  }
  if(nearby.type==='room'){enterArchiveRoom(nearby.room);return;}
  if(nearby.type==='object')openObjectLore(nearby.object);
};

function drawConstellationRoom(room,time){
  const dist=Math.hypot(player.x-room.x,player.y-room.y);
  const proximity=clamp(1-dist/220,0,1);
  const pulse=.5+.5*Math.sin(time*.0028+room.x*.002);
  const lineAlpha=.10+proximity*.26+pulse*.045;
  const starAlpha=.32+proximity*.44+pulse*.12;

  ctx.save();ctx.translate(room.x,room.y);ctx.rotate(room.rotation);ctx.globalCompositeOperation='lighter';
  const haze=ctx.createRadialGradient(0,0,0,0,0,88);
  haze.addColorStop(0,`rgba(104,144,202,${.018+proximity*.055})`);
  haze.addColorStop(1,'rgba(70,100,160,0)');
  ctx.fillStyle=haze;ctx.beginPath();ctx.arc(0,0,88,0,Math.PI*2);ctx.fill();

  room.edges.forEach(([a,b])=>{
    const [ax,ay]=room.points[a], [bx,by]=room.points[b];
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);
    ctx.strokeStyle=`rgba(145,190,235,${lineAlpha})`;ctx.lineWidth=.8+proximity*.4;ctx.stroke();
  });

  room.points.forEach(([x,y],index)=>{
    const tw=.45+.55*Math.sin(time*.0035+index*1.71+room.y*.003)**2;
    const size=index%4===0?2.1:1.25;
    ctx.shadowColor='rgba(155,205,255,.85)';ctx.shadowBlur=4+tw*6+proximity*5;
    ctx.fillStyle=`rgba(226,242,255,${starAlpha*(.7+tw*.3)})`;
    ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  });

  ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';ctx.rotate(-room.rotation);
  ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle=`rgba(145,181,215,${.34+proximity*.46})`;
  ctx.fillText(`${room.id} · ${room.name}`,0,74);
  ctx.restore();
}

function drawGlobe(object,time){
  const p=.5+.5*Math.sin(time*.0025);ctx.save();ctx.translate(object.x,object.y);ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle=`rgba(140,192,255,${.28+p*.22})`;ctx.lineWidth=1.1;
  ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,21,7,time*.0004,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,7,21,-time*.00035,0,Math.PI*2);ctx.stroke();
  if(arkObjectState.starChartOn){[32,42,54].forEach((r,i)=>{ctx.strokeStyle=`rgba(120,162,244,${.10+i*.05})`;ctx.beginPath();ctx.arc(0,0,r,time*.0002*(i+1),time*.0002*(i+1)+Math.PI*1.35);ctx.stroke();});}
  ctx.restore();
}
function drawBell(object,time){
  const age=(performance.now()-arkObjectState.bellPulseStart)/1000;ctx.save();ctx.translate(object.x,object.y);
  ctx.fillStyle='rgba(180,160,96,.72)';ctx.beginPath();ctx.moveTo(-14,12);ctx.quadraticCurveTo(-10,-18,0,-22);ctx.quadraticCurveTo(10,-18,14,12);ctx.closePath();ctx.fill();ctx.fillRect(-18,12,36,4);
  if(age>=0&&age<4){for(let i=0;i<4;i++){const p=clamp((age-i*.45)/2.2,0,1);if(p<=0||p>=1)continue;ctx.strokeStyle=`rgba(215,200,138,${(1-p)*.28})`;ctx.beginPath();ctx.arc(0,0,20+p*95,0,Math.PI*2);ctx.stroke();}}
  ctx.restore();
}
function drawCrystal(object,time){
  const p=.5+.5*Math.sin(time*.0047);ctx.save();ctx.translate(object.x,object.y);ctx.globalCompositeOperation='lighter';
  ctx.shadowColor=arkObjectState.crystalAwake?'rgba(181,153,255,.95)':'rgba(90,130,180,.65)';ctx.shadowBlur=arkObjectState.crystalAwake?18+p*9:7;
  ctx.fillStyle=arkObjectState.crystalAwake?`rgba(190,167,255,${.52+p*.24})`:'rgba(110,145,180,.48)';
  ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(17,-4);ctx.lineTo(9,26);ctx.lineTo(-10,26);ctx.lineTo(-18,-4);ctx.closePath();ctx.fill();ctx.restore();
}
function drawReliquary(object,time){
  const p=.5+.5*Math.sin(time*.003);ctx.save();ctx.translate(object.x,object.y);ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle=ritualComplete?`rgba(190,163,255,${.30+p*.35})`:'rgba(120,105,135,.30)';ctx.strokeRect(-28.5,-15.5,57,32);
  ctx.fillStyle=ritualComplete?'rgba(180,154,216,.34)':'rgba(70,65,78,.28)';ctx.fillRect(-28,-15,56,31);
  if(arkObjectState.reliquaryOpen){ctx.strokeStyle='rgba(215,200,138,.45)';ctx.beginPath();ctx.moveTo(-28,-15);ctx.lineTo(-22,-29);ctx.lineTo(22,-29);ctx.lineTo(28,-15);ctx.stroke();}ctx.restore();
}
function drawClock(object,time){
  const points=[[-34,-25],[-17,-10],[-4,10],[13,28],[30,15],[22,-7],[5,-25]];
  const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]];
  const pulse=.55+.45*Math.sin(time*.0022);

  ctx.save();
  ctx.translate(object.x,object.y);
  ctx.globalCompositeOperation='lighter';

  edges.forEach(([a,b])=>{
    const [ax,ay]=points[a], [bx,by]=points[b];
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.lineTo(bx,by);
    ctx.strokeStyle=`rgba(145,190,235,${.16+pulse*.08})`;
    ctx.lineWidth=.9;
    ctx.stroke();
  });

  points.forEach(([x,y],index)=>{
    const size=index===0||index===3?2.1:1.3;
    ctx.fillStyle=`rgba(226,242,255,${.58+pulse*.22})`;
    ctx.beginPath();
    ctx.arc(x,y,size,0,Math.PI*2);
    ctx.fill();
  });

  ctx.globalCompositeOperation='source-over';
  ctx.font='10px monospace';
  ctx.textAlign='center';
  ctx.fillStyle='rgba(135,174,205,.64)';
  ctx.fillText('HOROLOGIUM',0,52);
  ctx.restore();
}

function drawWorldInteractables(time){
  ARK_ROOMS.forEach(room=>drawConstellationRoom(room,time));
  ARK_OBJECTS.forEach(object=>{
    if(object.kind==='globe')drawGlobe(object,time);
    else if(object.kind==='bell')drawBell(object,time);
    else if(object.kind==='crystal')drawCrystal(object,time);
    else if(object.kind==='reliquary')drawReliquary(object,time);
    else if(object.kind==='clock')drawClock(object,time);

    ctx.save();ctx.font='7px monospace';ctx.textAlign='center';ctx.fillStyle='rgba(102,132,150,.38)';
    ctx.fillText(object.title,object.x,object.y+46);ctx.restore();
  });
}
