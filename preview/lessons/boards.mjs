// Positions are in scene units. Each numbered area is also a presentation clip.
const copy = {
  eclipse: {
    start: 'Predict the sky', question: 'Two towns, one eclipse. Will both go dark?',
    prompt:'Sketch the Sun, Moon and Earth in order.\nWatch the NASA clip and revise one detail.',
    explore:'Move the Moon. Track the shadow.',
    collect:'One model, two observers', result:'Add two observers to your sketch.\nExplain who sees totality and why.',
    home:'Explain it to a friend', task:'Draw a side view of an eclipse.\nLabel the Moon and its shadow.\nAdd a caption correcting the claim\n“It goes dark everywhere.”',
    sketch:['Sun','Moon','Earth'],
  },
  'map-room': {
    start:'Choose a trail', question:'Can we reach the lookout in 25 minutes?',
    prompt:'Mark your predicted route with the pen.\nTell a partner what you used to decide.',
    explore:'Trace each trail. Count grid edges.',
    collect:'Defend your route', result:'Compare the distances in your field sheet.\nAgree on one route and justify it.',
    home:'Design a third route', task:'Draw a route exactly 2.5 km long.\nUse the same 250 m grid scale.\nWrite the moves and swap maps\nwith a partner next lesson.',
    sketch:['edges','metres','minutes'],
  },
  dispatch: {
    start:'Read the scene', question:'A flash at the pier. What can we report?',
    prompt:'Write one observation and one inference.\nWhich one could an editor print as a fact?',
    explore:'Open all three records. Compare sources.',
    collect:'Edit the headline', result:'Underline a fact in your partner’s headline.\nCircle a claim that needs another source.',
    home:'File a news brief', task:'Write a headline and two sentences.\nName the source of each fact.\nEnd with one question the editor\nstill needs to investigate.',
    sketch:['observed','inferred','unknown'],
  },
};

export function makeBoard(l) {
  const c=copy[l.id], elements=[], clips=[];
  function add(type,x,y,width,height,extra={}) {
    const n=elements.length+1;
    const element={id:l.id+'-'+n,type,x,y,width,height,angle:0,strokeColor:'#243532',backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,groupIds:[],frameId:null,roundness:null,seed:n,version:1,versionNonce:n,isDeleted:false,boundElements:[],updated:1,link:null,locked:false,...extra};
    elements.push(element);return element;
  }
  function text(x,y,label,size,color='#263833',width=600) {
    return add('text',x,y,width,size*1.25*label.split('\n').length,{text:label,originalText:label,fontSize:size,fontFamily:2,lineHeight:1.25,textAlign:'left',verticalAlign:'top',autoResize:false,containerId:null,strokeColor:color});
  }
  function area(n,x,y,w,h,title,minutes) {
    clips.push({id:l.id+'-phase-'+n,number:n,x,y,width:w,height:h});
    add('rectangle',x+3,y+3,w-6,h-6,{backgroundColor:'#fffdf6',strokeColor:'#c6ccc2',roundness:{type:3,value:12}});
    add('rectangle',x+17,y+16,6,44,{backgroundColor:l.accent,strokeColor:'transparent'});
    text(x+62,y+15,title,25,l.accent);
    text(x+62,y+50,minutes,13,'#5e6e63');
  }
  function html(x,y,w,h,id,title,props={}) {
    return add('rectangle',x,y,w,h,{strokeColor:'transparent',customData:{materialKind:'interactive-html',interactiveHtmlId:id,interactiveHtmlContentZoom:.8,interactiveHtmlFrameLayout:'content',sourceEntry:'index.html',sourceLessonId:l.id,sourceTitle:title,archiveMaterialPath:'faecher/subject-start/reihen/series-start/stunden/'+l.id+'/material/interaktiv/'+id,...props}});
  }
  text(14,0,l.subject.toUpperCase()+'    /    45 MINUTES',15,l.accent);
  text(14,24,l.title,42);
  area(1,12,100,516,391,'Warm-up','5 MIN   ·   THINK + TALK');
  area(2,545,100,706,391,'Investigation','25 MIN   ·   PARTNER WORK');
  area(3,12,508,706,326,'Consolidation','10 MIN   ·   SHARE + CHECK');
  area(4,736,508,515,326,'Homework','5 MIN   ·   SET UP THE TRANSFER TASK');
  text(38,175,c.question,20);
  const fileId=l.id+'-picture';
  const eclipse=l.id==='eclipse';
  add('image',38,211,eclipse?208:456,162,{fileId,status:'saved',scale:[1,1],crop:null,strokeColor:'transparent'});
  if(eclipse){
    add('rectangle',257,211,244,162,{strokeColor:'transparent',customData:{materialKind:'youtube',videoId:'hyf5JF_VxwM',sourceUrl:'https://www.youtube.com/watch?v=hyf5JF_VxwM',sourceTitle:'What Is a Solar Eclipse? · NASA Space Place',sourceLessonId:l.id,archiveMaterialPath:'faecher/subject-start/reihen/series-start/stunden/eclipse/material/@links/nasa-eclipse'}});
  }
  text(38,398,c.prompt,18);
  text(570,178,c.explore,19);
  const activity=html(570,217,655,250,l.id,l.title);
  text(38,588,c.collect,24);
  text(38,627,c.result,17);
  const hasSheet=l.id==='map-room';
  if(hasSheet){
    html(433,580,258,230,'trail-sheet','Trail field sheet');
  }
  const labels=hasSheet?['6 × 250 m','÷ 1,000','× 15']:c.sketch;
  labels.forEach((label,i)=>{
    const x=39+i*(hasSheet?123:183);
    add(eclipse?'ellipse':'rectangle',x,703,hasSheet?114:154,47,{strokeColor:l.accent,backgroundColor:l.tint,roundness:{type:3,value:9}});
    text(x+(eclipse?33:12),715,label,17,l.accent,146);
  });
  if(!hasSheet){
    for(const x of [196,379]){
      add('arrow',x,726,22,0,{strokeColor:l.accent,strokeWidth:2,points:[[0,0],[22,0]],startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:'arrow',elbowed:false});
    }
  }
  text(39,778,hasSheet?'Record both routes. Circle the one that fits.':'Use the pen to connect the evidence above.',15);
  text(761,589,c.home,26);text(761,640,c.task,20);
  add('rectangle',761,770,441,37,{backgroundColor:l.tint,strokeColor:'transparent'});
  text(773,778,'Bring your answer to the next lesson.',16,l.accent);
  clips.push({kind:'material',id:l.id+'-activity',number:5,elementId:activity.id});
  if(hasSheet)clips.push({kind:'material',id:l.id+'-sheet',number:6,elementId:elements.find(e=>e.customData?.interactiveHtmlId==='trail-sheet').id});
  return {schemaVersion:1,elements,clips,viewport:{scrollX:8,scrollY:16,zoom:{value:.79}}};
}
