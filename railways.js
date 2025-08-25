(function(){
  'use strict';

  const resultsBody = document.getElementById('resultsBody');
  const searchForm = document.getElementById('searchForm');
  const journeyDate = document.getElementById('journeyDate');
  const fromStation = document.getElementById('fromStation');
  const toStation = document.getElementById('toStation');
  const travelClass = document.getElementById('travelClass');

  const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));

  const passengerForm = document.getElementById('passengerForm');
  const selectedSummary = document.getElementById('selectedSummary');
  const proceedToPaymentBtn = document.getElementById('proceedToPaymentBtn');
  const payNowBtn = document.getElementById('payNowBtn');

  const pnrInput = document.getElementById('pnrInput');
  const pnrLookupBtn = document.getElementById('pnrLookupBtn');
  const pnrResult = document.getElementById('pnrResult');

  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  const trainStatusBtn = document.getElementById('trainStatusBtn');
  const trainStatusNumber = document.getElementById('trainStatusNumber');
  const trainStatusResult = document.getElementById('trainStatusResult');

  const themeToggle = document.getElementById('themeToggle');

  // Station list
  const stationListEl = document.getElementById('stationList');
  let stationsIndex = [];

  // Train details modal refs
  let trainDetailsModal;
  const tdTitle = document.getElementById('tdTitle');
  const tdType = document.getElementById('tdType');
  const tdClasses = document.getElementById('tdClasses');
  const tdDays = document.getElementById('tdDays');
  const tdDistance = document.getElementById('tdDistance');
  const tdSpeed = document.getElementById('tdSpeed');
  const tdDuration = document.getElementById('tdDuration');
  const tdStops = document.getElementById('tdStops');

  const STORAGE_KEYS = {
    BOOKINGS: 'rail.bookings',
    THEME: 'rail.theme'
  };

  function initDate(){
    const today = new Date();
    const iso = today.toISOString().slice(0,10);
    journeyDate.value = iso;
    journeyDate.min = iso;
  }

  const demoTrains = [
    { id:'12001', name:'Shatabdi Express', from:'Delhi', to:'Chandigarh', dep:'07:00', arr:'10:20', duration:'3h 20m', baseFare:650,
      details:{ type:'Shatabdi', classes:['EC','CC','2S'], days:['Daily'], distance:244, avgSpeed:'74 km/h',
        stops:[
          {no:1, code:'NDLS', name:'New Delhi', arr:'--', dep:'07:00', halt:'--', day:1},
          {no:2, code:'PNP', name:'Panipat', arr:'07:55', dep:'07:57', halt:'2m', day:1},
          {no:3, code:'KUN', name:'Karnal', arr:'08:18', dep:'08:20', halt:'2m', day:1},
          {no:4, code:'CDG', name:'Chandigarh', arr:'10:20', dep:'--', halt:'--', day:1}
        ]
      }
    },
    { id:'12951', name:'Rajdhani Express', from:'Delhi', to:'Mumbai', dep:'16:25', arr:'08:15', duration:'15h 50m', baseFare:1850,
      details:{ type:'Rajdhani', classes:['1A','2A','3A'], days:['Daily'], distance:1384, avgSpeed:'87 km/h',
        stops:[
          {no:1, code:'NDLS', name:'New Delhi', arr:'--', dep:'16:25', halt:'--', day:1},
          {no:2, code:'KOTA', name:'Kota Jn', arr:'21:45', dep:'21:50', halt:'5m', day:1},
          {no:3, code:'VAD', name:'Vadodara Jn', arr:'03:20', dep:'03:25', halt:'5m', day:2},
          {no:4, code:'BCT', name:'Mumbai Central', arr:'08:15', dep:'--', halt:'--', day:2}
        ]
      }
    },
    { id:'19019', name:'Dehradun Express', from:'Delhi', to:'Dehradun', dep:'22:10', arr:'05:45', duration:'7h 35m', baseFare:480,
      details:{ type:'Express', classes:['SL','3A','2A'], days:['Daily'], distance:305, avgSpeed:'40 km/h',
        stops:[
          {no:1, code:'DLI', name:'Delhi', arr:'--', dep:'22:10', halt:'--', day:1},
          {no:2, code:'MUT', name:'Meerut City', arr:'23:30', dep:'23:35', halt:'5m', day:1},
          {no:3, code:'HW', name:'Haridwar', arr:'04:30', dep:'04:35', halt:'5m', day:2},
          {no:4, code:'DDN', name:'Dehradun', arr:'05:45', dep:'--', halt:'--', day:2}
        ]
      }
    },
    { id:'12230', name:'Lucknow Mail', from:'Delhi', to:'Lucknow', dep:'22:00', arr:'06:45', duration:'8h 45m', baseFare:520,
      details:{ type:'Superfast', classes:['SL','3A','2A','1A'], days:['Daily'], distance:492, avgSpeed:'56 km/h',
        stops:[
          {no:1, code:'NDLS', name:'New Delhi', arr:'--', dep:'22:00', halt:'--', day:1},
          {no:2, code:'MB', name:'Moradabad', arr:'01:10', dep:'01:15', halt:'5m', day:2},
          {no:3, code:'BE', name:'Bareilly', arr:'02:35', dep:'02:40', halt:'5m', day:2},
          {no:4, code:'LKO', name:'Lucknow NR', arr:'06:45', dep:'--', halt:'--', day:2}
        ]
      }
    }
  ];

  function computeFare(base, cls){
    const multipliers = { SL:1.0, '3A':1.6, '2A':2.2, '1A':3.2 };
    return Math.round(base * (multipliers[cls] || 1));
  }

  function simulateAvailability(){
    return Math.max(0, Math.floor(100 * Math.random()) - 10);
  }

  function renderResults(matches){
    resultsBody.innerHTML = '';
    if(!matches.length){
      resultsBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No trains found.</td></tr>';
      return;
    }
    matches.forEach(t => {
      const availability = simulateAvailability();
      const fare = computeFare(t.baseFare, travelClass.value);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${t.id}</strong><div class="text-muted small">${t.name}</div></td>
        <td>${t.from} → ${t.to}</td>
        <td>${t.dep}</td>
        <td>${t.arr}</td>
        <td>${t.duration}</td>
        <td>${availability > 0 ? `<span class="badge bg-success">${availability} seats</span>` : '<span class="badge bg-danger">WL</span>'}</td>
        <td>₹ ${fare}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-primary" ${availability<=0?'disabled':''}>Book</button>
            <button class="btn btn-outline-secondary">Details</button>
          </div>
        </td>
      `;
      const [bookBtn, detailsBtn] = row.querySelectorAll('button');
      bookBtn.addEventListener('click',()=> openBooking(t, availability, fare));
      detailsBtn.addEventListener('click',()=> openTrainDetails(t));
      resultsBody.appendChild(row);
    });
  }

  function openBooking(train, availability, fare){
    selectedSummary.textContent = `${train.name} (${train.id}) • ${train.from} → ${train.to} • ${journeyDate.value} • ${travelClass.value} • Fare ₹${fare}`;
    passengerForm.dataset.trainId = train.id;
    passengerForm.dataset.fare = String(fare);
    bookingModal.show();
  }

  function openTrainDetails(train){
    if(!trainDetailsModal) trainDetailsModal = new bootstrap.Modal(document.getElementById('trainDetailsModal'));
    const d = train.details;
    tdTitle.textContent = `${train.name} (${train.id}) • ${train.from} → ${train.to}`;
    tdType.textContent = d?.type || '—';
    tdClasses.textContent = (d?.classes || []).join(', ') || '—';
    tdDays.textContent = (d?.days || []).join(', ') || '—';
    tdDistance.textContent = (d?.distance != null ? d.distance + ' km' : '—');
    tdSpeed.textContent = d?.avgSpeed || '—';
    tdDuration.textContent = train.duration;
    tdStops.innerHTML = '';
    (d?.stops || []).forEach(stop =>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${stop.no}</td><td>${stop.code} - ${stop.name}</td><td>${stop.arr}</td><td>${stop.dep}</td><td>${stop.halt}</td><td>${stop.day}</td>`;
      tdStops.appendChild(tr);
    });
    trainDetailsModal.show();
  }

  // Optional: external API stub (requires server proxy/CORS)
  async function fetchIndiaTrainDetails(trainNo){
    // Placeholder for integration with external APIs (e.g., RapidAPI or IRCTC-authorized)
    // return await fetch(`/api/train/${trainNo}`).then(r=>r.json());
    return null;
  }

  function validatePassengerForm(){
    return passengerForm.reportValidity();
  }

  function luhnCheck(num){
    const digits = num.replace(/\s+/g,'');
    if(!/^\d{13,19}$/.test(digits)) return false;
    let sum = 0, alt = false;
    for(let i = digits.length - 1; i >= 0; i--){
      let n = parseInt(digits[i],10);
      if(alt){ n*=2; if(n>9) n-=9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function maskCard(num){
    const digits = num.replace(/\s+/g,'');
    return '**** **** **** ' + digits.slice(-4);
  }

  function generatePNR(){
    const part = () => Math.random().toString(36).slice(2,6).toUpperCase();
    return `${part()}${Date.now().toString(36).slice(-4).toUpperCase()}${part()}`.slice(0,12);
  }

  function loadBookings(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]'); }catch{return []}
  }
  function saveBookings(list){
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
  }

  function handleProceedToPayment(){
    if(!validatePassengerForm()) return;
    bookingModal.hide();
    paymentModal.show();
  }

  function handlePayNow(){
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardName = document.getElementById('cardName').value.trim();
    const cardExpiry = document.getElementById('cardExpiry').value.trim();
    const cardCvv = document.getElementById('cardCvv').value.trim();

    if(!luhnCheck(cardNumber)) return alert('Invalid card number');
    if(!/^\d{2}\/\d{2}$/.test(cardExpiry)) return alert('Invalid expiry format');
    if(!/^\d{3,4}$/.test(cardCvv)) return alert('Invalid CVV');

    payNowBtn.disabled = true; payNowBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    setTimeout(()=>{
      const pnr = generatePNR();
      const booking = {
        pnr,
        trainId: passengerForm.dataset.trainId,
        summary: selectedSummary.textContent,
        fare: Number(passengerForm.dataset.fare),
        passenger: {
          name: document.getElementById('passengerName').value.trim(),
          age: Number(document.getElementById('passengerAge').value),
          gender: document.getElementById('passengerGender').value,
          email: document.getElementById('contactEmail').value.trim(),
          phone: document.getElementById('contactPhone').value.trim()
        },
        payment: { masked: maskCard(cardNumber), time: new Date().toISOString() }
      };
      const all = loadBookings(); all.push(booking); saveBookings(all);
      paymentModal.hide();
      payNowBtn.disabled = false; payNowBtn.textContent = 'Pay Now';
      alert(`Payment successful. Your PNR is ${pnr}`);
      renderPNR(booking);
    }, 1200);
  }

  function renderPNR(booking){
    pnrResult.className = 'alert alert-success';
    pnrResult.innerHTML = `<strong>PNR:</strong> ${booking.pnr}<br>${booking.summary}<br><em>Passenger:</em> ${booking.passenger.name} • Paid via ${booking.payment.masked}`;
    pnrResult.classList.remove('d-none');
    pnrInput.value = booking.pnr;
  }

  function handlePNRLookup(){
    const p = (pnrInput.value || '').trim().toUpperCase();
    if(!p){ pnrResult.className='alert alert-warning'; pnrResult.textContent='Enter a PNR.'; pnrResult.classList.remove('d-none'); return; }
    const match = loadBookings().find(b => b.pnr === p);
    if(match){ renderPNR(match); }
    else { pnrResult.className='alert alert-danger'; pnrResult.textContent='PNR not found.'; pnrResult.classList.remove('d-none'); }
  }

  function attachChat(){
    function addMsg(text, who){
      const div = document.createElement('div');
      div.className = `chat-message ${who}`;
      div.textContent = text;
      chatWindow.appendChild(div);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    function botReply(msg){
      const m = msg.toLowerCase();
      if(m.includes('refund')) return 'You can request a refund from PNR details within 24h.';
      if(m.includes('pnr')) return 'To check PNR, use the PNR section above.';
      if(m.includes('cancel')) return 'Cancellations are permitted up to chart preparation.';
      return 'Our agent will get back to you shortly.';
    }
    chatSendBtn.addEventListener('click', ()=>{
      const msg = chatInput.value.trim();
      if(!msg) return;
      addMsg(msg, 'user');
      chatInput.value='';
      setTimeout(()=> addMsg(botReply(msg), 'bot'), 500);
    });
  }

  function handleSearchSubmit(e){
    e.preventDefault();
    const fromRaw = fromStation.value.trim();
    const toRaw = toStation.value.trim();

    function normalizeInput(value){
      const v = value.toLowerCase();
      // Accept formats: "City", "STN - City", "City (STN)", "STN"
      // Try to map to a known station name
      const byCode = stationsIndex.find(s => s.code.toLowerCase() === v || v === `(${s.code.toLowerCase()})`);
      if(byCode) return byCode.name;
      const codeLike = v.match(/\b([a-z]{2,5})\b/i);
      if(codeLike){
        const c = codeLike[1].toLowerCase();
        const maybe = stationsIndex.find(s => s.code.toLowerCase() === c);
        if(maybe) return maybe.name;
      }
      const byName = stationsIndex.find(s => s.name.toLowerCase() === v || s.name.toLowerCase().startsWith(v));
      return byName ? byName.name : value;
    }

    const from = normalizeInput(fromRaw).toLowerCase();
    const to = normalizeInput(toRaw).toLowerCase();
    const matches = demoTrains.filter(t => t.from.toLowerCase().startsWith(from) && t.to.toLowerCase().startsWith(to));
    renderResults(matches);
  }

  function formatCardInput(){
    const num = document.getElementById('cardNumber');
    num.addEventListener('input', ()=>{
      let v = num.value.replace(/\D/g,'').slice(0,19);
      num.value = v.replace(/(.{4})/g,'$1 ').trim();
    });
    const exp = document.getElementById('cardExpiry');
    exp.addEventListener('input', ()=>{
      let v = exp.value.replace(/\D/g,'').slice(0,4);
      if(v.length>2) v = v.slice(0,2) + '/' + v.slice(2);
      exp.value = v;
    });
  }

  function minutesFromHHMM(hhmm){
    const [h,m] = hhmm.split(':').map(Number);
    return h*60 + m;
  }
  function hhmmFromMinutes(min){
    const h = Math.floor(min/60)%24; const m = min%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function simulateTrainStatus(train){
    const now = new Date();
    const baseDep = minutesFromHHMM(train.dep);
    const baseArr = minutesFromHHMM(train.arr);
    const depToday = new Date(now); depToday.setHours(Math.floor(baseDep/60), baseDep%60, 0, 0);
    const arrToday = new Date(now); arrToday.setHours(Math.floor(baseArr/60), baseArr%60, 0, 0);
    if(arrToday <= depToday && baseArr < baseDep){ arrToday.setDate(arrToday.getDate()+1); }

    const totalMin = Math.round((arrToday - depToday)/60000);
    const elapsedMin = Math.max(0, Math.round((now - depToday)/60000));

    const delayMin = Math.floor(Math.random()*31) - 5; // -5 to +25 mins
    const effectiveElapsed = Math.max(0, elapsedMin + delayMin);
    const progress = Math.min(100, Math.max(0, Math.round((effectiveElapsed/totalMin)*100)));

    const stations = [train.from, 'Kanpur', 'Jhansi', 'Bhopal', 'Vadodara', train.to];
    const idx = Math.min(stations.length-2, Math.floor(progress/ (100/(stations.length-1))));
    const lastStation = stations[idx];

    const eta = new Date(depToday.getTime() + Math.max(0, (effectiveElapsed))*60000);

    return { progress, delayMin, lastStation, eta: eta.toTimeString().slice(0,5) };
  }

  function handleTrainStatus(){
    const num = (trainStatusNumber?.value || '').trim();
    if(!num){ trainStatusResult.className='alert alert-warning'; trainStatusResult.textContent='Enter a train number.'; trainStatusResult.classList.remove('d-none'); return; }
    const train = demoTrains.find(t => t.id === num);
    if(!train){ trainStatusResult.className='alert alert-danger'; trainStatusResult.textContent='Train not found.'; trainStatusResult.classList.remove('d-none'); return; }
    const st = simulateTrainStatus(train);
    trainStatusResult.className = 'alert alert-info';
    trainStatusResult.innerHTML = `<strong>${train.name} (${train.id})</strong><br>${train.from} → ${train.to}<br>Progress: ${st.progress}% • Delay: ${st.delayMin>=0? '+'+st.delayMin: st.delayMin} min<br>Last station: ${st.lastStation} • ETA: ${st.eta}`;
    trainStatusResult.classList.remove('d-none');
  }

  function main(){
    initDate();
    searchForm.addEventListener('submit', handleSearchSubmit);
    proceedToPaymentBtn.addEventListener('click', handleProceedToPayment);
    payNowBtn.addEventListener('click', handlePayNow);
    pnrLookupBtn.addEventListener('click', handlePNRLookup);
    attachChat();
    formatCardInput();
    if(trainStatusBtn) trainStatusBtn.addEventListener('click', handleTrainStatus);

    // Theme management
    const body = document.body;
    function applyTheme(mode){
      body.setAttribute('data-bs-theme', mode === 'dark' ? 'dark' : 'light');
      if(themeToggle){
        const icon = themeToggle.querySelector('i');
        const label = themeToggle.querySelector('span');
        if(mode==='dark'){ icon.className='fa fa-sun me-2'; label.textContent='Light'; themeToggle.classList.remove('btn-outline-dark'); themeToggle.classList.add('btn-outline-light'); }
        else { icon.className='fa fa-moon me-2'; label.textContent='Dark'; themeToggle.classList.remove('btn-outline-light'); themeToggle.classList.add('btn-outline-dark'); }
      }
    }
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    applyTheme(savedTheme);
    if(themeToggle){
      themeToggle.addEventListener('click', ()=>{
        const current = body.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEYS.THEME, next);
        applyTheme(next);
      });
    }

    // Load stations and populate datalist
    (async function loadStations(){
      try{
        const res = await fetch('stations.json', { cache:'force-cache' });
        if(!res.ok) throw new Error('Failed to load stations');
        const list = await res.json();
        stationsIndex = Array.isArray(list) ? list : [];
        if(stationListEl){
          stationListEl.innerHTML = '';
          stationsIndex.forEach(s => {
            const opt = document.createElement('option');
            opt.value = `${s.name} (${s.code})`;
            stationListEl.appendChild(opt);
          });
        }
      }catch(err){
        // Fallback minimal stations if fetch blocked
        stationsIndex = [
          { code:'NDLS', name:'New Delhi' },
          { code:'DLI', name:'Delhi' },
          { code:'BCT', name:'Mumbai Central' },
          { code:'CSTM', name:'Mumbai CSMT' },
          { code:'SBC', name:'Bengaluru City Jn' },
          { code:'MAS', name:'Chennai Central' },
          { code:'HWH', name:'Howrah Jn' },
          { code:'PNP', name:'Panipat' },
          { code:'CDG', name:'Chandigarh' },
          { code:'LKO', name:'Lucknow NR' }
        ];
        if(stationListEl){
          stationListEl.innerHTML = '';
          stationsIndex.forEach(s => {
            const opt = document.createElement('option');
            opt.value = `${s.name} (${s.code})`;
            stationListEl.appendChild(opt);
          });
        }
      }
    })();
  }

  document.addEventListener('DOMContentLoaded', main);
})(); 