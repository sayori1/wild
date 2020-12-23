var canvas
var context
var delay = 30
var deltaTime = delay/1000.0 
function init(){
    this.canvas = document.getElementById("canvas")
    this.context = canvas.getContext('2d')
}

//main objects
class GameObject{
    static idacc = 0
    constructor(){
        this.childs = []
        this.paused = false
        this.Update = function(){}
        this.id = GameObject.idacc
        this.group = 0
        GameObject.idacc+=1
    }
    update(){
        this.Update()
        for(var i in this.childs){
            if(!this.childs[i].paused)this.childs[i].update()
        }
    }
    addChild(child){
        if(this.relativeFrom && !child.relX && !child.relY){
            child.relX = child.x
            child.relY = child.y
        }
        child.parent = this
        this.childs.push(child)
    }
    remChildById(id, deep = false){
        for(var i in this.childs){
            if(id == this.childs[i].id){
                this.childs.splice(i, 1);
                i -= 1;
                return true
            }
            if(deep){
                if(this.childs[i].remChildById(id, deep)) return true
            }
        }
        return false
    }
    remChildByObject(object, deep = false){
        this.remChildById(object.id, deep)
    }
    forEachNode(func, deep=false){
        for(var i in this.childs){
            func(this.childs[i])
            if(deep) this.childs[i].forEachNode(func, deep)
        }
    }
    getNodesInGroup(group, deep=false){
        var arr = []
        for(var i in this.childs){
            if(this.childs[i].group == group) arr.push(this.childs[i])
            if(deep){ 
                var sarr = this.childs[i].getNodesInGroup(group, deep)
                for(var i in sarr)arr.push(sarr[i])
            }
        }
        return arr
    }
}
class TransformObject extends GameObject{
    constructor(x = 0, y = 0, angle = 0, rel = false){
        super()
        this.relX = 0
        this.relY = 0
        this.x = x
        this.y = y
        this.angle = angle
        this.relativeFrom = rel
    }
    update(){
        super.update()
        if(this.parent && this.parent.relativeFrom){
            this.x=this.parent.x+this.relX
            this.y=this.parent.y+this.relY
        }
        context.beginPath()
        context.arc(this.x, this.y, 10.0, 0, 360)
        context.stroke()
    }
    rotate(angle){
        this.angle = angle
        let sin = Math.sin(angle/(180.0/Math.PI))
        let cos = Math.cos(angle/(180.0/Math.PI))
        for(var i in this.childs){
            let r = Math.sqrt(this.childs[i].relX * this.childs[i].relX + this.childs[i].relY * this.childs[i].relY)
            this.childs[i].relX = r * sin
            this.childs[i].relY = r * cos
        }
    }
}

//drawable objects
class Texture {
    constructor(path) {
        this.img = new Image();
        this.img.src = path;
        this.width = this.img.width
        this.height = this.img.height
    }
}
class TextureAtlas {
    constructor(path, frameWidth, frameHeight, offsetX = 0, offsetY = 0) {
        this.img = new Image();
        this.img.src = path;
        this.offsetX = offsetX
        this.offsetY = offsetY
        this.frameWidth = frameWidth
        this.frameHeight = frameHeight
        this.countX = Math.ceil(this.img.width / this.frameWidth)
        this.countY = Math.ceil(this.img.height / this.frameHeight)
    }
}
class Sprite extends TransformObject {
    constructor(drawable, x = 0, y = 0, angle = 0, w, h) {
        super(x,y,angle)
        this.drawable = drawable;
        if (!w || !h) {
            if (drawable instanceof Texture) {
                this.width = this.drawable.width;
                this.height = this.drawable.height;
            }
            else if (drawable instanceof TextureAtlas) {
                this.width = this.drawable.frameWidth;
                this.height = this.drawable.frameHeight;
                this.frame = 0
            }
        }
        else {
            this.width = w;
            this.height = h;
        }
        this._width = this.width;
        this._height = this.height;
        this.originX = 0;
        this.originY = 0;
        this.visible = true;
    }
    setScale(x, y) {
        this._width = this.width * x;
        this._height = this.height * y;
    }
    getActualSize() {
        return { width: this._width, height: this._height }
    }
    update() {
        super.update()
        if (this.visible) {
            if (this.alpha != 1.0) {
                context.globalAlpha = this.alpha
            }
            if (this.angle != 0) {
                context.save();
                context.rotate(this.angle / (180 / Math.PI));
            }
            if (this.drawable instanceof Texture) {
                context.drawImage(this.drawable.img, this.x - this._width * this.originX, this.y - this._height * this.originY, this._width, this._height)
            }
            else if (this.drawable instanceof TextureAtlas) {
                let frameY = Math.floor(this.frame / this.drawable.countX)
                let frameX = this.frame % this.drawable.countX
                context.drawImage(this.drawable.img, frameX * this.drawable.frameWidth, frameY * this.drawable.frameHeight, this.drawable.frameWidth, this.drawable.frameHeight, this.x - this._width * this.originX, this.y - this._height * this.originY, this._width, this._height)
            }
            if (this.angle != 0) {
                context.restore();
            }
            if (this.alpha != 1.0) {
                context.globalAlpha = 1.0;
            }
        }
    }
}
class Convex extends TransformObject{
    constructor(vertices, color = [0,0,0,255], x = 0, y = 0, angle = 0) {
        super(x,y,angle,false)
        this.vertices = vertices
        this.color = color
        this.visible = true
    }
    draw() {
        if (this.color != [255,255,255,255]) {
            context.fillStyle = "rgba(" + this.color[0] + "," + this.color[1] + "," +this.color[2] + "," + this.color[3] + ")"
        }
        if(this.angle != 0){
            context.save()
            context.rotate(this.angle / (180 / Math.PI))
        }
        context.beginPath();
        context.moveTo(this.x + this.vertices[0], this.y + this.vertices[1])
        for (var i = 2; i < this.vertices.length; i+=2) {
            context.lineTo(this.x + this.vertices[i], this.y + this.vertices[i + 1])
        }
        context.fill()
        if(this.angle != 0){
            context.restore()
        }
        if (this.color != [255,255,255,255]) {
            context.fillStyle = "rgba(" + 255 + "," + 255 + "," + 255 + "," + 255 + ")"
        }
    }
    update(){
        super.update()
        if(visible){
            this.draw()
        }
    }
}

