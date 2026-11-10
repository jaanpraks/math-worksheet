export function fitImage(width,height,maxWidth=width,maxHeight=height) {
  const scale=Math.min(maxWidth/width,maxHeight/height,20000/width,20000/height);
  return {width:width*scale,height:height*scale};
}
export function resizeImage(width,height,dx,dy) {
  // Project pointer motion onto the image's diagonal, preserving its ratio.
  const scale=1+(dx*width+dy*height)/(width*width+height*height);
  const bounded=Math.max(1/Math.max(width,height),Math.min(20000/Math.max(width,height),scale));
  return {width:width*bounded,height:height*bounded};
}
export function imageDimensions(src) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>image.naturalWidth && image.naturalHeight?resolve({width:image.naturalWidth,height:image.naturalHeight}):reject(Error('Image has no dimensions.'));
    image.onerror=()=>reject(Error('Cannot read this image.'));image.src=src;
  });
}
export async function fitSavedImages(regions) {
  await Promise.all(regions.filter(r=>r.type==='image').map(async r=>{
    const size=await imageDimensions(r.src);Object.assign(r,fitImage(size.width,size.height,r.width,r.height));
  }));
  return regions;
}
