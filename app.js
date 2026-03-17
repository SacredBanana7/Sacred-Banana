// Sacred Banana — app.js

// Image onload handler (replaces inline onload attributes)
document.querySelectorAll('img[data-onload]').forEach(function(img){
  if(img.complete){img.classList.add('loaded');}
  else{img.addEventListener('load',function(){this.classList.add('loaded');});}
});

// Loader
var statusMsgs=['initializing_temple.exe','loading_sacred_geometry...','decrypting_banana_data...','connecting_to_imperium...','ACCESS GRANTED'];
var si=0;
var loaderStatus=document.getElementById('loaderStatus');
var ldrInt=setInterval(function(){si++;if(si<statusMsgs.length)loaderStatus.textContent=statusMsgs[si];if(si>=statusMsgs.length)clearInterval(ldrInt);},380);
setTimeout(function(){document.getElementById('loader').classList.add('gone');},2000);

// Clock
function tick(){var n=new Date();document.getElementById('clock').textContent=[n.getHours(),n.getMinutes(),n.getSeconds()].map(function(v){return String(v).padStart(2,'0');}).join(':');}
tick();setInterval(tick,1000);

// Reveal
var rrEls=document.querySelectorAll('.rr');
var rrObs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)setTimeout(function(){e.target.classList.add('vis');},60);});},{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
rrEls.forEach(function(el){rrObs.observe(el);});

// Back to top
var btt=document.getElementById('btt');
window.addEventListener('scroll',function(){btt.classList.toggle('show',window.scrollY>600);},{passive:true});
btt.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});

// Smooth scroll anchors
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}});});

// Buy buttons
document.querySelectorAll('.pcard-buy').forEach(function(btn){btn.addEventListener('click',function(){var o=this.textContent;this.textContent='\u2713 ADDED';this.style.background='var(--yellow)';this.style.color='#000';this.style.borderColor='var(--yellow)';var self=this;setTimeout(function(){self.textContent=o;self.style.background='';self.style.color='';self.style.borderColor='';},2000);});});

// Email — Cloudflare Pages Function Submit (Spam protection: honeypot + time check)
var formLoadTime=Date.now();
document.getElementById('disciplesForm').addEventListener('submit',function(e){
  e.preventDefault();
  var btn=document.getElementById('initBtn');
  var emailIn=document.getElementById('emailIn');
  var honeypot=this.querySelector('[name="bot-field"]');
  var v=emailIn.value.trim();
  // Honeypot check: reject if hidden field is filled (bot behavior)
  if(honeypot&&honeypot.value){return;}
  // Time check: reject if submitted faster than 3 seconds (bot behavior)
  if(Date.now()-formLoadTime<3000){return;}
  if(!v||!v.includes('@')){emailIn.style.borderColor='var(--red)';emailIn.placeholder='A real email, pilgrim.';setTimeout(function(){emailIn.style.borderColor='';emailIn.placeholder='your.soul@universe.com';},2200);return;}
  btn.textContent='Transmitting...';btn.disabled=true;
  fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:v})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(){btn.textContent='\ud83c\udf4c INITIATED';btn.style.background='var(--yellow-hot)';emailIn.value='';emailIn.placeholder='You are now among the Enlightened.';})
    .catch(function(){btn.textContent='Initiate Me';btn.disabled=false;btn.style.background='';btn.style.borderColor='var(--red)';btn.style.color='var(--red)';emailIn.style.borderColor='var(--red)';emailIn.placeholder='Transmission failed. Try again, pilgrim.';setTimeout(function(){emailIn.style.borderColor='';emailIn.placeholder='your.soul@universe.com';btn.style.borderColor='';btn.style.color='';},3000);});
});

// Hover Video System
(function(){
  var pcards=document.querySelectorAll('.pcard');
  var isTouchDevice=window.matchMedia('(hover: none)').matches;
  if(isTouchDevice)return;
  pcards.forEach(function(card){
    var video=card.querySelector('.pcard-video');
    if(!video)return;
    var sourcesLoaded=false;
    card.addEventListener('mouseenter',function(){
      if(!sourcesLoaded){
        var webm=video.dataset.srcWebm;
        var mp4=video.dataset.srcMp4;
        if(webm){var s=document.createElement('source');s.src=webm;s.type='video/webm';video.appendChild(s);}
        if(mp4){var s=document.createElement('source');s.src=mp4;s.type='video/mp4';video.appendChild(s);}
        video.load();
        sourcesLoaded=true;
      }
      var p=video.play();
      if(p)p.then(function(){video.classList.add('playing');}).catch(function(){});
    });
    card.addEventListener('mouseleave',function(){
      video.classList.remove('playing');
      video.pause();
      video.currentTime=0;
    });
  });
  var vObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var v=e.target.querySelector('.pcard-video');
        if(v)v.preload='metadata';
        vObs.unobserve(e.target);
      }
    });
  },{rootMargin:'200px'});
  pcards.forEach(function(card){vObs.observe(card);});
})();

// Pyramid Background Scroll
(function(){
  var bg=document.getElementById('pyramid-bg');
  if(!bg)return;
  var img=bg.querySelector('img');
  if(!img)return;
  var ticking=false;
  function updateBg(){
    var scrollPercent=window.scrollY/(document.body.scrollHeight-window.innerHeight);
    var maxShift=img.offsetHeight-window.innerHeight;
    var yShift=-(scrollPercent*maxShift);
    img.style.transform='translate(-50%,'+yShift+'px)';
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){requestAnimationFrame(updateBg);ticking=true;}
  },{passive:true});
  img.addEventListener('load',updateBg);
  updateBg();
})();
