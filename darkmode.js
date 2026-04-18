// RuviaOS – Dark Mode v2
(function(){
  function apply(on){
    document.body.classList.toggle('dark-mode',on);
    localStorage.setItem('ruvia-dark',on?'1':'0');
    document.querySelectorAll('.darkmode-nav-btn,#darkModeToggleBtn').forEach(b=>{
      if(b) b.innerHTML=on?'☀️ Light':'🌙 Dark';
    });
  }
  // Apply before paint
  var saved=localStorage.getItem('ruvia-dark');
  var prefersDark=window.matchMedia('(prefers-color-scheme:dark)').matches;
  if(saved===null?prefersDark:saved==='1') document.documentElement.classList.add('pre-dark');
  window.addEventListener('DOMContentLoaded',function(){
    var on=localStorage.getItem('ruvia-dark')==='1'||(localStorage.getItem('ruvia-dark')===null&&window.matchMedia('(prefers-color-scheme:dark)').matches);
    apply(on);
    document.documentElement.classList.remove('pre-dark');
    new MutationObserver(function(){
      document.querySelectorAll('.darkmode-nav-btn,#darkModeToggleBtn').forEach(b=>{
        if(!b._dmBound){b._dmBound=true;b.addEventListener('click',function(){apply(!document.body.classList.contains('dark-mode'));});}
      });
    }).observe(document.body,{childList:true,subtree:true});
  });
  window.toggleDarkMode=function(){apply(!document.body.classList.contains('dark-mode'));};
})();
