(() => {
 'use strict';
 const config=window.VYB_CONFIG;
 if(!config)throw new Error('Missing generated config.js');
 function validHttpsUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
 function bookingUrl(value,type){const safe=validHttpsUrl(value);if(!safe)return '';const u=new URL(safe);return type!=='modal'||(!u.port&&u.hostname.toLowerCase().endsWith('.setmore.com'))?safe:'';}
 function localImage(value){return typeof value==='string'&&/^assets\/[\w./-]+\.(?:webp|png|jpe?g|avif|svg)$/i.test(value)&&!value.split('/').includes('..')?value:'';}
 function emailValid(value){return typeof value==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
 window.VYB_PET_HELPERS={validHttpsUrl,bookingUrl,localImage,emailValid};
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),mode=config.mode==='booking'?'booking':'basic';
 let language=config.language.default==='es'?'es':'en',size=config.sizes[0].id;
 try{const saved=localStorage.getItem(config.language.storageKey);if(['en','es'].includes(saved))language=saved;}catch{}
 const local=v=>v&&typeof v==='object'?(v[language]??v.en??''):(v??'');
 const t=key=>config.translations[language]?.[key]||key;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const image=src=>localImage(src)||validHttpsUrl(src),motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
 const bookingType=config.booking.mode==='modal'?'modal':'external',url=bookingUrl(config.booking.url,bookingType);
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08}):null;
 function reveal(){document.querySelectorAll('.reveal:not(.visible)').forEach(node=>observer?observer.observe(node):node.classList.add('visible'));}
 const nav=$('main-nav'),menu=$('menu-toggle'),mobile=matchMedia('(max-width:960px)');
 function syncMenu(){const open=menu.getAttribute('aria-expanded')==='true';nav.inert=mobile.matches&&!open;menu.setAttribute('aria-label',t(open?'closeMenu':'openMenu'));}
 function closeMenu(focus=false){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');syncMenu();if(focus)menu.focus();}
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);syncMenu();});mobile.addEventListener('change',()=>closeMenu());
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
 // The modal lifecycle follows the shared VYB integration: inert background, focus trap, Escape and focus restoration.
 let activeModal=null,previousFocus=null,inertBackground=[];
 function openModal(modal,trigger,focus){if(!modal)return;closeMenu();previousFocus=trigger||document.activeElement;activeModal=modal;modal.hidden=false;inertBackground=[...document.body.children].filter(e=>e!==modal).map(e=>[e,e.inert]);inertBackground.forEach(([e])=>e.inert=true);document.body.classList.add('modal-open');focus.focus();}
 function closeModal(){if(!activeModal)return;activeModal.hidden=true;if(activeModal.id==='booking-modal'){$('booking-frame').removeAttribute('src');$('booking-fallback').removeAttribute('href');}else $('lightbox-image').removeAttribute('src');inertBackground.forEach(([e,value])=>e.inert=value);inertBackground=[];activeModal=null;document.body.classList.remove('modal-open');if(previousFocus?.isConnected)previousFocus.focus();}
 function openBooking(trigger){
  if(mode!=='booking')return;const modal=$('booking-modal');if(!modal)return;
  const frame=$('booking-frame'),fallback=$('booking-fallback');frame.hidden=!url;fallback.hidden=!url;
  $('booking-modal-help').textContent=url?t('bookingModalHelp'):config.booking.url?t('bookingInvalidUrl'):t('bookingNotConfigured');
  if(url){frame.src=url;fallback.href=url;}else{frame.removeAttribute('src');fallback.removeAttribute('href');}
  openModal(modal,trigger,$('booking-modal-close'));
 }
 const bookingModal=$('booking-modal'),lightbox=$('image-lightbox');
 if(bookingModal){$('booking-modal-close').addEventListener('click',closeModal);bookingModal.addEventListener('click',e=>{if(e.target===bookingModal)closeModal();});}
 $('lightbox-close').addEventListener('click',closeModal);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeModal();});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(activeModal){e.preventDefault();closeModal();}else if(menu.getAttribute('aria-expanded')==='true')closeMenu(true);}
  if(e.key==='Tab'&&activeModal){const stops=[...activeModal.querySelectorAll('button,a[href],iframe:not([hidden])')].filter(n=>!n.hidden);const first=stops[0],last=stops.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 function hasContact(){return Boolean(config.contact.phone||config.contact.whatsapp||config.contact.email||config.contact.socials?.length);}
 function showContact(){const status=$('contact-status');status.hidden=hasContact();status.textContent=t('contactUnavailable');$('visit').scrollIntoView({behavior:motion(),block:'start'});if(!hasContact())status.focus({preventScroll:true});}
 function makeAction(container,key,cls='button'){
  if(!container)return;container.replaceChildren();const external=mode==='booking'&&url&&bookingType==='external';const action=el(external?'a':'button',cls);if(external){action.href=url;action.target='_blank';action.rel='noopener noreferrer';}else{action.type='button';action.addEventListener('click',()=>mode==='booking'?openBooking(action):showContact());if(mode==='booking')action.setAttribute('aria-haspopup','dialog');}
  action.append(el('span','',t(key)),el('span','arrow','↗'));container.append(action);
 }
 function renderActions(){makeAction($('header-action'),mode==='booking'?'bookNow':'heroBasic');makeAction($('hero-action'),mode==='booking'?'heroBooking':'heroBasic');makeAction($('visit-action'),mode==='booking'?'visitBooking':'visitBasic');if(mode==='booking')makeAction($('booking-action'),'manifestoBooking');}
 function renderSizes(){const target=$('size-switch');target.replaceChildren();target.setAttribute('aria-label',t('sizeLabel'));config.sizes.forEach(item=>{const button=el('button');button.type='button';button.dataset.size=item.id;button.setAttribute('aria-pressed',String(item.id===size));button.append(el('strong','',local(item.label)),el('small','',local(item.detail)));button.addEventListener('click',()=>{size=item.id;renderSizes();renderServices();target.querySelector(`[data-size="${size}"]`).focus();});target.append(button);});}
 function money(value,currency){return new Intl.NumberFormat(language==='es'?'es-AR':'en-US',{style:'currency',currency,maximumFractionDigits:0}).format(value);}
 function renderServices(){
  $('service-list').replaceChildren();config.services.forEach((service,i)=>{const card=el('article','service-card'),top=el('div','service-top'),thumb=el('div','service-thumb'),img=el('img');img.src=image(service.image);img.alt=local(service.title);img.loading='lazy';img.decoding='async';img.width=140;img.height=140;thumb.append(img);top.append(thumb,el('span','service-index',String(i+1).padStart(2,'0')));const meta=el('div','service-meta'),price=el('span','service-price');price.append(el('small','',t('from')),document.createTextNode(money(service.prices[size],service.currency)));if(config.serviceDisplay.price)meta.append(price);if(config.serviceDisplay.duration)meta.append(el('span','service-duration',local(service.duration)));card.append(top,el('h3','',local(service.title)),el('p','',local(service.description)),meta);
   const holder=el('div');makeAction(holder,'serviceAction','text-link');card.append(holder);$('service-list').append(card);});
  $('price-note').textContent=t('priceNote').replace('{currency}',config.services[0]?.currency||'');
 }
 function renderGallery(){
  $('gallery-grid').replaceChildren();config.images.gallery.forEach((item,i)=>{const button=el('button','gallery-tile reveal'),visual=el('span','gallery-image'),img=el('img');button.type='button';button.setAttribute('aria-label',t('galleryOpen')+': '+local(item.alt));img.src=image(item.src);img.alt=local(item.alt);img.loading='lazy';img.decoding='async';img.width=700;img.height=900;const plus=el('span','gallery-plus','+');plus.setAttribute('aria-hidden','true');visual.append(img,plus);const caption=el('span','gallery-caption',local(item.caption));caption.append(el('small','',String(i+1).padStart(2,'0')));button.append(visual,caption);button.addEventListener('click',()=>{$('lightbox-image').src=image(item.large||item.src);$('lightbox-image').alt=local(item.alt);$('lightbox-caption').textContent=local(item.caption);openModal(lightbox,button,$('lightbox-close'));});$('gallery-grid').append(button);});
 }
 function renderContent(){
  $('philosophy-list').replaceChildren();config.philosophy.forEach((item,i)=>{const card=el('article','philosophy-card reveal');card.append(el('span','',String(i+1).padStart(2,'0')),el('h3','',local(item.title)),el('p','',local(item.body)));$('philosophy-list').append(card);});
  const opened=[...$('faq-list').querySelectorAll('details')].map(e=>e.open);$('faq-list').replaceChildren();config.faqs.forEach((item,i)=>{const details=el('details');details.open=Boolean(opened[i]);let answer=local(item.a);if(item.id==='booking')answer=mode==='basic'?t('basicBookingAnswer'):url?t('connectedBookingAnswer'):answer;details.append(el('summary','',local(item.q)),el('p','',answer));$('faq-list').append(details);});
  $('testimonials').hidden=!config.testimonials?.length;$('review-list').replaceChildren();(config.testimonials||[]).forEach(item=>{const card=el('article','review-card');card.append(el('span','review-tag',t('demoReview')),el('blockquote','',local(item.quote)),el('cite','',local(item.name)));$('review-list').append(card);});
 }
 function contactLink(label,href){const a=el('a','',label);a.href=href;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}a.append(el('span','','↗'));$('contact-links').append(a);}
 function renderContacts(){
  const d=config.businessDetails;$('address').textContent=local(d.address);$('address-note').textContent=local(d.addressNote);$('hours-note').textContent=local(d.hoursNote);$('hours').replaceChildren();d.hours.forEach(row=>{const node=el('div','hours-row');node.append(el('span','',local(row.label)),el('span','',local(row.value)));$('hours').append(node);});$('contact-links').replaceChildren();
  const c=config.contact;if(c.phone)contactLink(t('phoneLabel'),'tel:'+c.phone.replace(/[^\d+]/g,''));if(c.whatsapp)contactLink(t('whatsappLabel'),'https://wa.me/'+c.whatsapp.replace(/\D/g,''));if(emailValid(c.email))contactLink(t('emailLabel'),'mailto:'+c.email);(c.socials||[]).forEach(s=>{const url=validHttpsUrl(s.url);if(url)contactLink(s.label,url);});if(!hasContact())$('contact-links').append(el('p','',t('contactUnavailable')));if(!$('contact-status').hidden)$('contact-status').textContent=t('contactUnavailable');
 }
 function setLanguage(lang,save=true){
  language=lang==='es'?'es':'en';document.documentElement.lang=language;
  document.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=t(node.dataset.i18n));document.querySelectorAll('[data-business-name]').forEach(node=>node.textContent=config.business.name);document.querySelectorAll('[data-business-tagline]').forEach(node=>node.textContent=config.business.tagline||'');
  $('lang-toggle').textContent=language.toUpperCase()+' / '+(language==='en'?'ES':'EN');$('lang-toggle').setAttribute('aria-label',t('switchLanguage').replace('{language}',t(language==='en'?'languageName_es':'languageName_en')));nav.setAttribute('aria-label',t('navLabel'));$('footer-nav').setAttribute('aria-label',t('footerNav'));document.querySelector('.brand').setAttribute('aria-label',config.business.name+' — '+t('homeLabel'));
  $('hero-image').src=image(config.images.hero);$('hero-image').alt=local(config.images.heroAlt);$('story-image').src=image(config.images.manifesto);$('story-image').alt=local(config.images.manifestoAlt||config.images.gallery.find(i=>i.src===config.images.manifesto)?.alt||config.images.heroAlt);
  const seo=config.seoLocalized?.[language]||config.seo;document.title=seo.title;$('meta-description').content=seo.description;document.querySelector('meta[property="og:title"]').content=seo.title;document.querySelector('meta[property="og:description"]').content=seo.description;
  if(bookingModal){$('booking-modal-close').setAttribute('aria-label',t('bookingModalClose'));$('booking-frame').title=t('bookingModalTitle');}
  $('lightbox-close').setAttribute('aria-label',t('galleryClose'));lightbox.setAttribute('aria-label',t('gallerySelected'));
  renderSizes();renderServices();renderGallery();renderContent();renderContacts();renderActions();syncMenu();reveal();
  if(mode==='booking'&&url&&$('booking-intro'))$('booking-intro').textContent=t('bookingIntroReady');
  document.querySelector('.demo-ribbon').hidden=!config.business.demoLabel;
  if(save)try{localStorage.setItem(config.language.storageKey,language);}catch{}
 }
 $('lang-toggle').addEventListener('click',()=>setLanguage(language==='en'?'es':'en'));
 const palette={...config.template.defaults.colors,...config.brand.colors};const css={accent:'--terracotta',primary:'--gold',secondary:'--ink-2',backgroundDark:'--black',accentLight:'--gold-light',backgroundLight:'--paper',backgroundSoft:'--paper-soft',muted:'--muted',white:'--white',button:'--button',buttonText:'--button-text',servicesBackground:'--services-bg',heroBackground:'--hero-bg',manifestoBackground:'--manifesto-bg',footerBackground:'--footer-bg',textOnDark:'--text-on-dark',textMutedOnDark:'--text-muted-on-dark',textMutedOnLight:'--text-muted-on-light',cardBackground:'--card-bg',cardBorder:'--card-border',text:'--ink'};Object.entries(palette).forEach(([key,value])=>{if(css[key]&&/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value))document.documentElement.style.setProperty(css[key],value);});
 if(config.brand.logoImage){const img=el('img');img.src=image(config.brand.logoImage);img.alt=config.business.name;$('brand-icon').replaceChildren(img);}
 $('year').textContent=config.business.copyrightYear||new Date().getFullYear();
 let queued=false;const navLinks=[...nav.querySelectorAll('a')];function updateActive(){queued=false;let active;navLinks.forEach(link=>{if(document.querySelector(link.getAttribute('href')).getBoundingClientRect().top<=150)active=link;});navLinks.forEach(link=>active===link?link.setAttribute('aria-current','location'):link.removeAttribute('aria-current'));}window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateActive);}},{passive:true});
 setLanguage(language,false);updateActive();
})();
