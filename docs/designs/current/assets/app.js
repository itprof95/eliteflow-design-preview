(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('details[open]').forEach(el => el.open = false);
      if (nav?.classList.contains('is-open')) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        menu.focus();
      }
    }
  });
  document.addEventListener('click', e => {
    document.querySelectorAll('.services-menu[open]').forEach(el => {
      if (!el.contains(e.target)) el.open = false;
    });
  });
  const form = document.querySelector('#service-form');
  if (!form) return;
  let started = Date.now();
  const status = document.querySelector('#form-status');
  const fallback = document.querySelector('#request-fallback');
  const photo = form.elements.photo;
  const emailDelivery = window.ELITEFLOW_CONFIG?.emailDelivery;
  const showStatus = (message, type = 'error') => {
    status.textContent = message;
    status.className = `form-status ${type}`;
    status.hidden = false;
    status.focus();
  };
  function choose(value, focusEmergency = false) {
    document.querySelector('#emergency-flow').hidden = value !== 'emergency';
    document.querySelector('#standard-flow').hidden = value !== 'standard';
    if (value === 'emergency' && focusEmergency) {
      const emergency = document.querySelector('#emergency-flow');
      emergency.scrollIntoView({block:'start',behavior:'auto'});
      emergency.focus({preventScroll:true});
    }
  }
  document.querySelectorAll('input[name="request-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'standard' && form.elements.service.value === 'Emergency Plumbing') form.elements.service.value = '';
      choose(radio.value, true);
    });
  });
  const query = new URLSearchParams(location.search);
  const mode = query.get('request');
  if (['standard', 'emergency'].includes(mode)) {
    document.querySelector(`input[name="request-type"][value="${mode}"]`).checked = true;
    choose(mode);
  }
  const service = query.get('service');
  if (service && [...form.elements.service.options].some(o => o.value === service)) form.elements.service.value = service;
  if (service === 'Emergency Plumbing') {
    document.querySelector('input[name="request-type"][value="emergency"]').checked = true;
    choose('emergency');
  }
  form.elements.service.addEventListener('change', () => {
    if (form.elements.service.value === 'Emergency Plumbing') {
      document.querySelector('input[name="request-type"][value="emergency"]').checked = true;
      choose('emergency', true);
    }
  });
  const today = new Date();
  form.elements.date.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  photo.addEventListener('change', () => {
    const file = photo.files[0];
    const text = document.querySelector('#photo-status');
    photo.setCustomValidity('');
    text.textContent = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) photo.setCustomValidity('Choose a JPG, PNG, or WebP image.');
    else if (file.size > 5*1024*1024) photo.setCustomValidity('Your photo must be 5 MB or smaller.');
    text.textContent = photo.validationMessage || `${file.name} selected (${(file.size/1024/1024).toFixed(2)} MB). ${emailDelivery?.verified ? 'It will be included when you submit the request.' : 'Automatic photo delivery is pending inbox verification. Attach it separately if you use the email draft.'}`;
  });
  form.elements.phone.addEventListener('input', () => form.elements.phone.setCustomValidity(''));
  function prepareFallback(data) {
    const labels = {fullName:'Name',phone:'Phone',email:'Email',address:'Service address',zip:'ZIP',service:'Service',description:'Problem',date:'Preferred date (request only)',time:'Preferred time (request only)'};
    const body = Object.entries(labels).map(([k,label]) => `${label}: ${String(data.get(k)||'No preference')}`).join('\n\n');
    document.querySelector('#email-draft').href = `mailto:Liteflowservices@gmail.com?subject=${encodeURIComponent('Plumbing service request — '+data.get('service'))}&body=${encodeURIComponent(body+'\n\nThis is a standard request, not a confirmed appointment. Optional photos must be attached separately.')}`;
    fallback.hidden = false;
  }
  // FormSubmit's documented native multipart POST supports photo attachments
  // and its normal spam check. Never disable its CAPTCHA or put customer data
  // in the return URL. A provider handoff is not proof of inbox delivery.
  function handOffEmail(data) {
    if (emailDelivery?.provider !== 'FormSubmit' || emailDelivery.verified !== true ||
        emailDelivery.endpoint !== 'https://formsubmit.co/Liteflowservices@gmail.com' ||
        emailDelivery.recipient !== 'Liteflowservices@gmail.com') return false;
    const returnUrl = new URL(location.pathname, location.origin);
    returnUrl.searchParams.set('request','standard');
    returnUrl.searchParams.set('submitted','1');
    const fields = {
      _subject:'Eliteflow — standard plumbing service request',
      _template:'table',
      _replyto:String(data.get('email')),
      _honey:String(data.get('website') || ''),
      _url:new URL(window.ELITEFLOW_CONFIG?.siteBasePath || '/',location.origin).href.replace(/\/$/,''),
      _next:returnUrl.href,
      sourcePage:location.origin + location.pathname,
      appointmentStatus:'Requested — business confirmation required'
    };
    form.querySelectorAll('[data-email-field]').forEach(input => input.remove());
    for (const [name,value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type='hidden'; input.name=name; input.value=value;
      input.setAttribute('data-email-field',''); form.appendChild(input);
    }
    form.action=emailDelivery.endpoint;
    form.method='POST';
    form.enctype='multipart/form-data';
    photo.name='attachment';
    const button=document.querySelector('#submit-request');
    button.disabled=true;
    button.textContent='Continuing to the spam check…';
    HTMLFormElement.prototype.submit.call(form);
    return true;
  }
  window.addEventListener('pageshow', () => {
    // Restore the form if the visitor returns from the provider's error page.
    photo.name='photo';
    const button=document.querySelector('#submit-request');
    button.disabled=false;
    button.textContent='Request Service';
  });
  if (query.get('submitted') === '1' && emailDelivery?.verified === true) {
    showStatus('Your request has been submitted for email processing. This does not confirm an appointment. Call if you need to confirm receipt or discuss urgent help.','success');
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (document.querySelector('input[name="request-type"]:checked')?.value !== 'standard') return;
    const digits = form.elements.phone.value.replace(/\D/g,'');
    if (digits.length < 10 || digits.length > 15) form.elements.phone.setCustomValidity('Enter a phone number with 10 to 15 digits.');
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('website')) {showStatus('We could not process this request. Please call (571) 682-5754.'); return;}
    if (Date.now()-started < 3000) {showStatus('Please take a moment to review your details, then try again.'); return;}
    data.set('startedAt',String(started));
    data.set('requestType','standard');
    if (handOffEmail(data)) return;
    const endpoint = window.ELITEFLOW_CONFIG?.requestEndpoint;
    if (!endpoint) {
      prepareFallback(data);
      showStatus('Your request was not sent. Automatic email delivery to Liteflowservices@gmail.com is awaiting inbox verification. Call (571) 682-5754, or open the email draft below and send it yourself. Attach any photo separately. No appointment has been booked.');
      return;
    }
    const button = document.querySelector('#submit-request');
    button.disabled = true;
    button.textContent = 'Sending your request…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),20000);
    try {
      const target = new URL(endpoint,location.origin);
      if (target.origin !== location.origin) throw new Error('Use an approved same-origin form route.');
      const response = await fetch(target,{method:'POST',body:data,signal:controller.signal,headers:{Accept:'application/json'}});
      let result;
      try {result = await response.json();} catch {throw new Error('Invalid response');}
      if (!response.ok || result?.delivered !== true) throw new Error('Delivery not confirmed');
      fallback.hidden = true;
      form.reset();
      document.querySelector('#photo-status').textContent = '';
      started = Date.now();
      showStatus('Your service request has been delivered. Your preferred date and time are requests, not a confirmed appointment. The business will contact you about availability.','success');
    } catch {
      prepareFallback(data);
      showStatus('We could not confirm delivery. No appointment has been booked. Your details remain here. Please call (571) 682-5754, or review and send the email draft below. If the connection timed out, ask the team whether they received your request before sending it again.');
    } finally {
      clearTimeout(timer);
      button.disabled = false;
      button.innerHTML = 'Request Service <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    }
  });
})();
