
var canvas;
var context;
var lastFrame;
var objects;
var idacc = 0
var delay = 30
var onUpdate = function(){};
function initWild(){ 
    canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');
    lastFrame = new Date()
    objects = new Array()
}
function startLoop(){ 
    setInterval(function(){
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (i in objects){
            if(objects[i].pause == false)objects[i].update()
        }
        onUpdate()
    }, delay)
}
function deleteObject(arr, id){ 
    for (i in arr){
        if(arr[i].id == id){
            arr.splice(i, 1);
            i-=1;
            return true
        }
        if(deleteObject(arr[i].childs, id)){
            return
        }
    }
    return false
} 
function destroy(object){
    return deleteObject(objects,object.id)
}
class Texture{
    constructor(path){
        this.img = new Image();
        this.img.src = path;
        this.width = this.img.width
        this.height = this.img.height
    }
}
class TextureAtlas{
    constructor(path,frameWidth,frameHeight,offsetX=0,offsetY=0){
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
class Object{
    constructor(){
        this.childs = new Array();
        this.id = idacc
        this.pause = false
        idacc+=1
    }
    add(parent=null){
        if(!parent){
            objects.push(this)
        }
        else{
            this.parent = parent
            this.parent.childs.push(this)
        }
    }
    updateChilds(){
        for (i in this.childs){
            this.childs[i].update()
        }
    }
}
class Sprite extends Object{
    constructor(drawable, x = 0, y = 0, angle = 0, w, h, parent = null){
        super()
        this.x = x
        this.y = y
        this.angle = angle
        this.drawable = drawable;
        if(!w || !h){
            if(drawable instanceof Texture){
                this.width = this.drawable.width;
                this.height = this.drawable.height;
            }
            else if(drawable instanceof TextureAtlas){
                this.width = this.drawable.frameWidth;
                this.height = this.drawable.frameHeight;
                this.frame = 0
            }
        }
        else{
            this.width = w;
            this.height = h;
        }
        this._width = this.width;
        this._height = this.height;
        this.originX = 0;
        this.originY = 0;
        this.visible = true;
        super.add(parent);
    }
    setScale(x,y){
        this._width = this.width * x;
        this._height = this.height * y;
    }
    getActualSize(){
        return {width:this._width, height:this._height}
    }
    update(){
        this.updateChilds()
        if(this.visible){
            if(this.alpha != 1.0){
                context.globalAlpha = this.alpha
            }
            if(this.angle!=0){
                context.save();
                context.rotate(this.angle / (180/Math.PI));
            }
            if(this.drawable instanceof Texture){
                context.drawImage(this.drawable.img, this.x - this._width*this.originX, this.y - this._height * this.originY, this._width, this._height)
            }
            else if(this.drawable instanceof TextureAtlas){
                let frameY = Math.floor(this.frame / this.drawable.countX)
                let frameX = this.frame % this.drawable.countX
                context.drawImage(this.drawable.img, frameX * this.drawable.frameWidth,frameY * this.drawable.frameHeight, this.drawable.frameWidth, this.drawable.frameHeight, this.x - this._width*this.originX, this.y - this._height * this.originY, this._width, this._height)
            }
            if(this.angle != 0){
                context.restore();
            }
            if(this.alpha != 1.0){
                context.globalAlpha = 1.0;
            }
        }
    }
}
class Tween extends Object{
    constructor(object, property, duration, begin, end, repeat = -1, yoyo = false, onEnd = function(){}, parent = null){
        super()
        this.property = property
        this.duration = duration 
        this.begin = begin
        this.end = end
        this.alpha = 0.0
        this.repeat = repeat
        this.update = function(){
            this.updateChilds()
            this.alpha += delay
            object[property] = this.begin + (this.end - this.begin)*(this.alpha/this.duration)
            if(this.alpha >= duration){
                this.repeat-=1
                object[property] = this.end
                if(this.repeat == 0){
                    onEnd()
                    destroy(this.id)
                    delete(this)
                    return
                }
                if(yoyo){ //swap
                    var t = this.begin
                    this.begin = this.end
                    this.end = t
                    this.alpha = 0.0
                }
            }
        }
       super.add(parent)
    }
}

