export function mountFullscreen(button,message) {
  const update=()=>{
    const active=!!document.fullscreenElement;document.body.classList.toggle('fullscreen',active);
    button.textContent=active?'⤡':'⤢';button.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');button.title=active?'Exit fullscreen (Esc)':'Enter fullscreen';button.setAttribute('aria-pressed',String(active));
  };
  document.addEventListener('fullscreenchange',update);
  button.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message('Fullscreen is unavailable in this browser window.');}};
  update();
}
