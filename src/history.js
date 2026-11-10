export function createHistory({limit=60,maxBytes=128*1024*1024,clock=()=>Date.now()}={}) {
  let entries=[],index=-1;
  function trim(){while(entries.length>1 && (entries.length>limit || entries.reduce((n,e)=>n+e.data.length*2,0)>maxBytes)){entries.shift();index--;}}
  return {
    record(data,key='command',mergeMs=600){
      if(entries[index]?.data===data)return false;
      const redo=index<entries.length-1,now=clock();entries=entries.slice(0,index+1);
      if(!redo && index>0 && entries[index].key===key && now-entries[index].time<=mergeMs)entries[index]={data,key,time:now};
      else {entries.push({data,key,time:now});index++;}
      trim();return true;
    },
    replace(data){if(index>=0)entries[index].data=data;trim();},
    undo(){if(index<=0)return undefined;return entries[--index].data;},
    redo(){if(index>=entries.length-1)return undefined;return entries[++index].data;},
    get canUndo(){return index>0;},get canRedo(){return index<entries.length-1;},
  };
}
