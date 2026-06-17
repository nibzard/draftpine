export const runtimeJs = `
function getInitialDraftpineTheme(){
  var t=localStorage.getItem('draftpine-theme');
  if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  return t;
}
function setDraftpineTheme(t){
  document.documentElement.dataset.theme=t;
  localStorage.setItem('draftpine-theme',t);
}
function createDraftpineShell(options){
  var depth=(options&&options.depth)||0;
  var prefix=depth<=0?'./':'../'.repeat(depth);
  var nav=window.SITE_NAV||[];
  var footer=window.SITE_FOOTER||nav;
  return {
    theme:getInitialDraftpineTheme(),
    siteNav:nav,
    siteFooter:footer,
    routeHref:function(path){
      if(/^https?:/.test(path))return path;
      if(path==='/')return prefix;
      return prefix+path.replace(/^\\//,'');
    },
    init:function(){
      this.theme=getInitialDraftpineTheme();
      document.documentElement.dataset.theme=this.theme;
    },
    toggleTheme:function(){
      this.theme=this.theme==='dark'?'light':'dark';
      setDraftpineTheme(this.theme);
    }
  };
}
function draftpineTabs(initial){
  return { active: initial || 0, setActive: function(index){ this.active=index; } };
}
function draftpineFilter(){
  return { query:'', matches:function(text){ return String(text).toLowerCase().indexOf(this.query.toLowerCase())!==-1; } };
}
function draftpineModal(){
  return { open:false, show:function(){ this.open=true; }, close:function(){ this.open=false; } };
}
`;

export function siteDataJs(nav: { label: string; path: string }[]): string {
  const footer = nav;
  return `window.SITE_NAV=${JSON.stringify(nav)};\nwindow.SITE_FOOTER=${JSON.stringify(footer)};\n`;
}
