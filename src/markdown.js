// Deliberately small Markdown subset. Build DOM nodes instead of inserting HTML.
export function linkTarget(url) {
  if (/^(https?:|mailto:)/i.test(url) || /^(#|\.\.?\/|\/(?!\/))/.test(url)) return url;
  return null;
}
function inline(text, parent) {
  const tokens = /`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|~~([^~]+)~~|\[((?:\\.|[^\\\]])+)\]\(([^\s)]+)\)/g;
  let last=0, match;
  while ((match=tokens.exec(text))) {
    parent.append(document.createTextNode(text.slice(last,match.index)));
    let element;
    if (match[1]) { element=document.createElement('code'); element.textContent=match[1]; }
    else if (match[2] || match[3]) { element=document.createElement('strong'); inline(match[2] || match[3],element); }
    else if (match[4] || match[5]) { element=document.createElement('em'); inline(match[4] || match[5],element); }
    else if (match[6]) { element=document.createElement('del'); inline(match[6],element); }
    else {
      const target=linkTarget(match[8]);
      element=document.createElement(target ? 'a' : 'span'); inline(match[7].replace(/\\([\\\]])/g,'$1'),element);
      if (target) { element.href=target; element.target='_blank'; element.rel='noopener noreferrer'; }
    }
    parent.append(element); last=tokens.lastIndex;
  }
  parent.append(document.createTextNode(text.slice(last)));
}

export function renderMarkdown(source) {
  const fragment=document.createDocumentFragment(), lines=source.replace(/\r\n?/g,'\n').split('\n');
  let paragraph, list, listType;
  const reset=()=>{paragraph=null;list=null;listType=null;};
  for (let i=0;i<lines.length;i++) {
    const line=lines[i];
    if (!line.trim()) { reset(); continue; }
    if (/^\s*```/.test(line)) {
      reset(); const code=[];
      while (++i<lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i]);
      const pre=document.createElement('pre'), el=document.createElement('code'); el.textContent=code.join('\n');pre.append(el);fragment.append(pre);continue;
    }
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { reset();const el=document.createElement(`h${heading[1].length}`);inline(heading[2],el);fragment.append(el);continue; }
    const item=line.match(/^\s*(?:([-+*])|((\d+)\.))\s+(.+)$/);
    if (item) {
      paragraph=null; const type=item[1] ? 'ul' : 'ol';
      if (!list || listType!==type) { list=document.createElement(type);listType=type;if(type==='ol')list.start=Number(item[3]);fragment.append(list); }
      const li=document.createElement('li'); inline(item[4],li);list.append(li);continue;
    }
    list=null;listType=null;
    const quote=line.match(/^>\s?(.*)$/);
    if (quote) { paragraph=null;const el=document.createElement('blockquote');inline(quote[1],el);fragment.append(el);continue; }
    if (!paragraph) { paragraph=document.createElement('p');fragment.append(paragraph); } else paragraph.append(document.createElement('br'));
    inline(line,paragraph);
  }
  return fragment;
}
