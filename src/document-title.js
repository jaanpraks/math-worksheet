export function worksheetTitle(value=''){
  if(typeof value!=='string' || value.length>160 || /[\r\n\0]/.test(value))throw Error('Invalid worksheet title.');return value;
}
export function worksheetFilename(title){
  let name=title.trim().replace(/\.json$/i,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/,'').slice(0,120);
  if(!name)name='orbit-worksheet';if(/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))name=`worksheet-${name}`;return `${name}.json`;
}
