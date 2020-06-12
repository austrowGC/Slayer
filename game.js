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
  // filter=(f=_=>_, node=this.head)=>{
  //   if (node) return (f(node)) ? 
  // }
  scan=(data, node=this.head)=>{
    // let cursor = this.head;
    // while (cursor) {
    //   if (cursor.data === data) break;
    //   else cursor = cursor.next;

    // }
    // return cursor;
    if (node) return (data == node.data) ? node : this.scan(data, node.next);
    else false;
  }
  search=(data)=>{
    // let node = this.match(data);
    // let value = node ? node.data : null;
    // return value;
    (match=>{
      if (match) return match.data;
      else false;
    })(this.scan(data))
  }
  //! refactor remove
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
  mask=(f=_=>_, r=new LinkList(), l=this.head)=>{
    return (l) ? ((k=>k??r.append(k))(f(l.data)), this.mask(f, r, l.next)) : r;
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
class Entity {
  constructor(owner = {}, shape = {}, vecP = new V2d(), vecV = new V2d()) {
    this.owner = owner;
    this.team = owner.team;
    this.Position = vecP;  // top left
    this.Velocity = vecV;
  }
}
class Player {
  constructor(controls=new LinkList(), entities=new LinkList()) {
    /* 
      define controls
      define things player controls
    */
    this.controls = controls;
    this.entities = entities;
  }

  parseInputs=list=>{
    return list.mask(input=>{
      false;
    });
  }
  parseControls=button=>{
    return this.controls.mask(()=>false);
  }
  executeAction=button=>{
    (control=>{
      if (control) return control.action();
    })(this.controls.map(x=>x?x.button:null).search(button))
  }
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
  retireInput=(t=0, f=_=>_)=> this.releaseExpired(t).map(f)
}
class Game {
  constructor(window, document = window.document, body = document.body) {
    this.inputs = new InputBuffer(500); /* keep a master list? */
    this.cxt = (canvas=>(
      canvas.setAttribute('tabindex', 1),
      canvas.width = window.innerWidth,
      canvas.height = window.innerHeight,
      canvas.addEventListener('keydown', this.keyInput, false),
      canvas.addEventListener('mousedown', this.mouseInput, false),
      canvas.addEventListener('contextmenu', e=>(e.preventDefault(), e), false),
      body.appendChild(canvas),
      canvas.getContext`2d`
      ))(document.createElement`canvas`)
    this.players = (list=>(
      list.append(new Player((inputs=>(
                              inputs.append({/* map goes here */}),
                              inputs))(new LinkList())
                            )),
      list
    ))(new LinkList());
    // controls linked list?
    this.menu = new Menu(this);
    this.menu.drawSplash(this.cxt, window)();
    // this.start(window);
  }

  start=(window)=>{
    this.inputs.clear();
    this.cxt.canvas.focus();
    return this.update(window)();
  }
  keyInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.inputs.push({
      event: e,
      type: 'key',
      button: e.keyCode,
      timeStamp: e.timeStamp
    });
    return e;
  }
  mouseInput=e=>{
    e.preventDefault();
    if (e.repeat) false;
    else this.inputs.push({
      event: e,
      type: 'mouse',
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
    this.drawBufferDataV(x=>x.button + '\t\t' + x.timeStamp, 12, 0, 12);
    (input=>{
      if (input) ((player, button)=>{
        while (player) {
          player.executeAction(button);
          player = player.next;
        }
      })(this.players.head, input.data.button)
    })(this.buffer.head)
    this.inputs.log.map(x=>x);
    this.inputs.retireInput(t, _=>false);
    window.requestAnimationFrame(this.update(window));
  })
  clearCanvas=()=>this.cxt.clearRect(0, 0, this.cxt.canvas.width, this.cxt.canvas.height)
  drawFrameTime=(t, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#EEEEEE';
    this.cxt.font = fontSize + 'px serif';
    this.cxt.fillText(t, x, y+fontSize);
  }
  drawBufferValuesH=(val, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#00FFFF';
    this.cxt.font = fontSize + 'px serif';
    this.cxt.fillText(this.inputs.values(val), x, y+fontSize);
  }
  drawBufferValuesV=(val, fontSize = 12, x=0, y=0)=>{
    this.cxt.fillStyle = '#00FFFF';
    this.cxt.font = fontSize + 'px serif';
    (list=>{
      while (list.head) {
        y += fontSize;
        this.cxt.fillText(list.dropHead(), x, y);
      }
    })(this.inputs.values(val))
  }
  drawBufferDataV=(pattern=_=>_, fontSize=12, x=0, y=0)=>{
    this.cxt.fillStyle = '#00FFFF';
    this.cxt.font = fontSize+'px serif';
    (list=>{
      while (list.head) {
        y+=fontSize;
        this.cxt.fillText(list.dropHead(), x, y);
      }
    })(this.inputs.log.map(pattern))
  }
}
class Menu {
  constructor(Game) {
    this.Game = Game;
    this.areas = new LinkList();
  }
  
  update=window=>((t=0)=>{
    this.Game.buffer.retireInput(t, this.findAreaClicks);
    window.requestAnimationFrame(this.update(window));
  })
  drawSplash=(cxt, window)=>{
    this.Game.buffer.clear();
    ((x,y)=>{
      this.drawTitle(cxt, x, y);
      this.drawStartButton('Start', cxt, x, y+36);
    })(12, 12)
    return this.update(window);
  }
  drawTitle=(cxt, x=0, y=0)=>{
    cxt.strokeStyle = 'red';
    cxt.font = '24px serif';
    cxt.textBaseline = 'top';
    cxt.beginPath();
    cxt.strokeText('S L A Y E R', x, y);
  }
  drawStartButton=(text, cxt, x=0, y=0, fontpx=16, w=cxt.measureText(text).width, h=fontpx+2)=>{
    cxt.strokeStyle = 'red';
    cxt.fillStyle = 'red';
    cxt.font = fontpx + 'px serif';
    cxt.textBaseline = 'top';
    cxt.beginPath();
    cxt.strokeRect(x, y, w, h);
    cxt.closePath();
    cxt.fillText(text, x+(w/text.length), y+2);
    this.areas.append(this.area(this.leftClick(this.Game.start, window), x, y, w, h));
  }
  playerCardArea=()=>{
    /** 
     * rectangle area
     * has pre-game player options
     * 
    */
  }
  leftClick=(f=_=>_, arg)=>(e=>{
    return (e.button==1) ? f(arg) : console.log(f, e);
  })
  areaClick=e=>area=>{
    if (area.x < e.x
      && e.x < area.x+area.w
      && area.y < e.y
      && e.y < area.y+area.h
    ) area.callback(e);
    else e;
  }
  area=(callback=_=>_, x=0, y=0, w=0, h=0)=>({
    callback: callback, x: x, y: y, w: w, h: h
  })
  findAreaClicks=e=>{
    this.areas.map(this.areaClick(e))
  }
}
// (window=>(new Game(window)))(this)
const Slayer = (window=>(new Game(window)))(this);