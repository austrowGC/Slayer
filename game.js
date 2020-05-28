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
  map=(func)=>{
    let cursor = this.head;
    while (cursor) {
      cursor.data[func]();
      cursor = cursor.next;
    }
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

  push=data=>this.log.append(data)
  pop=()=>this.log.dropHead()
  values=(val, head=this.log.head, r=new LinkList())=>{
    return (head) ? (r.append(head.data[val]), this.values(val, head.next, r)) : r;
  }
  valueString=(val, head=this.log.head)=>{
    return (head) ? head.data[val] + '\n' + this.valueString(val, head.next) : '\n';
  }
  releaseExpired=(msNow, log=this.log, r=new LinkList())=>{
    if (log.head) {
      if (msNow - log.head.data.time > this.delay) {
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
    this.buffer = new InputBuffer(); /* keep a master list? */
    this.window = window;
    this.document = document;
    this.cxt = (canvas=>(
      canvas.setAttribute('tabindex', 1),
      canvas.width = window.innerWidth-this.gutter,
      canvas.height = window.innerHeight-this.gutter,
      canvas.addEventListener('keydown', this.keyInput, false),
      canvas.addEventListener('mousedown', this.mouseInput, false),
      canvas.addEventListener('contextmenu', e=>(e.preventDefault(), e), false),
      canvas.getContext`2d`
    ))(document.createElement`canvas`)
    document.querySelector`body`.appendChild(this.cxt.canvas);
    this.cxt.canvas.focus();
    this.update();
  }

  keyInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.buffer.push({
      button: e.keyCode,
      time: e.timeStamp
    });
    return e;
  }
  mouseInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.buffer.push({
      button: e.buttons,
      time: e.timeStamp
    });
    return e;
  }
  update=(t=0)=>{
    this.clearCanvas();
    this.drawFrameTime(t);
    this.drawBufferValuesV('button', 12, 0, 12);
    this.drawBufferValuesV('time', 12, 12*4, 12);
    (expired=>{
      while (expired.head) /* examine for chords? */ console.log(expired.dropHead());
    })(this.buffer.releaseExpired(t))
    
    this.window.requestAnimationFrame(this.update);
  }
  clearCanvas=()=>this.cxt.clearRect(0, 0, this.cxt.canvas.width, this.cxt.canvas.height)
  drawFrameTime=(t, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#EEEEEE';
    this.cxt.font = fontSize + 'px serif';
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
    (list=>{
      while (list.head) {
        y += fontSize;
        this.cxt.fillText(list.dropHead(), x, y);
      }
    })(this.buffer.values(val))
  }
  
}
class Menu {
  constructor(cxt, window) {
  }
  
  update=(t=0)=>{
    this.window.requestAnimationFrame(this.update);
  }
  init=cxt=>{
    ((x,y)=>{
      this.drawTitle(cxt, x, y);
      (startY=>{
        this.drawStartButton(cxt, x, startY);
        cxt.canvas.addEventListener('click', this.eventStartClick(this, x, startY), false);
      })(y+22)
    })(0,0)
  }
  drawTitle=(cxt, x=0, y=0)=>{
    cxt.fillStyle = 'red';
    cxt.font = '16px serif';
    cxt.fillText('SLAYER', x, y);
  }
  drawStartButton=(cxt, x=0, y=0)=>{
    cxt.fillStyle = 'red';
    cxt.font = '12px serif';
    cxt.fillText('start', x, y);
    cxt.beginPath();
    cxt.strokeRect(x, y, x+36, y+12);
    cxt.endPath();
  }
  eventStartClick=(Menu, x=0, y=0)=>{
    return e=>{
      if (e.button==1)
      if ((x < e.x && e.x < x+36) && (y < e.y && e.y < y+12)) false;
    }
  }
}
class Arena {
  constructor(context, window) {
    
  }

  update=(t=0)=>{
    this.window.requestAnimationFrame(this.update);
  }
}
// (window=>(new Game(window)))(this)
const Slayer = (window=>(new Game(window)))(this);