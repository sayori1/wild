initWild()
var object = new Sprite(new TextureAtlas("buttons.png", 236, 65), 0,0)
//object.frame = 1
var tween = new Tween(object, "alpha", 1000, 0, 1.0, -1, true)
startLoop()