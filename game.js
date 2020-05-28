class LinkNode {
  constructor(data, next = null) {
    this.data = data;
    this.next = next;
  }
}
class LinkList {
  constructor(){ this.head = null }

  clear=()=>{
    this.head = null;
  }
  dropHead=()=>{
    let value = this.head===null ? null : this.head.data;
    if (value) this.head = this.head.next;
    return value;
  }
  prepend=(data)=>{
    this.head = new LinkNode(data, this.head);
  }
  append=(data)=>{
    let cursor;
    if (this.head == null) {
      this.prepend(data);
    } else {
      cursor = this.head;
      while (cursor.next !== null) cursor = cursor.next;
      cursor.next = new LinkNode(data, null, cursor);
    }
  }
  locate=(data)=>{
    let cursor = this.head;
    while (cursor) {
      if (cursor.data === data) break;
      else cursor = cursor.next;

    }
    return cursor;
  }
  search=(data)=>{
    let node = this.locate(data);
    let value = node ? node.data : null;
    return value;
  }
  remove=(data)=>{
    let cursor = this.head, prev = null;
    if (cursor) {
      if (cursor.data === data) return this.dropHead();
      else prev = cursor, cursor = cursor.next;
      while (cursor) {
        if (cursor.data === data) return (prev.next = cursor.next, cursor.data);
        prev = cursor;
        cursor = cursor.next;
      }
    } else {
      console.log('cursor was null:\n' + data);
    }
  }
  map=(f=_=>_, r=new LinkList(), l=this.head)=>{
    return (l) ? (r.append(f(l.data)), this.map(f, r, l.next)) : r;
  }
}
class V2d {
  constructor(x=0, y=0) { this.x = x, this.y = y }

  sum=v=>(
    v = isNaN(v) ? v : new V2d(v, v),
    new V2d(this.x + v.x, this.y + v.y)
  );
  product=v=>(
    v = isNaN(v) ? v : new V2d(v, v),
    new V2d(this.x * v.x, this.y * v.y)
  );
  dist=v=>(
    v = isNaN(v) ? v : new V2d(v, v),
    Math.sqrt((this.x - v.x)**2 + (this.y - v.y)**2)
  );
}
class InputBuffer {
  constructor(msDelay = 1000) {
    this.delay = msDelay;
    this.log = new LinkList();
  }

  clear=()=> this.log.clear()
  push=data=>this.log.append(data)
  pop=()=>this.log.dropHead()
  values=v=>this.log.map(x => x[v])
  releaseExpired=(msNow, log=this.log, r=new LinkList())=>{
    if (log.head) {
      if (msNow - log.head.data.timeStamp > this.delay) {
        r.append(log.dropHead());
        this.releaseExpired(msNow, log, r);
      }
    }
    return r;
  }
}
class Game {
  constructor(window, document = window.document) {
    this.gutter = 4;
    this.buffer = new InputBuffer(500); /* keep a master list? */
    this.cxt = (canvas=>(
      canvas.setAttribute('tabindex', 1),
      canvas.width = window.innerWidth-this.gutter,
      canvas.height = window.innerHeight-this.gutter,
      canvas.addEventListener('keydown', this.keyInput, false),
      canvas.addEventListener('mousedown', this.mouseInput, false),
      canvas.addEventListener('contextmenu', e=>(e.preventDefault(), e), false),
      document.querySelector`body`.appendChild(canvas),
      canvas.getContext`2d`
      ))(document.createElement`canvas`)
    this.menu = new Menu(this);
    this.menu.start(this.cxt, window)();
    // this.start(window);
  }

  eventStart=(window, document=window.document)=>(e=>{
    e.preventDefault();
    document.querySelector`body`.appendChild(this.cxt.canvas);
    this.cxt.canvas.focus();
    this.update(window);
  })
  start=(window)=>{
    this.buffer.clear();
    this.cxt.canvas.focus();
    return this.update(window)();
  }
  keyInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.buffer.push({
      button: e.keyCode,
      timeStamp: e.timeStamp
    });
    return e;
  }
  mouseInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.buffer.push({
      button: e.buttons,
      timeStamp: e.timeStamp,
      x: e.x,
      y: e.y
    });
    return e;
  }
  update=(window)=>((t=0)=>{
    this.clearCanvas();
    this.drawFrameTime(t);
    this.drawBufferValuesV('button', 12, 0, 12);
    this.drawBufferValuesV('timeStamp', 12, 12*4, 12);
    this.retireInput(t, console.log);
    window.requestAnimationFrame(this.update(window));
  })
  clearCanvas=()=>this.cxt.clearRect(0, 0, this.cxt.canvas.width, this.cxt.canvas.height)
  drawFrameTime=(t, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#EEEEEE';
    this.cxt.font = fontSize + 'px serif';
    this.cxt.fontBaseline = 'alphabetic';
    this.cxt.fillText(t, x, y+fontSize);
  }
  drawBufferValuesH=(val, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#00FFFF';
    this.cxt.font = fontSize + 'px serif';
    this.cxt.fillText(this.buffer.values(val), x, y+fontSize);
  }
  drawBufferValuesV(val, fontSize = 12, x=0, y=0) {
    this.cxt.fillStyle = '#00FFFF';
    this.cxt.font = fontSize + 'px serif';
    this.cxt.fontBaseline = 'alphabetic';
    (list=>{
      while (list.head) {
        y += fontSize;
        this.cxt.fillText(list.dropHead(), x, y);
      }
    })(this.buffer.values(val))
  }
  retireInput=(t=0, f=_=>_)=> this.buffer.releaseExpired(t).map(f)
}
class Menu {
  constructor(Game) {
    this.game = Game;
    this.position = new V2d();
    this.areas = new LinkList();
  }
  
  update=window=>((t=0)=>{
    this.game.retireInput(t, this.findAreaClicks);
    window.requestAnimationFrame(this.update(window));
  })
  start=(cxt, window)=>{
    // window.document.querySelector`body`.appendChild(cxt.canvas);
    this.game.buffer.clear();
    ((x,y)=>{
      this.drawTitle(cxt, x, y);
      this.drawStartButton(cxt, x, y+36, 30, 18);
    })(36, 36)
    return this.update(window);
  }
  drawTitle=(cxt, x=0, y=0)=>{
    cxt.fillStyle = 'red';
    cxt.font = '24px serif';
    cxt.textBaseline = 'top';
    cxt.beginPath();
    cxt.fillText('S L A Y E R', x, y);
  }
  drawStartButton=(cxt, x=0, y=0, w=0, h=0)=>{
    cxt.strokeStyle = 'red';
    cxt.fillStyle = 'red';
    cxt.font = '16px serif';
    cxt.textBaseline = 'top';
    cxt.beginPath();
    cxt.strokeRect(x, y, w, h);
    cxt.closePath();
    cxt.fillText('start', x+2, y, w);
    this.areas.append(this.area(this.leftClick(this.game.start, window), x, y, w, h));
  }
  leftClick=(f=_=>_, arg)=>(e=>{
    return (e.button==1) ? f(arg) : console.log(f, e);
  })
  areaClick=e=>(area=>{
    if ((area.x < e.x && e.x < area.x+area.w) && (area.y < e.y && e.y < area.y+area.h)) area.callback(e);
  })
  area=(callback=_=>_, x=0, y=0, w=0, h=0)=>({
    callback: callback, x: x, y: y, w: w, h: h
  })
  findAreaClicks=e=>{
    this.areas.map(this.areaClick(e))
  }
}
// (window=>(new Game(window)))(this)
const Slayer = (window=>(new Game(window)))(this);