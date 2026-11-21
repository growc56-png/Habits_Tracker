const API_BASE="http://127.0.0.1:8000";
let authMode="login";
const $=s=>document.querySelector(s);
async function request(path,payload){
  const res=await fetch(API_BASE+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),credentials:"include"});
  const raw=await res.text();let data=null;try{data=raw?JSON.parse(raw):null;}catch(_){data={detail:raw};}
  if(!res.ok)throw new Error((data&&(data.detail||data.message||data.error))||"Ошибка сервера ("+res.status+")");
  return data;
}
function clearMessages(){$("#authError").textContent="";$("#authError").classList.add("hidden");$("#authSuccess").textContent="";$("#authSuccess").classList.add("hidden");}
function showError(m){$("#authError").textContent=m;$("#authError").classList.remove("hidden");}
function showSuccess(m){$("#authSuccess").textContent=m;$("#authSuccess").classList.remove("hidden");}
function setMode(mode){
  authMode=mode;const reg=mode==="register";
  $("#loginTab").classList.toggle("active",!reg);$("#registerTab").classList.toggle("active",reg);
  $("#loginTab").setAttribute("aria-selected",String(!reg));$("#registerTab").setAttribute("aria-selected",String(reg));
  $("#authKicker").textContent=reg?"СОЗДАЙ СВОЁ ПРОСТРАНСТВО":"РАДЫ ТЕБЯ ВИДЕТЬ";
  $("#authTitle").textContent=reg?"Создай аккаунт":"С возвращением!";
  $("#authSubtitle").textContent=reg?"Придумай имя пользователя и пароль.":"Войди в аккаунт, чтобы продолжить свой путь.";
  $("#password").autocomplete=reg?"new-password":"current-password";
  $("#authSubmit span").textContent=reg?"Зарегистрироваться":"Войти";
  $("#authBottomNote").innerHTML=reg?'Уже есть аккаунт? <button type="button" id="switchToLogin">Войди</button>':'Нет аккаунта? <button type="button" id="switchToRegister">Зарегистрируйся</button>';
  clearMessages();
}
async function submitAuth(e){
  e.preventDefault();clearMessages();
  const username=$("#username").value.trim(),password=$("#password").value;
  if(username.length<3||username.length>20){showError("Имя пользователя должно содержать от 3 до 20 символов.");return;}
  if(password.length<4){showError("Пароль должен содержать не менее 4 символов.");return;}
  const btn=$("#authSubmit");btn.disabled=true;$("#authSubmit span").textContent="Подождите...";
  try{
    if(authMode==="register"){
      await request("/registration",{username,password});
      $("#password").value="";setMode("login");$("#username").value=username;$("#password").focus();
      showSuccess("Аккаунт создан. Теперь войди, используя имя пользователя и пароль.");
    }else{
      await request("/login",{username,password});
      location.href="index.html";
    }
  }catch(err){showError(err.message||"Не удалось выполнить запрос. Проверь, запущен ли Backend.");}
  finally{btn.disabled=false;$("#authSubmit span").textContent=authMode==="register"?"Зарегистрироваться":"Войти";}
}
function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem("theme",theme);$("#authThemeToggle use").setAttribute("href",theme==="dark"?"#i-sun":"#i-moon");}
function init(){
  setTheme(localStorage.getItem("theme")||"dark");
  $("#authThemeToggle").addEventListener("click",()=>setTheme(document.body.dataset.theme==="dark"?"light":"dark"));
  $("#loginTab").addEventListener("click",()=>setMode("login"));$("#registerTab").addEventListener("click",()=>setMode("register"));
  $("#authBottomNote").addEventListener("click",e=>{if(e.target.id==="switchToRegister")setMode("register");if(e.target.id==="switchToLogin")setMode("login");});
  $("#authForm").addEventListener("submit",submitAuth);
  $("#passwordToggle").addEventListener("click",()=>{const input=$("#password");input.type=input.type==="password"?"text":"password";});
  setMode("login");
}
document.addEventListener("DOMContentLoaded",init);
