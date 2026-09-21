let installPrompt;
const installButton=document.getElementById('install-app');
const status=document.getElementById('install-status');
if((matchMedia('(display-mode: standalone)').matches||navigator.standalone)&&location.pathname==='/')location.replace('/web');
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{if(status)status.textContent='Installation is unavailable right now. You can still continue in your browser.';});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(installButton)installButton.textContent='Install My Wallet';});
installButton?.addEventListener('click',async()=>{if(!installPrompt){status.textContent='Follow the instructions below for your phone. Installation options depend on your browser.';document.getElementById('install-help').scrollIntoView({behavior:'smooth',block:'nearest'});return;}installButton.disabled=true;try{await installPrompt.prompt();const choice=await installPrompt.userChoice;status.textContent=choice.outcome==='accepted'?'Installation requested. Look for My Wallet on your home screen.':'You can install later or continue in your browser.';}catch{status.textContent='Use your browser menu to install, or continue in your browser.';}finally{installPrompt=null;installButton.disabled=false;}});
window.addEventListener('appinstalled',()=>{if(status)status.textContent='My Wallet is installed. Open it from your home screen.';if(installButton)installButton.hidden=true;installPrompt=null;});