//physics
class Rect{
    constructor(width, height){
        this.width = width;
        this.height = height;
    }
    static rectVsRect(x1, y1, rect1, x2, y2, rect2){
        let cx1 = x1 + rect1.width/2
        let cx2 = x2 + rect2.width/2
        let cy1 = y1 + rect1.heigth/2
        let cy2 = y2 + rect2.height/2
        if(Math.abs(cx1 - cx2) >rect1.width/2+rect2.width/2 ) return false;
        if(Math.abs(cy1 - cy2) >rect1.height/2+rect2.height/2 ) return false;
        return true;
    }
}
class Circle{
    constructor(r){
        this.r = r
    }
    static circleVsCircle(x1,y1,circle1,x2,y2,circle2){
        let d = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1))
        return d < circle1.r + circle2.r
    }
    static objectVsObject(obj1, obj2){
        return Circle.circleVsCircle(obj1.x, obj1.y, obj1.collider, obj2.x, obj2.y, obj2.collider)
    }
}
class PhysicsObject extends TransformObject{
    constructor(x, y, collider){
        super(x,y,0,true);
        this.vx = 0
        this.vy = 0
        this.ax = 0
        this.ay = 0
        this.collider = collider;
        this.collisions = []
        this.mass = 10.0
    }
    update(){
        super.update()
        this.vx += this.ax * deltaTime;
        this.vy += this.ay * deltaTime;
        this.x += this.vx*deltaTime;
        this.y += this.vy*deltaTime;
        for(var i in this.collisions){
            if(Circle.objectVsObject(this, this.collisions[i].body)){   
                if(!this.collisions[i].entered){
                    this.collisions[i].body.vx *= -1
                    this.vx *= -1
                    this.collisions[i].entered = true
                }
            }
            else{
                if(this.collisions[i].entered){
                    this.collisions[i].entered = false;
                }
            }
        }
    }
    addCollision(node){
        this.collisions.push({entered:false, body: node})
    }
    applyImpulse(impulse){
    }
}


//props
class Tween extends GameObject {
    static easeType = {"linear":1, "quad":2}
    constructor(object, props, duration = 1000, repeat = -1, yoyo = false, easeType = 1, onEnd = function () { }, parent = null) {
        super()
        this.duration = duration
        this.alpha = 0.0
        this.repeat = repeat
        this.props = props
        this.update = function () {
            this.alpha += delay
            let percent = (this.alpha / this.duration)
            if(easeType==2){
                percent *=percent
            }
            for (var i in props){
                object[props[i].name] = props[i].begin + (props[i].end - props[i].begin) * percent
            }
            if (this.alpha >= duration) {
                this.repeat -= 1
                for (i in props){
                    object[props[i].name] = props[i].end
                }
                if (this.repeat == 0) {
                    onEnd()
                    destroy(this.id)
                    delete (this)
                    return
                }
                this.alpha = 0.0
                if (yoyo) { //swap
                    for (var i in props){
                        var t = props[i].begin
                        props[i].begin = props[i].end
                        props[i].end = t
                    }
                }
            }
            this.update()
        }
    }
}

var tree = new GameObject()
function startLoop(){
    setInterval(function(){
        context.clearRect(0,0,canvas.width, canvas.height)
        tree.update()
    }, delay)
}
