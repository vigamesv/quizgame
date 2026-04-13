// shared.js — Quiz (v6)

// ── Avatar ──
var AVATAR_COLORS=['#c8ff57','#57b8ff','#ff6f6f','#4dffa0','#d0a8ff','#ffb347','#7dd3fc','#f0abfc'];
var AVATAR_BG=['rgba(200,255,87,.13)','rgba(87,184,255,.13)','rgba(255,111,111,.13)','rgba(77,255,160,.11)','rgba(208,168,255,.13)','rgba(255,179,71,.13)','rgba(125,211,252,.13)','rgba(240,171,252,.13)'];
function initials(n){return String(n||'').trim().split(/\s+/).map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2)||'?';}
function avatarColor(i){return AVATAR_COLORS[((i%8)+8)%8];}
function avatarBg(i){return AVATAR_BG[((i%8)+8)%8];}
function renderAvatar(name,idx,size,fs){
  size=size||32; fs=fs||'0.65rem';
  return '<span class="avatar" style="width:'+size+'px;height:'+size+'px;font-size:'+fs+';background:'+avatarBg(idx)+';color:'+avatarColor(idx)+';">'+initials(name)+'</span>';
}
function escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── Navigation ──
function navigate(url){
  var app=document.getElementById('app');
  if(app){app.style.transition='opacity .18s ease,transform .18s ease';app.style.opacity='0';app.style.transform='translateY(-10px)';}
  setTimeout(function(){window.location.href=url;},200);
}

// ── State ──
var STATE_KEY='quiz_v6';
function saveState(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(e){}}
function loadState(){try{var r=localStorage.getItem(STATE_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
function clearState(){try{localStorage.removeItem(STATE_KEY);}catch(e){}}

// ── Shuffle ──
function shuffle(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}
  return a;
}
function shuffleAll(questions){
  if(!questions||!questions.length) return questions||[];
  return shuffle(questions).map(function(q){
    if(!q.options||q.options.length<2) return q;
    var tagged=q.options.map(function(o,i){return {text:o,correct:(i===Number(q.correct))};});
    var sh=shuffle(tagged);
    var nc=0; sh.forEach(function(o,i){if(o.correct)nc=i;});
    return {q:q.q,options:sh.map(function(o){return o.text;}),correct:nc,explanation:q.explanation||''};
  });
}

// ── Background ──
function initBackground(){
  var canvas=document.getElementById('bgStars');
  if(!canvas)return;
  var ctx=canvas.getContext('2d'),stars=[],t=0,raf=null;
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;build();}
  function build(){
    stars=[];
    var n=Math.min(180,Math.floor(canvas.width*canvas.height/8000));
    for(var i=0;i<n;i++) stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.35+0.2,o:Math.random()*0.5+0.1,sp:Math.random()*0.18+0.04});
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    t+=0.006;
    for(var i=0;i<stars.length;i++){
      var s=stars[i],a=s.o*(0.5+0.5*Math.sin(t*s.sp+i*1.9));
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);
      ctx.fillStyle='rgba(210,205,255,'+a.toFixed(3)+')';ctx.fill();
    }
    raf=requestAnimationFrame(draw);
  }
  resize();draw();
  window.addEventListener('resize',function(){if(raf)cancelAnimationFrame(raf);resize();draw();});
}

// ── Sync polling ──
// Single interval. Fires callback whenever phase OR currentQ changes in localStorage.
var _syncTimer=null,_syncPhase='__init__',_syncQ=-99;
function startSync(cb){
  stopSync();
  _syncPhase='__init__';_syncQ=-99;
  _syncTimer=setInterval(function(){
    var s=loadState();
    if(!s)return;
    if(s.phase!==_syncPhase||s.currentQ!==_syncQ){
      _syncPhase=s.phase;_syncQ=s.currentQ;
      try{cb(s);}catch(e){console.warn('sync cb err',e);}
    }
  },700);
}
function stopSync(){if(_syncTimer){clearInterval(_syncTimer);_syncTimer=null;}}

// ── API ──
async function generateQuestions(topic,count,apiKey){
  var prompt='Generate '+count+' multiple-choice trivia questions about: '+topic+'.\n'+
    'Return ONLY a raw JSON array — no markdown, no code fences, nothing else.\n'+
    'Format: [{"q":"Question?","options":["A","B","C","D"],"correct":0,"explanation":"One sentence."}]\n'+
    '"correct" = 0-based index of the right answer. Mix difficulty. Be specific and accurate.';
  var res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2500,messages:[{role:'user',content:prompt}]})
  });
  if(!res.ok){var err={};try{err=await res.json();}catch(e){}throw new Error(err.error&&err.error.message?err.error.message:'API error '+res.status);}
  var data=await res.json();
  var raw=data.content.map(function(c){return c.text||'';}).join('').trim();
  raw=raw.replace(/^```[\w]*\s*/,'').replace(/\s*```$/,'').trim();
  var match=raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if(!match)throw new Error('Could not parse questions from the AI response. Please try again.');
  var parsed=JSON.parse(match[0]);
  if(!Array.isArray(parsed)||!parsed.length)throw new Error('AI returned no questions. Please try again.');
  parsed=parsed.filter(function(q){return q&&typeof q.q==='string'&&Array.isArray(q.options)&&q.options.length>=2&&typeof q.correct==='number';});
  if(!parsed.length)throw new Error('Questions were malformed. Please try again.');
  return parsed;
}
