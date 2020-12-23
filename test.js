init()
var c1 = new PhysicsObject(50, 50, new Circle(10))
c1.ax = 5 //acceleration

var c2 = new PhysicsObject(200, 50, new Circle(10))
c2.ax = -5
c2.addCollision(c1)

tree.addChild(c1)
tree.addChild(c2)
startLoop()
