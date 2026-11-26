const API_BASE = "http://127.0.0.1:8000";
const THEME_KEY = "theme";
const $ = (selector) => document.querySelector(selector);
const state = {
  username: "", habits: [], filter: "all", search: "", selectedIcon: "🌱", editingId: null, timeEntries: [],
  timer: { work: 50, rest: 10, cycles: 4, completed: 0, phase: "work", remaining: 3000, endAt: null, running: false, interval: null, audioContext: null },
  toastTimer: null
};
async function api(path, options={}) {
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const response=await fetch(API_BASE+path,{...options,headers,credentials:"include"});
  const raw=await response.text();let data=null;
  try{data=raw?JSON.parse(raw):null;}catch(_){data={detail:raw};}
  if(response.status===401){location.replace("auth.html");throw new Error("Сессия закончилась. Войди снова.");}
  if(!response.ok)throw new Error(data?.detail||data?.message||("Ошибка API: "+response.status));
  return data;
}
function normalizeHabit(h){
  return {id:h.id,habitname:h.name??h.habitname??h.habit??"Без названия",description:h.description||"",category:h.category||"Другое",icon:h.icon||"🌱",doneDate:h.completed_today?todayKey():(h.completed_date||h.done_date||null),done:!!h.completed_today};
}
function normalizeEntry(e){return {id:e.id,name:e.task_name??e.name??"Без названия",work:Number(e.minutes??e.work_minutes??0),updatedAt:e.created_at?Date.parse(e.created_at):Date.now()};}
function todayKey() { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-"); }
function escapeHtml(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }
function showToast(message, error) {
  const el = $("#toast"); el.textContent = message; el.classList.toggle("error", !!error); el.classList.add("show");
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function setTheme(theme) {
  document.body.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme);
  $("#themeToggle use").setAttribute("href", theme === "dark" ? "#i-sun" : "#i-moon");
}
function initUser() {
  // В текущем backend пока нет GET /me, поэтому не блокируем загрузку привычек.
  state.username = "Мой аккаунт";
  $("#userName").textContent = state.username;
  $("#welcomeName").textContent = "друг";
  $("#userAvatar").textContent = "Я";
}
function fmtMinutes(value) {
  const n = Math.max(0, Math.round(Number(value)||0)), h = Math.floor(n/60), m = n%60;
  if (!h) return n + " минут";
  const unit = h%10===1 && h%100!==11 ? "час" : (h%10>=2 && h%10<=4 && (h%100<12 || h%100>14) ? "часа" : "часов");
  return n + " минут (" + h + " " + unit + (m ? " " + m + " мин" : "") + ")";
}
function shortMinutes(value) { const n=Math.max(0,Math.round(Number(value)||0)),h=Math.floor(n/60),m=n%60; return h ? h+" ч"+(m?" "+m+" мин":"") : n+" мин"; }
function initDates() {
  const d=new Date();
  $("#todayLabel").textContent=new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(d).toUpperCase();
  $("#currentDate").textContent=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(d);
}
async function loadData(){
  // Привычки загружаются отдельно: ошибка тайм-трекера не должна ломать главный экран.
  try {
    const habitsData = await api("/habits");
    const items = Array.isArray(habitsData) ? habitsData : (habitsData?.items || []);
    state.habits = items.map(normalizeHabit);
    renderHabits();
  } catch (error) {
    showToast("Не удалось загрузить привычки: " + error.message, true);
    return;
  }

  // Ручки времени в backend могут быть ещё не готовы — это не мешает привычкам.
  try {
    const entriesData = await api("/time-entries");
    const items = Array.isArray(entriesData) ? entriesData : (entriesData?.items || []);
    state.timeEntries = items.map(normalizeEntry);
  } catch (error) {
    state.timeEntries = [];
    if (!String(error.message).includes("404")) {
      showToast("Привычки загружены. Учёт времени пока недоступен: " + error.message, true);
    }
  }
  renderTime();
}
function isDone(h){return h.doneDate===todayKey();}
function visibleHabits(){
  const q=state.search.trim().toLocaleLowerCase("ru");
  return state.habits.filter(h=>{
    const done=isDone(h), ok=state.filter==="all"||(state.filter==="active"&&!done)||(state.filter==="done"&&done);
    return ok && (!q || (h.habitname+" "+h.description+" "+h.category).toLocaleLowerCase("ru").includes(q));
  });
}
function renderHabit(h){
  const done=isDone(h);
  return '<article class="habit-row '+(done?"completed":"")+'" data-habit-id="'+escapeHtml(h.id)+'">'+
    '<div class="habit-emoji">'+escapeHtml(h.icon)+'</div><div class="habit-copy"><div class="habit-title-line"><span class="habit-name">'+escapeHtml(h.habitname)+'</span><span class="habit-category">'+escapeHtml(h.category)+'</span></div>'+
    (h.description?'<div class="habit-description">'+escapeHtml(h.description)+'</div>':"")+'</div><div class="habit-actions">'+
    '<button class="habit-action toggle '+(done?"is-done":"")+'" type="button" disabled title="Сначала добавь backend-ручку отметки выполнения"><svg class="icon"><use href="'+(done?"#i-refresh":"#i-check")+'"></use></svg><span>'+(done?"Готово":"Отметить")+'</span></button>'+
    '<button class="habit-action" type="button" disabled aria-label="Изменить" title="Backend-ручка редактирования пока не подключена"><svg class="icon"><use href="#i-edit"></use></svg></button>'+
    '<button class="habit-action delete" type="button" disabled aria-label="Удалить" title="Backend-ручка удаления пока не подключена"><svg class="icon"><use href="#i-trash"></use></svg></button></div></article>';
}
function renderCategories(){
  const counts={};state.habits.forEach(h=>counts[h.category]=(counts[h.category]||0)+1);
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);$("#categoryTotal").textContent=entries.length;
  if(!entries.length){$("#categoryList").innerHTML='<div class="category-placeholder">Категории появятся после добавления привычек.</div>';return;}
  const max=Math.max(...entries.map(e=>e[1]));
  $("#categoryList").innerHTML=entries.map(e=>'<div class="category-item"><div class="category-item-label"><span class="category-dot"></span>'+escapeHtml(e[0])+'</div><span class="category-item-count">'+e[1]+'</span><div class="category-bar"><span style="width:'+Math.round(e[1]/max*100)+'%"></span></div></div>').join("");
}
function renderHabits(){
  const total=state.habits.length,done=state.habits.filter(isDone).length,active=total-done,pct=total?Math.round(done/total*100):0;
  $("#totalHabits").textContent=total;$("#doneToday").textContent=done;$("#remaining").textContent=active;
  $("#progressValue").innerHTML=pct+'<span class="percent">%</span>';$("#progressBar").style.width=pct+"%";
  $("#navHabitCount").textContent=total;$("#allCount").textContent=total;$("#activeCount").textContent=active;$("#doneCount").textContent=done;
  document.querySelectorAll("[data-filter]").forEach(b=>{const selected=b.dataset.filter===state.filter;b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected));});
  const list=visibleHabits();$("#habitsList").innerHTML=list.map(renderHabit).join("");
  const empty=state.habits.length===0;$("#emptyState").classList.toggle("hidden",list.length>0);
  $("#emptyTitle").textContent=empty?"Здесь пока пусто":"Ничего не найдено";
  $("#emptyDescription").textContent=empty?"Добавь первую привычку — и начни создавать свою систему.":"Попробуй изменить поиск или фильтр.";
  $("#emptyCreateButton").classList.toggle("hidden",!empty);renderCategories();
}
function pickIcon(icon){state.selectedIcon=icon;document.querySelectorAll(".icon-choice").forEach(b=>b.classList.toggle("active",b.dataset.icon===icon));}
function openHabitModal(h){
  state.editingId=h?h.id:null;$("#habitForm").reset();
  $("#modalTitle").textContent=h?"Изменить привычку":"Новая привычка";
  $("#habitName").value=h?h.habitname:"";$("#habitDescription").value=h?h.description:"";
  $("#habitCategory").value=h?h.category:"Здоровье";pickIcon(h?h.icon:"🌱");
  $("#habitFormError").textContent="";$("#habitModal").classList.remove("hidden");document.body.classList.add("modal-open");
  setTimeout(()=>$("#habitName").focus(),30);
}
function closeHabitModal(){ $("#habitModal").classList.add("hidden");document.body.classList.remove("modal-open");state.editingId=null; }
async function saveHabit(event){
  event.preventDefault();const name=$("#habitName").value.trim();
  if(!name){$("#habitFormError").textContent="Введи название привычки.";return;}
  const data={name,description:$("#habitDescription").value.trim(),category:$("#habitCategory").value,icon:state.selectedIcon};
  const isEditing=state.editingId!==null;
  try{
    if(isEditing)await api("/habits/"+encodeURIComponent(state.editingId),{method:"PATCH",body:JSON.stringify(data)});
    else await api("/habits",{method:"POST",body:JSON.stringify(data)});
    await loadData();closeHabitModal();showToast(isEditing?"Привычка обновлена.":"Привычка добавлена.");
  }catch(error){$("#habitFormError").textContent=error.message;}
}
async function toggleHabit(id){
  try{await api("/habits/"+encodeURIComponent(id)+"/toggle",{method:"POST"});await loadData();}
  catch(error){showToast(error.message,true);}
}
async function deleteHabit(id){
  const h=state.habits.find(x=>String(x.id)===String(id));if(!h||!confirm('Удалить привычку «'+h.habitname+'»?'))return;
  try{await api("/habits/"+encodeURIComponent(id),{method:"DELETE"});await loadData();showToast("Привычка удалена.");}
  catch(error){showToast(error.message,true);}
}
async function addTime(name,work,silent){
  name=String(name||"").trim()||"Без названия";work=Math.max(0,Math.round(Number(work)||0));if(work<=0)return false;
  try{
    await api("/time-entries",{method:"POST",body:JSON.stringify({task_name:name,minutes:work,source:"pomodoro"})});
    const entriesData=await api("/time-entries");state.timeEntries=(Array.isArray(entriesData)?entriesData:(entriesData.items||[])).map(normalizeEntry);
    renderTime();if(!silent)showToast("Рабочее время добавлено к задаче «"+name+"».");return true;
  }catch(error){showToast("Не удалось сохранить время: "+error.message,true);return false;}
}
function renderTime(){
  const grouped={};state.timeEntries.forEach(e=>{const key=e.name.toLocaleLowerCase("ru");if(!grouped[key])grouped[key]={name:e.name,work:0};grouped[key].work+=e.work;});
  const rows=Object.values(grouped),work=rows.reduce((n,e)=>n+e.work,0);
  $("#trackedTotal").textContent=fmtMinutes(work);$("#recordsCount").textContent=rows.length+(rows.length===1?" задача":" задач");
  if(!rows.length){$("#timeRecords").innerHTML='<div class="records-empty">Здесь появится время по твоим задачам.</div>';return;}
  $("#timeRecords").innerHTML=rows.sort((a,b)=>b.work-a.work).map(e=>'<article class="time-record"><div class="record-main"><strong>'+escapeHtml(e.name)+'</strong><span>'+fmtMinutes(e.work)+'</span></div><div class="record-breakdown"><span>Работа: '+shortMinutes(e.work)+'</span></div></article>').join("");
}
function persistTimer(){localStorage.setItem(storageKey("pomo"),JSON.stringify({work:state.timer.work,rest:state.timer.rest,cycles:state.timer.cycles}));}
function updateTimer(){
  const m=Math.floor(state.timer.remaining/60),s=state.timer.remaining%60;
  $("#timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  $("#timerPhase").textContent=state.timer.phase==="rest"?"ОТДЫХ":state.timer.phase==="transition"?"ПЕРЕХОД":state.timer.phase==="done"?"ГОТОВО":"РАБОТА";
  $("#timerRound").textContent=state.timer.phase==="done"?"Все подходы завершены":state.timer.phase==="transition"?"Отдых начнётся через 5 секунд":state.timer.phase==="rest"?"Отдых после подхода "+state.timer.completed+" из "+state.timer.cycles:"Подход "+Math.min(state.timer.completed+1,state.timer.cycles)+" из "+state.timer.cycles;
  $("#timerRing").classList.toggle("is-rest",state.timer.phase==="rest"||state.timer.phase==="transition");$("#timerRing").classList.toggle("is-done",state.timer.phase==="done");
  $("#timerStart").disabled=state.timer.running||state.timer.phase==="done";$("#timerPause").disabled=!state.timer.running;
}
function stopTimerClock(){
  state.timer.running=false;clearInterval(state.timer.interval);state.timer.interval=null;state.timer.endAt=null;
}
function runTimerClock(){
  state.timer.running=true;state.timer.endAt=Date.now()+state.timer.remaining*1000;state.timer.interval=setInterval(tickTimer,250);
}
function prepareTimerAudio(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)return;
  try{
    if(!state.timer.audioContext)state.timer.audioContext=new AudioContextClass();
    if(state.timer.audioContext.state==="suspended")state.timer.audioContext.resume().catch(()=>{});
  }catch(_){}
}
function playTimerSignal(){
  const audio=state.timer.audioContext;if(!audio)return;
  try{
    if(audio.state==="suspended")audio.resume().catch(()=>{});
    const now=audio.currentTime,oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.type="sine";oscillator.frequency.setValueAtTime(880,now);oscillator.frequency.setValueAtTime(660,now+0.23);
    gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(0.16,now+0.025);
    gain.gain.setValueAtTime(0.16,now+0.14);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.18);
    gain.gain.setValueAtTime(0.0001,now+0.23);gain.gain.exponentialRampToValueAtTime(0.16,now+0.255);
    gain.gain.setValueAtTime(0.16,now+0.38);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.43);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(now+0.46);
  }catch(_){}
}
function resetTimer(notify){
  stopTimerClock();state.timer.completed=0;state.timer.phase="work";state.timer.remaining=state.timer.work*60;
  $("#timerStatus").textContent="Готов к началу";updateTimer();if(notify)showToast("Таймер сброшен.");
}
function setPreset(value){
  if(value==="custom"){
    $("#customTimeRow").classList.remove("hidden");
    state.timer.work=Math.max(1,Math.min(240,Number($("#pomoWorkMinutes").value)||50));
    state.timer.rest=Math.max(1,Math.min(120,Number($("#pomoRestMinutes").value)||10));
  }else{
    const vals=value.split("-").map(Number);state.timer.work=vals[0];state.timer.rest=vals[1];
    $("#pomoWorkMinutes").value=vals[0];$("#pomoRestMinutes").value=vals[1];$("#customTimeRow").classList.add("hidden");
  }
  document.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active",b.dataset.preset===value));
  resetTimer(false);
}
function phaseFinished(){
  stopTimerClock();
  const task=$("#pomoTaskName").value.trim()||"Фокус";
  if(state.timer.phase==="work"){
    addTime(task,state.timer.work,true);state.timer.completed++;playTimerSignal();
    state.timer.phase="transition";state.timer.remaining=5;
    $("#timerStatus").textContent="Работа завершена. Отдых начнётся через 5 секунд.";
    showToast("Рабочий интервал завершён.");
    runTimerClock();
  }else if(state.timer.phase==="transition"){
    state.timer.phase="rest";state.timer.remaining=state.timer.rest*60;
    $("#timerStatus").textContent="Идёт отдых.";
    showToast("Начался отдых.");
    runTimerClock();
  }else if(state.timer.phase==="rest"){
    if(state.timer.completed>=state.timer.cycles){
      state.timer.phase="done";state.timer.remaining=0;
      $("#timerStatus").textContent="Отлично! Все подходы завершены.";
      showToast("Все подходы завершены. Рабочее время сохранено.");
    }else{
      state.timer.phase="work";state.timer.remaining=state.timer.work*60;
      $("#timerStatus").textContent="Отдых закончен. Нажми «Старт» для следующего подхода.";
      showToast("Отдых завершён. Готов к следующему подходу?");
    }
  }
  updateTimer();
}
function tickTimer(){
  if(!state.timer.running||!state.timer.endAt)return;
  state.timer.remaining=Math.max(0,Math.ceil((state.timer.endAt-Date.now())/1000));
  if(state.timer.remaining===0)phaseFinished();else updateTimer();
}
function startTimer(){
  if(state.timer.running)return;
  state.timer.cycles=Math.max(1,Math.min(20,Number($("#pomoCycles").value)||4));
  state.timer.work=Math.max(1,Math.min(240,Number($("#pomoWorkMinutes").value)||state.timer.work));
  state.timer.rest=Math.max(1,Math.min(120,Number($("#pomoRestMinutes").value)||state.timer.rest));
  if(state.timer.phase==="done")resetTimer(false);
  persistTimer();prepareTimerAudio();runTimerClock();
  const phaseName=state.timer.phase==="rest"?"отдых":state.timer.phase==="transition"?"переход к отдыху":"работа";
  $("#timerStatus").textContent="Идёт "+phaseName+".";updateTimer();
}
function pauseTimer(){
  if(!state.timer.running)return;tickTimer();if(!state.timer.running)return;
  state.timer.running=false;state.timer.endAt=null;clearInterval(state.timer.interval);state.timer.interval=null;
  $("#timerStatus").textContent="Таймер на паузе";updateTimer();
}
function loadTimerSettings(){
  try{
    const data=JSON.parse(localStorage.getItem(storageKey("pomo"))||"null");
    if(data){
      state.timer.work=Math.max(1,Math.min(240,Number(data.work)||50));state.timer.rest=Math.max(1,Math.min(120,Number(data.rest)||10));
      state.timer.cycles=Math.max(1,Math.min(20,Number(data.cycles)||4));
    }
  }catch(_){}
  $("#pomoWorkMinutes").value=state.timer.work;$("#pomoRestMinutes").value=state.timer.rest;$("#pomoCycles").value=state.timer.cycles;
  if(state.timer.work===45&&state.timer.rest===15)setPreset("45-15");
  else if(state.timer.work===50&&state.timer.rest===10)setPreset("50-10");
  else{state.timer.remaining=state.timer.work*60;$("#customTimeRow").classList.remove("hidden");document.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active",b.dataset.preset==="custom"));}
  updateTimer();
}
function initEvents(){
  $("#themeToggle").addEventListener("click",()=>setTheme(document.body.dataset.theme==="dark"?"light":"dark"));
  $("#openCreateButton").addEventListener("click",()=>openHabitModal(null));$("#emptyCreateButton").addEventListener("click",()=>openHabitModal(null));
  $("#closeModalButton").addEventListener("click",closeHabitModal);$("#cancelModalButton").addEventListener("click",closeHabitModal);
  $("#habitModal").addEventListener("click",e=>{if(e.target===$("#habitModal"))closeHabitModal();});$("#habitForm").addEventListener("submit",saveHabit);
  $("#habitSearch").addEventListener("input",e=>{state.search=e.target.value;renderHabits();});
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;renderHabits();}));
  $("#iconPicker").addEventListener("click",e=>{const b=e.target.closest("[data-icon]");if(b)pickIcon(b.dataset.icon);});
  $("#habitsList").addEventListener("click",e=>{
    const b=e.target.closest("[data-action]");if(!b)return;const row=b.closest("[data-habit-id]");if(!row)return;const id=row.dataset.habitId;
    if(b.dataset.action==="toggle")toggleHabit(id);if(b.dataset.action==="delete")deleteHabit(id);
    if(b.dataset.action==="edit"){const h=state.habits.find(x=>String(x.id)===String(id));if(h)openHabitModal(h);}
  });
  $("#timeEntryForm").addEventListener("submit",async e=>{
    e.preventDefault();const name=$("#timeTaskName").value.trim(),work=Number($("#workMinutes").value);
    if(!name||!Number.isFinite(work)||work<1||work>1440){showToast("Укажи задачу и рабочее время от 1 до 1440 минут.",true);return;}
    if(await addTime(name,work,false)){ $("#timeEntryForm").reset();$("#workMinutes").value=0; }
  });
  document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>setPreset(b.dataset.preset)));
  $("#pomoWorkMinutes").addEventListener("change",()=>{if(!$("#customTimeRow").classList.contains("hidden"))setPreset("custom");});
  $("#pomoRestMinutes").addEventListener("change",()=>{if(!$("#customTimeRow").classList.contains("hidden"))setPreset("custom");});
  $("#pomoCycles").addEventListener("change",()=>{state.timer.cycles=Math.max(1,Math.min(20,Number($("#pomoCycles").value)||4));$("#pomoCycles").value=state.timer.cycles;persistTimer();updateTimer();});
  $("#timerStart").addEventListener("click",startTimer);$("#timerPause").addEventListener("click",pauseTimer);$("#timerReset").addEventListener("click",()=>resetTimer(true));
  $("#logoutButton").addEventListener("click",()=>{pauseTimer();location.href="auth.html";});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#habitModal").classList.contains("hidden"))closeHabitModal();});
  document.querySelectorAll(".nav-link[href^='#']").forEach(link=>link.addEventListener("click",()=>{document.querySelectorAll(".nav-link[href^='#']").forEach(item=>item.classList.remove("active"));link.classList.add("active");}));
}
async function init(){
  setTheme(localStorage.getItem(THEME_KEY)||"dark");
  initDates();
  initEvents();
  loadTimerSettings();
  initUser();
  await loadData();
}
document.addEventListener("DOMContentLoaded",init);
