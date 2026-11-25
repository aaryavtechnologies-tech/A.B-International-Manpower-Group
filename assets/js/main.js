'use strict';
(() => {
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));
  const root = document.documentElement;
  const body = document.body;
  const header = $('#siteHeader');
  const toggle = $('#menuToggle');
  const close = $('#menuClose');
  const backdrop = $('#menuBackdrop');
  const panel = $('#mobilePanel');
  let lastFocused = null;

  function showMenu() {
    lastFocused = document.activeElement;
    body.classList.add('menu-open');
    toggle?.setAttribute('aria-expanded','true');
    toggle?.setAttribute('aria-label','Close menu');
    panel?.setAttribute('aria-hidden','false');
    close?.focus({preventScroll:true});
  }
  function hideMenu() {
    body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Open menu');
    panel?.setAttribute('aria-hidden','true');
    if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({preventScroll:true});
  }
  toggle?.addEventListener('click', () => body.classList.contains('menu-open') ? hideMenu() : showMenu());
  close?.addEventListener('click', hideMenu);
  backdrop?.addEventListener('click', hideMenu);
  $$('.mobile-nav-links a, .mobile-panel-bottom a').forEach(el => el.addEventListener('click', hideMenu));
  document.addEventListener('keydown', ev => {
    if(ev.key === 'Escape' && body.classList.contains('menu-open')) hideMenu();
    if(ev.key === 'Tab' && body.classList.contains('menu-open') && panel) {
      const controls = $$('.mobile-panel-head button, .mobile-nav-links a, .mobile-panel-bottom a',panel);
      if(!controls.length) return;
      const first=controls[0], last=controls[controls.length-1];
      if(ev.shiftKey && document.activeElement===first){ev.preventDefault();last.focus()}
      else if(!ev.shiftKey && document.activeElement===last){ev.preventDefault();first.focus()}
    }
  });
  window.addEventListener('resize', () => { if(window.innerWidth > 1110 && body.classList.contains('menu-open')) hideMenu() }, {passive:true});

  const backTop = $('#backTop');
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 35);
    backTop?.classList.toggle('show',window.scrollY > 550);
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
  const yr = $('#year'); if(yr) yr.textContent = String(new Date().getFullYear());

  // Source images are genuine editorial photography. Preserve an attractive background
  // if an external image provider is temporarily unavailable.
  $$('img').forEach(image => image.addEventListener('error', () => {
    if(image.dataset.fallbackDone) return;
    image.dataset.fallbackDone='1';
    if(image.getAttribute('src')?.startsWith('https:')) {
      image.style.opacity='0';
      image.setAttribute('aria-label',image.alt + ' (image temporarily unavailable)');
    }
  }));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = $$('.section-head, .intro-main, .statement-card, .photo-tile, .step-row, .people-list, .team-name-list > div, .process-card, .job-category-card, .destination, .gallery-cell');
  if(!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
      });
    }, {threshold: .055,rootMargin:'0px 0px 50px 0px'});
    revealEls.forEach(el => { el.setAttribute('data-reveal',''); observer.observe(el); });
  }

  const counters = $$('[data-count]');
  const animateCounter = el => {
    if(el.dataset.done) return;
    el.dataset.done='1';
    const target=Number(el.dataset.count)||0;
    const suffix=el.dataset.suffix||'';
    if(reducedMotion){el.textContent=target.toLocaleString('en-IN')+suffix;return}
    let start=null;
    const duration=1350;
    const tick=(ts)=>{
      if(start===null)start=ts;
      const progress=Math.min((ts-start)/duration,1);
      const eased=1-Math.pow(1-progress,3);
      el.textContent=Math.floor(eased*target).toLocaleString('en-IN')+suffix;
      if(progress<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if('IntersectionObserver' in window){
    const counterObserver=new IntersectionObserver(entries => {
      entries.forEach(entry => {if(entry.isIntersecting){animateCounter(entry.target);counterObserver.unobserve(entry.target)}});
    },{threshold:.45});
    counters.forEach(el=>counterObserver.observe(el));
  }else counters.forEach(animateCounter);

  const params=new URLSearchParams(window.location.search);
  const search=$('#jobSearch');
  const cards=$$('.job-category-card');
  const filterButtons=$$('.filter-btn');
  const empty=$('#emptyResults');
  let activeFilter='All';
  function doFilter(){
    const q=(search?.value||'').trim().toLowerCase();
    let shown=0;
    cards.forEach(card => {
      const category=card.dataset.category||'';
      const isMatch=(activeFilter==='All'||activeFilter===category) && (!q||card.textContent.toLowerCase().includes(q));
      card.hidden=!isMatch;
      if(isMatch)shown++;
    });
    const countryBar=$('.job-global-bar');
    if(countryBar)countryBar.hidden= !((activeFilter==='All' || activeFilter==='Logistics') && !q);
    if(empty)empty.hidden=shown>0;
  }
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
    activeFilter=btn.dataset.filter||'All';
    filterButtons.forEach(b=>b.classList.toggle('active',b===btn));
    doFilter();
  }));
  search?.addEventListener('input',doFilter);
  const requestedCategory=params.get('category');
  if(requestedCategory){
    const match=filterButtons.find(btn=>btn.dataset.filter===requestedCategory);
    if(match){match.click();}else doFilter();
  }

  const contactCountry=$('#countrySelect');
  const contactInterest=$('#interestSelect');
  if(contactCountry && params.has('country')){
    const match=Array.from(contactCountry.options).find(o=>o.value.toLowerCase()===params.get('country').toLowerCase());
    if(match)contactCountry.value=match.value;
  }
  if(contactInterest && params.has('interest')){
    const key=params.get('interest').toLowerCase();
    const match=Array.from(contactInterest.options).find(o=>o.value.toLowerCase().includes(key));
    if(match)contactInterest.value=match.value;
  }
  const form=$('#enquiryForm');
  const formStatus=$('#formStatus');
  if(params.get('sent')==='1' && formStatus){
    formStatus.className='form-status success';formStatus.textContent='Thank you. Your enquiry was submitted.';
  }
  form?.addEventListener('submit', (event)=>{
    event.preventDefault();
    const formData=new FormData(form);
    const name=(formData.get('name')||'').toString().trim();
    const phone=(formData.get('phone')||'').toString().trim();
    const email=(formData.get('email')||'').toString().trim();
    const country=(formData.get('country')||'').toString().trim();
    const interest=(formData.get('interest')||'').toString().trim();
    const messageText=(formData.get('message')||'').toString().trim();

    const lines=[
      'Hello A.B International Manpower Group,',
      '',
      '*New Overseas Employment Enquiry*',
      `*Name:* ${name}`,
      `*Phone:* ${phone}`
    ];
    if(email) lines.push(`*Email:* ${email}`);
    if(country) lines.push(`*Preferred Country:* ${country}`);
    if(interest) lines.push(`*Area of Interest:* ${interest}`);
    if(messageText) lines.push(`*Message:* ${messageText}`);

    const message=lines.join('\n');
    const waUrl='https://wa.me/919887020804?text='+encodeURIComponent(message);

    if(formStatus){
      formStatus.className='form-status success';
      formStatus.textContent='Enquiry opened in WhatsApp. Please send your message there.';
    }

    const link=document.createElement('a');
    link.href=waUrl;
    link.target='_blank';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
})();
