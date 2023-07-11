//Canvas set up 
const canvas= document.querySelector('canvas');
const c= canvas.getContext('2d');
var buttonElement = document.querySelector("button");
canvas.width=1200;
canvas.height=675;
const CstartX=0;
const CstartY=0;
const toggle = document.getElementById('toggle');
const toggleWrap=document.getElementById('CheckBoxWrap');
const keyW = document.getElementById('keyW');
const keyA = document.getElementById('keyA');
const keyS = document.getElementById('keyS');
const keyD = document.getElementById('keyD');
const Space=document.getElementById('Space');
const leftClickButton = document.getElementById('left-click');
const rightClickButton = document.getElementById('right-click');
const mouseButtons = document.getElementsByClassName('mouse-buttons');
const keyButtons = document.getElementsByClassName('keyboard');
//global variables for keyboard/mouse inputs
var keys=[];
var clicks=[];
var mouseX;
var mouseY;
//Sprite variables
var gameObjects=[];
var projectiles=[];
var uniqueIdentity=0;
var freeze=false;
var SheildAngStart;
var SheildAngEnd;
var cows=[];
var farmerCount=0;
//1,000=1 sec
var waitTime=2000;//respawn rate of cows
//game management variables 
var score=0;
var boss=false;
var bossHealth=100;
var screenManager=0;//0=start, 1=gameplay, 2=win, 3=defeat
var hitbox=true;
var MSTrip=0;



//Parent class for all sprites 
class Sprite{
    //takes starting position, starting velocity, starting width/height, max speed, movement friction, main shape color, target
    constructor({position, velocity, width, height, speed, friction, color, ID}){
        this.position= position;
        this.velocity=velocity;
        this.width=width;
        this.height=height;
        this.speed=speed;
        this.friction=friction;
        this.color=color;
        this.target;
        this.angle=0;
        this.dead=false;
        this.ID=ID;
        this.shoot=true;
    }
    
    update(){
        this.drawImageRot(this.angle);
    }

    //draws sprite
    draw(changeX, changeY, x,y){
        c.fillStyle=this.color;
        c.fillRect(changeX, changeY, x, y);
    }

    drawDesign(changeX, changeY){
        //placeholder
    }

    //stops velocity at ends of canvas for UFO
    BoarderCheck(){
        if(this.position.y+this.velocity.y+this.height/2>=canvas.height-50){
            this.velocity.y=0;
        }
        if(this.position.y+this.velocity.y-this.height/2<=CstartY){
            this.velocity.y=0;
        }
        
        if(this.position.x+this.velocity.x+this.width/2>=canvas.width){
            this.velocity.x=0;
        }
        if(this.position.x+this.velocity.x-this.width/2<=CstartX){
            this.velocity.x=0;
            
        }
    }

    //rotates image 
    drawImageRot(deg){
        c.save();
        c.translate(this.position.x, this.position.y);
        c.rotate(rads(deg));  
        if(hitbox){
        this.draw(this.width / 2 * (-1),this.height / 2 * (-1),this.width, this.height);
        }
        this.drawDesign(this.width / 2 * (-1),this.height / 2 * (-1));
        c.restore();
        this.angle=rads(deg);
    }
}

//ALL SPRITE CLASS EXTENTIONS
//UFO Components
class UFO extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color, ID}){
        super({position, velocity, width, height, speed, friction, color, ID});
        this.target={
            x:mouseX,
            y:mouseY
        };
        this.thrown=false;
        this.startpoint=0;
        this.sheildHealth=100;
        this.point={
            x:this.position.x,
            y:this.position.y
        }
        this.shootPoint={
            x: this.position.x+100,
            y: this.position.y
        }
        this.health=100;
        this.cowCount=0;
    }

    update(){
        var deg = Math.atan2((this.target.y-(this.position.y)),(this.target.x-(this.position.x)));
        this.point=rotatePoint(this.position.x, this.position.y, this.position.x+this.width/2+10, this.position.y, deg);
        this.shootPoint=rotatePoint(this.position.x, this.position.y, this.position.x+100, this.position.y, deg);
        this.drawImageRot(this.angle);
        this.target.x=mouseX;
        this.target.y=mouseY;
        this.Inputs();
        this.AimCursor();
    }

    drawDesign(middleX, middleY){
        //draws gray body
        c.beginPath();
        c.fillStyle="#595959"
        c.strokeStyle="#404040";
        c.beginPath();
        c.ellipse(middleX+this.width/2,middleY+this.height/2, this.width/2, this.height/2, 0, 0, rads(180));
        c.stroke();
        c.fill();
        c.fillStyle="#737373";
        c.beginPath()
        c.ellipse(middleX+this.width/2,middleY+this.height/2, this.width/2, this.height/3, 0, 0, rads(360));
        c.fill();
        c.stroke();

        c.beginPath();
        c.fillStyle="green";
        c.ellipse(middleX+this.width/2,middleY+this.height*.30, this.width*.1, this.height*.2, 0, 0, rads(360));
        c.fill();
        
        //glass
        c.globalAlpha=0.65;
        c.beginPath();
        c.ellipse(middleX+this.width/2,middleY+this.height/3, this.width/4, this.height/3, 0, 0, rads(180),true);
        c.ellipse(middleX+this.width/2,middleY+this.height/3, this.width/4, this.height/5, 0, 0, rads(180));
        c.fillStyle="#ccffff";
        c.fill();
        c.globalAlpha=1;

        //lights
        c.beginPath();
        c.ellipse(middleX+this.width*.15,middleY+this.height*.5, this.width*.05, this.height*.05, rads(45), 0, rads(360));
        c.fillStyle="#ffff4d";
        c.fill();
        c.beginPath();
        c.ellipse(middleX+this.width*.85,middleY+this.height*.5, this.width*.05, this.height*.05, rads(-45), 0, rads(360));
        c.fillStyle="#ffff4d";
        c.fill();
        c.beginPath();
        c.ellipse(middleX+this.width/2,middleY+this.height*.65, this.width*.05, this.height*.05, 0, 0, rads(360));
        c.fillStyle="#ffff4d";
        c.fill();
    }

    //User inputs effects on sprite effects(UFO)
    Inputs(){
        //checks for throw
       if(!this.thrown){
        //key inputs wasd
        if (keys['w']&&!freeze) {
            if (this.velocity.y > -this.speed) {
                this.velocity.y--;
            }
        }
        if (keys['s']&&!freeze) {
            if (this.velocity.y < this.speed) {
                this.velocity.y++;
            }
        }
        if (keys['d']&&!freeze) {
            if(keys['a']&&keys['d']){
                this.angle=0;                 
            }   else {
                this.angle=45;                             
            }        
            if (this.velocity.x < this.speed) {
                this.velocity.x++;
            }
        }
        if (keys['a']&&!freeze) {
            if(keys['a']&&keys['d']){
                this.angle=0;                                
                }   else {
                    this.angle=-45;                               
                }    
            if (this.velocity.x > -this.speed) {
                this.velocity.x--;
            }
        }
        //fixes mistakes with rotate when moving just up and down and when no keys are being pressed 
        if(!keys['w']&&!keys['a']&&!keys['s']&&!keys['d']){
            this.angle=0;                 
        }
        if((keys['w']||keys['s'])&&(!keys['a']&&!keys['d'])){
            this.angle=0;                 
        }

        //space bar inputs
        if((keys[' '])){
            freeze=true;
            this.angle=0;                 
            this.Beam();
        }else{
            freeze=false;
        }

        var ProjHeight=1;
        var Projwidth=30;
        if(!clicks['2']){
            SheildAngEnd=0;
            SheildAngStart=0;
        }

        //mouse inputs 
        if((clicks['2'])&&(!freeze)&&(this.sheildHealth>0)){
            this.sheildHealth-=3;
            this.Bubble("blue");        
        }else if(clicks['0']&&!freeze&&this.shoot){
            this.shoot=false;
            this.Bubble("#e60000");
            var deg = Math.atan2((this.target.y-(this.position.y)),(this.target.x-(this.position.x)));
            const velocity={
                x: Math.cos(deg)*20,
                y: Math.sin(deg)*20
            }
        projectiles.push(
            new Lazer({
                position: this.point,
            velocity:{
                x: velocity.x,
                y: velocity.y
            },
            width: Projwidth,
            height:ProjHeight,
            angle:deg,
            color: "#e60000",
            ID:this.ID
            })
        )
        }
        this.BoarderCheck();
        this.velocity.y *= this.friction;
        this.position.y += this.velocity.y;
        this.velocity.x *= this.friction;
        this.position.x += this.velocity.x;            
       }else{
        const distance=Math.sqrt(Math.pow(this.startpoint.x - this.position.x, 2) + Math.pow(this.startpoint.y - this.position.y, 2));
        if(distance >=300){
        this.thrown=false;
        }
        this.BoarderCheck();
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
       }
        if((!clicks['2'])&&(this.sheildHealth<100)){
            this.sheildHealth+=1.5;
        }
    }

    //creates Beam
    Beam(){
        if(!(this.cowCount>=3)){
        var beamHitX=this.position.x;
        var beamHitY=this.position.y+this.height/2+37.5;
        const beam={
            position:{
                x:beamHitX,
                y:beamHitY
            },
            width: 70,
            height: 75,
            angle: 0,
        }
        if(cows.length>0){
            checkForCow(beam)
        }
        if(hitbox){
            c.fillStyle="gray";
            c.fillRect(beam.position.x-35, beam.position.y-37.5, beam.width, beam.height);
        }
        c.beginPath();
        c.globalAlpha=.8;
        c.strokeStyle="purple";
        c.moveTo(this.position.x+5,beamHitY-37.5);
        c.arc(this.position.x,this.position.y,92,rads(68),rads(112));
        c.lineTo(this.position.x-5,beamHitY-37.5);
        c.stroke();
        c.fillStyle="#d11aff";
        c.fill();
        c.globalAlpha=1;
    }
    }

    //add buffer for moving around radius 
    Bubble(color){
        var angleStart;
        var angleEnd;
        var deg = Math.atan2((this.target.y-(this.position.y)),(this.target.x-(this.position.x)));
        deg *=(180/Math.PI);
        if(deg<0){
            deg+=360;
        }
        var angleStart= deg-45;
        var angleEnd=deg+45;
        c.beginPath();
        c.strokeStyle=color;
        SheildAngEnd=angleEnd;
        SheildAngStart=angleStart;
        c.arc(this.position.x,this.position.y,40,rads(SheildAngStart),rads(SheildAngEnd)); 
        c.stroke();
        c.beginPath();
    }

    //Cursor around UFO
    AimCursor(){
        c.beginPath();
        c.fillStyle="red";
        c.arc(this.shootPoint.x, this.shootPoint.y, 2, 0, rads(360));
        c.fill();
    }

    //drops cows
    DropCows(){
        for(let i =0; i < this.cowCount; i++){
            let xplace=i*40-40;
            gameObjects.push(
                new FallingCow({    
                    position:{
                    x:this.position.x+xplace,
                    y:this.position.y+20
                },
                    width:20,
                    height:15,
                color: "gray",
                velocity:.6
            })
        )
        }
        this.cowCount=0;
    }

    //for when hit
    Hit(healthLoss){
        this.health-=healthLoss;
        this.DropCows();
    }
}

//Farmer components
class Farmer extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color, ID, neg}){
        super({position, velocity, width, height, speed, friction, color, ID});
        this.target={
            x:gameObjects[0].position.x,
            y:gameObjects[0].position.y
        };
        this.point={
            x:this.position.x+this.width/2,
            y:this.position.y-this.height/2
        }
        this.neg=neg;
        farmerCount++;
        this.pause=true;
        setTimeout(() => {
            this.pause=false;
        }, 1000);
    }

    update(){
        var deg = Math.atan2(((this.target.y-this.point.y)*this.neg),((this.target.x-this.point.x)*this.neg));
        this.point=rotatePoint(this.position.x, this.position.y, this.position.x+(this.width/2+10)*this.neg, this.position.y-this.height/3, deg);    
        this.target.x=gameObjects[0].position.x;
        this.target.y=gameObjects[0].position.y;
        if(this.shoot&&!this.pause){
            this.Shoot();
            this.shoot=false;         
        }
        this.drawImageRot(this.follow());
        //draws farmers legs
        c.beginPath();
        c.fillStyle="navy";
        c.fillRect(this.position.x-this.width/2, this.position.y, this.width/2-1, this.height/2);
        c.fillRect(this.position.x+this.width/2, this.position.y, -this.width/2+1, this.height/2);
        c.fillRect(this.position.x-this.width/2, this.position.y, this.width, this.height/4);
        c.fillStyle="brown";
        c.fillRect(this.position.x-this.width/2, this.position.y, this.width, this.height/15);
    }
    
    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="blue";
        c.fillRect(middleX*this.neg,(middleY+this.height/5)*this.neg, this.width*this.neg, (this.height/2-this.height/5)*this.neg);
        c.arc(middleX+this.width/2, middleY+this.height/2, this.width/2, 0, rads(360));
        c.fill();

        c.beginPath();
        c.fillStyle="tan";
        c.fillRect((middleX+this.width/10)*this.neg, middleY*this.neg, (this.width-this.width/5)*this.neg, this.height/5*this.neg);

        c.beginPath();
        c.fillStyle="gray";
        c.fillRect((middleX-middleX/3),(middleY-middleY/3)*this.neg, this.width*1.5, this.height/10*this.neg);
    
        this.drawHat(middleX, middleY);
    }

    follow(){
        var deg = Math.atan2((this.target.y-(this.point.y)),(this.target.x-(this.point.x)));
        deg*=180/Math.PI;
        return deg;
    }

    Shoot(){
        //place holder
    }

    hit(){
        var WT=2000;
        if(score>=14){
            WT=10000;
        }
        setTimeout(()=>{
            if(!boss){
                if(farmerCount<cows.length){
                    PushNew("Farmer");
                }else if(cows.length<=0){
                    PushNew("Farmer");
                }
            }
        },WT)
        farmerCount--;
        this.dead=true;
    }
}

//Farmer Varients
class Gun_Farmer extends Farmer{
    drawHat(middleX, middleY){
        c.beginPath();
        c.fillStyle="#cca300";
        c.fillRect(middleX-this.width*.15, middleY*this.neg, this.width+this.width*.30, -this.height*.05*this.neg);
        c.fillRect(middleX+this.width*.05, middleY*this.neg, this.width*.95, -this.height*.15*this.neg);
    }

    Shoot(){        
        var deg = Math.atan2((this.target.y-(this.point.y)),(this.target.x-(this.point.x)));
        const velocity={
            x: Math.cos(deg)*7,
            y: Math.sin(deg)*7
        }
        projectiles.push(
            new Bullet({
                position: {
                    x:this.point.x,
                    y:this.point.y
                },
                velocity:{
                    x: velocity.x,
                    y: velocity.y
                },
                width: 10,
                height:5,
                angle:deg,
                color: "black",
                ID: this.ID
            })
            )}
}

class Rock_Farmer extends Farmer{
    drawHat(middleX, middleY){
        c.beginPath();
        c.fillStyle="#e60000";
        c.fillRect(middleX+this.width*.15, middleY*this.neg, -this.width*.5, -this.height*.05*this.neg);
        c.fillRect(middleX+this.width*.05, middleY*this.neg, this.width*.95, -this.height*.10*this.neg);
    }

    Shoot(){
        var deg = Math.atan2((this.target.y-(this.point.y)),(this.target.x-(this.point.x)));        
        const distance=Math.sqrt(Math.pow(this.target.x - this.position.x, 2) + Math.pow(this.target.y - this.position.y, 2));
        const velocity={
            x: Math.cos(deg)*8,
            y: Math.sin(deg)*this.mapValue(distance, 0, 1377, 8, 16)
        };
        projectiles.push(
            new Rock({
                position: {
                    x:this.point.x,
                    y:this.point.y
                },
                velocity:{
                    x: velocity.x,
                    y: velocity.y
                },
                width: 5,
                height:5,
                angle:deg,
                color: "black",
                ID: this.ID
            })
            )}
            
            mapValue(value, start1, stop1, start2, stop2) {
                const range1 = stop1 - start1;
                const range2 = stop2 - start2;
                const scaledValue = (value - start1) / range1;
                const mappedValue = start2 + scaledValue * range2;
                return mappedValue;
              }
}

class ShotGun_Farmer extends Farmer{
    drawHat(middleX, middleY){
        c.beginPath();
        c.fillStyle="#ff4da6";
        c.fillRect(middleX+this.width*1.3, middleY*this.neg, -this.width*.36, -this.height*.05*this.neg);
        c.fillRect(middleX+this.width*.05, middleY*this.neg, this.width*.95, -this.height*.10*this.neg);
    }

    Shoot(){
        var deg = Math.atan2((this.target.y-(this.point.y)),(this.target.x-(this.point.x)));        
        
        for(var i = 0; i<50; i++){
            let value=(i / 49) * 20 - 10;
            value *= (Math.PI / 150);
            let v=8 + Math.random() * 4;
        const velocity={
            x: Math.cos(deg+value)*v,
            y: Math.sin(deg+value)*v
        };
        projectiles.push(
            new ShotGun({
                position: {
                    x:this.point.x,
                    y:this.point.y
                },
                velocity:{
                    x: velocity.x,
                    y: velocity.y
                },
                width: 2,
                height:2,
                angle:deg,
                color: "black",
                ID: this.ID
            })
            )
            }
            setTimeout(() => {
                this.shoot=true;
            }, 3000);
        }
}

//Cow Components
class Cow extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color}){
        super({position, velocity, width, height, speed, friction, color});
        this.angle=0;
        this.randomX=Math.random() * (canvas.width*.8 - canvas.width*.2) + canvas.width*.2;
        this.direction=randomChance(.5);
        this.fix=-1;
        this.once=true;
        if(this.direction){
            this.fix=1;
            this.velocity*=-1;
        }
    }

    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="#331400";
        c.strokeStyle="white";
        c.fillRect(middleX*this.fix, middleY,this.width/2.5*this.fix, this.height/2);
        c.fillRect(0, this.height/2, -this.width/5*this.fix, -this.height/1.5);
        c.fillRect(this.width/2*this.fix-2*this.fix, this.height/2, -this.width/5*this.fix, -this.height/1.5);
        c.fillRect(middleX/2*this.fix, middleY/2, this.width/1.4*this.fix, this.height/1.8);
        c.stroke();
    }

    update(){
        this.drawImageRot(this.angle);
        this.randomMovement();
    }

    randomMovement(){
        if((this.position.x>=this.randomX-1)&&(this.position.x<=this.randomX+1)){
                if(randomChance(.5)&&this.once){
                    this.once=false;
                    this.velocity*=-1;
                    this.fix*=-1;
                }
                setTimeout(() => {
                    this.once=true;
                this.randomX=Math.random() * (canvas.width*.8 - canvas.width*.2) + canvas.width*.2;
            }, 3000);
        }else{
            if(this.position.x>canvas.width*.83){
                this.velocity=-Math.abs(this.velocity);
                this.fix=Math.abs(this.fix);
            }else if(this.position.x< canvas.width*.23){
                this.velocity=Math.abs(this.velocity);
                this.fix=-Math.abs(this.fix);
            }
            this.position.x+=this.velocity;
        }
    }

}

class FallingCow extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color}){
        super({position, velocity, width, height, speed, friction, color});
        this.angle=0;
        this.direction=randomChance(.5);
        this.fix=-1;
        this.once=true;
        if(this.direction){
            this.fix=1;
        }
        this.velocity=3;
    }

    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="#331400";
        c.strokeStyle="white";
        c.fillRect(middleX*this.fix, middleY,this.width/2.5*this.fix, this.height/2);
        c.fillRect(0, this.height/2, -this.width/5*this.fix, -this.height/1.5);
        c.fillRect(this.width/2*this.fix-2*this.fix, this.height/2, -this.width/5*this.fix, -this.height/1.5);
        c.fillRect(middleX/2*this.fix, middleY/2, this.width/1.4*this.fix, this.height/1.8);
        c.stroke();
    }

    update(){
        this.drawImageRot(this.angle);
        if(this.position.y<canvas.height-35){
            this.position.y+=this.velocity
        }else{
            this.dead=true;
            this.replace();
        }
    }

    replace(){
        cows.push(
            new Cow({    
                position:{
                x:this.position.x,
                y:canvas.height-35
            },
                width:20,
                height:15,
            color: "gray",
            velocity:.6
        })
    )
    if(farmerCount<cows.length)
        PushNew("Farmer");
    }
}

//Bird Components
class Bird extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color, neg, fix, newFix}){
        super({position, velocity, width, height, speed, friction, color});
        this.angle=rads(0);
        this.MaxH=this.position.y-20;
        this.MinH=this.position.y+20;
        this.alreadyHit=false;
        this.neg=neg;
        this.fix=fix;
        this.newFix=newFix;
        this.hitOnce=false;
        this.hitUFO=false;
    }

    drawDesign(middleX, middleY){
        //body
        c.beginPath();
        c.fillStyle="#d9d9d9";
        c.ellipse(middleX+this.width*(.55-this.fix)*this.neg, middleY+this.height*.25, this.width*.15, this.height*.25, rads(-45*this.neg), 0, rads(360));
        c.fill();
        c.beginPath();
        c.ellipse(middleX+this.width*(.60-this.fix)*this.neg, middleY+this.height*.5, this.width*.30, this.height*.1, rads(65*this.neg), 0, rads(360));
        c.fill();
        c.beginPath();
        c.ellipse(middleX+this.width*(.75-this.fix)*this.neg, middleY+this.height*.75, this.width*.25, this.height*.22, rads(-25*this.neg), 0, rads(360));
        c.fill();

        //beak
        c.beginPath();
        c.fillStyle="#ffd633";
        c.strokeStyle="#cca300";
        c.moveTo(middleX+this.width*(.40-this.fix)*this.neg, middleY+this.height*.1);
        c.quadraticCurveTo(middleX+this.width*(.15-this.fix)*this.neg, middleY+this.height*.1, middleX+this.width*this.fix, middleY+this.height*.15);
        c.quadraticCurveTo(middleX+this.width*(.15-this.fix)*this.neg, middleY, middleX+this.width*(.40-this.fix)*this.neg, middleY+this.height*.25);
        c.quadraticCurveTo(middleX+this.width*(.15-this.fix)*this.neg, middleY+this.height*.60, middleX+this.width*this.fix, middleY+this.height*.45);
        c.quadraticCurveTo(middleX+this.width*(.10-this.fix)*this.neg, middleY+this.height, middleX+this.width*(.40-this.fix)*this.neg, middleY+this.height*.75);
        c.quadraticCurveTo(middleX+this.width*(.40-this.fix)*this.neg, middleY+this.height*.30, middleX+this.width*(.55-this.fix)*this.neg, middleY+this.height*.10);
        c.fill();
        //legs
        c.moveTo(middleX+this.width*this.newFix, middleY+this.height);
        c.lineTo(middleX+this.width*(.95-this.fix)*this.neg, middleY+this.height*.92);
        c.stroke();
    }

    update(){
        if(!this.dead){
        this.BoarderCheck();
        this.Flap();
        this.drawImageRot(0);
        }
    }

    Flap(){
        this.position.x-=this.velocity.x;
        this.position.y+=this.velocity.y;
    }

    BoarderCheck(){
        //checks right side wall for when bird is moving to the right
        if(this.position.x+this.width/2-this.velocity.x>=canvas.width){
            this.velocity.x*=-1;
            this.neg=1;
            this.fix=0;
            this.newFix=1;
        }
        //checks left wall for when bird is moving to the left
        if(this.position.x-this.width/2-this.velocity.x<=CstartX){
            this.velocity.x*=-1;
            this.neg=-1;
            this.fix=1;
            this.newFix=0;
        }
        //checks the y value with max and min height to create flapping affect
        if(this.position.y<this.MaxH){
            this.velocity.y=Math.abs(this.velocity.y);
        }
        if(this.position.y>this.MinH){
            this.velocity.y=-this.velocity.y;
        }

        //checks collision between bird and ufo's stuff
        if(!this.hitUFO){
            if(checkCollision(gameObjects[0],this)){
                gameObjects[0].Hit(15);
                this.Gothit();
                this.hitUFO=true;
            }
        }else if(this.hitUFO){
            if((checkCollision(gameObjects[0],this)&&(!this.alreadyHit))){
                this.alreadyHit=true;
                this.resetHit();
                gameObjects[0].Hit(15);
            }
        }
    }

    hit(){
        if(!this.hitOnce){
            this.hitOnce=true;
            if(!this.hitUFO){
            this.Gothit();
            this.hitUFO=true;
            }
        }else if(this.hitOnce){
            var WT=2000;
            if(score>=14){
                WT=10000;
            }
            setTimeout(()=>{
                if(!boss){
                    PushNew("Bird");
                }
            },WT)
            this.dead=true;    
        }
    }

    async resetHit(){
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.alreadyHit=false;
    }

    Gothit(){
        this.velocity.x*=1.8;
        this.velocity.y*=1.8;
        this.MaxH-=10;
        this.MinH+=10;
    }
}

//FireWork Girl Components
class FireWorkGirl extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color, MoveTo, ID, RL}){
        super({position, velocity, width, height, speed, friction, color, ID});
        this.angle=0;
        this.GoTo=MoveTo;
        this.RL=RL; //true starts from right
    }

    update(){
            this.run();
            this.drawImageRot(0);
    }

    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="yellow";
        c.ellipse(middleX+this.width/2, middleY+this.height*.40, this.width/2, this.height*.40,0, 0,rads(360));
        c.fill(); 

        c.beginPath();
        c.fillStyle="pink";
        c.moveTo(middleX+this.width/10, (middleY+this.height/5));
        c.lineTo(middleX, middleY+this.height);
        c.lineTo(middleX+this.width, middleY+this.height);
        c.lineTo(middleX+this.width-this.width/10,middleY+this.height/5)
        c.fill();

        c.beginPath();
        c.fillStyle="tan";
        c.fillRect((middleX+this.width/5), middleY+this.height*.10, (this.width-this.width/2.5), this.height/4);
    }

    run(){
        if((this.RL)&&(this.position.x>=this.GoTo)){
            this.position.x-=this.velocity.x;
        }else if((!this.RL)&&(this.position.x<=this.GoTo)){
            this.position.x+=this.velocity.x;
        }else if(this.shoot){
            this.shoot=false;
            this.shootFireWork();
        }
    }


    hit(){
        var WT=5000;
        if(score>=14){
            WT=10000;
        }
        setTimeout(()=>{
            if(!boss){
                PushNew("FWG");
            }
        },WT)
        this.dead=true;
    }

    shootFireWork(){
    projectiles.push(
        new FireWork({
            position: {
                x: this.position.x,
                y: this.position.y-this.height/2
            },
            velocity:{
                x: 0,
                y: 0
            },
            width: 5,
            height:5,
            angle:0,
            color: "white",
            ID: this.ID
        })
    )
    }
}

//SuperHero Components
class SuperHero extends Sprite{
    constructor({position, velocity, width, height, speed, friction, color,ID}){
        super({position, velocity, width, height, speed, friction, color,ID});
        this.angle=0;
        this.target={
            x:gameObjects[0].position.x,
            y:gameObjects[0].position.y
        };
        this.point={
            x:this.position.x-this.width/2,
            y:this.position.y-this.height/2
        }
        this.pause=false;
        this.alreadyHit=false;
        this.JustStarting=true;
        this.AniPos=canvas.width;
        this.neg=1;
        this.rev=0;
        this.bounce=1;
        this.pos=-1;
        this.fixer=0;
        this.newFixer=this.width*.06;
        this.done=false;
        this.ID=ID;
        bossHealth=100;
    }

    drawDesign(middleX, middleY){
        if(bossHealth>=75){
            //phaze 1
            if(CircleSquare(gameObjects[0], this.position.x, this.position.y, 50,0 ,360)){
                this.GrabDraw(middleX, middleY);
            }else{this.LazerEyesDraw(middleX, middleY);}
        }else if(bossHealth>=50){
            //Phaze 2
            this.GrabDraw(middleX, middleY);
        }else if(bossHealth>=25){
            //Phaze 3
            this.FlyDraw(middleX, middleY);
            this.done=true;
        }else if(bossHealth>0){
            //Phaze 4
            if(!this.pause){
                this.GrabDraw(middleX, middleY);
            }else{
                this.LazerEyesDraw(middleX, middleY);
            }
        }
    }

    FlyDraw(middleX, middleY){
        c.beginPath();
        c.fillStyle="gold";
        c.moveTo(middleX+this.width*(.90-this.bounce)*this.pos, middleY+this.height);
        c.lineTo(middleX+this.width*(.40-this.bounce)*this.pos, middleY+this.height);
        c.lineTo(middleX+this.width*(.35-this.bounce)*this.pos, middleY+this.height*.20);
        c.lineTo(middleX+this.width*this.fixer, middleY+this.height*.24);
        c.fill();

        c.beginPath();
        c.strokeStyle="white";
        c.lineWidth=3;
        c.moveTo(middleX+this.width*(.40-this.bounce)*this.pos, middleY+this.height*.45);
        c.bezierCurveTo(middleX*this.pos, middleY+this.height*.60, middleX+this.width*(.40-this.bounce)*this.pos, middleY+this.height, middleX+this.width*(.10-this.bounce)*this.pos, middleY+this.height);
        c.stroke();

        c.beginPath();
        c.fillStyle="tan";
        c.fillRect(middleX+this.width*(.15-this.bounce)*this.pos, middleY+this.height*.05, this.width*(.60-this.bounce)-this.newFixer, this.height*.35);

        c.beginPath();
        c.fillStyle="black";
        c.ellipse(middleX+this.width*(.40-this.bounce)*this.pos, middleY+this.height*.40, this.width*.33, this.height*.05, rads(5*this.pos), 0, rads(360));
        c.ellipse(middleX+this.width*(.12-this.bounce)*this.pos, middleY+this.height*.22, this.width*.10, this.height*.22, rads(-5*this.pos), 0, rads(360));
        c.fill();c

        c.fillStyle="gold";
        c.fillRect(middleX+this.width*(.60-this.bounce)*this.pos, middleY, this.width*.20*this.pos, this.height/2);
    }

    GrabDraw(middleX, middleY){
        c.beginPath();
        c.fillStyle="tan";
        c.fillRect(middleX+this.width*.30, middleY+this.height*(.95-this.rev)*this.neg, this.width*.60, -this.height*.35*this.neg);

        c.beginPath();
        c.fillStyle="black";
        c.ellipse(middleX+this.width*.60, middleY+this.height*(.95-this.rev)*this.neg, this.width*.33, this.height*.05, -25, 0, rads(360));
        c.ellipse(middleX+this.width*.35, middleY+this.height*(.80-this.rev)*this.neg, this.width*.10, this.height*.18, rads(-5), 0, rads(360));
        c.fill();c

        c.beginPath();
        c.fillStyle="gold";
        c.moveTo(middleX+this.width*.95, middleY+this.height*(.61-this.rev)*this.neg);
        c.lineTo(middleX+this.width*.80, middleY*this.neg);
        c.lineTo(middleX+this.width*.30, middleY*this.neg);
        c.lineTo(middleX+this.width*.25, middleY+this.height*(.61-this.rev)*this.neg);
        c.fill();
        c.fillRect(middleX+this.width*.90, middleY+this.height*(.61-this.rev)*this.neg, this.width*.38,-this.height*.15*this.neg);

        c.beginPath();
        c.strokeStyle="white";
        c.lineWidth=3;
        c.moveTo(middleX+this.width*.28, middleY+this.height*(.61-this.rev)*this.neg);
        c.bezierCurveTo(middleX+this.width*.10, middleY+this.height*(.61-this.rev)*this.neg, middleX+this.width*.10, middleY*this.neg, middleX, middleY*this.neg);
        c.stroke();
    }

    LazerEyesDraw(middleX, middleY){
        c.beginPath();
        c.fillStyle="tan";
        c.fillRect(middleX+this.width*.30, middleY+this.height*(.95-this.rev)*this.neg, this.width*.60, -this.height*.35*this.neg);

        c.beginPath();
        c.fillStyle="black";
        c.ellipse(middleX+this.width*.60, middleY+this.height*(.95-this.rev)*this.neg, this.width*.33, this.height*.05, -25*this.neg, 0, rads(360));
        c.ellipse(middleX+this.width*.35, middleY+this.height*(.80-this.rev)*this.neg, this.width*.10, this.height*.18, rads(-5*this.neg), 0, rads(360));
        c.fill();

        c.beginPath();
        c.fillStyle="gold";
        c.moveTo(middleX+this.width*.95, middleY+this.height*(.61-this.rev)*this.neg);
        c.lineTo(middleX+this.width*.80, middleY*this.neg);
        c.lineTo(middleX+this.width*.30, middleY*this.neg);
        c.lineTo(middleX+this.width*.25, middleY+this.height*(.61-this.rev)*this.neg);
        c.fill();

        c.beginPath();
        c.strokeStyle="white";
        c.lineWidth=3;
        c.moveTo(middleX+this.width*.28, middleY+this.height*(.61-this.rev)*this.neg);
        c.bezierCurveTo(middleX+this.width*.10, middleY+this.height*(.61-this.rev)*this.neg, middleX+this.width*.10, middleY*this.neg, middleX, middleY*this.neg);
        c.stroke();
    }

    update(){
        this.target={
            x:gameObjects[0].position.x,
            y:gameObjects[0].position.y
        };
        //checks for which side SH needs to face
        var deg = Math.atan2((this.target.y-this.point.y),(this.target.x-this.point.x));
        if(this.target.x>this.position.x){
            this.point=rotatePoint(this.position.x, this.position.y, this.position.x+this.width/2+25, this.position.y-this.height*.4, deg);    
            this.neg=-1;
            this.rev=1;
            if(!this.done){
                this.bounce=0;
                this.pos=1;
                this.fixer=1;
                this.newFixer=0;
            }
        }else{
            this.point=rotatePoint(this.position.x, this.position.y, this.position.x+this.width/2+25, this.position.y+this.height*.4, deg);    
            this.neg=1;
            this.rev=0
        }

        //if health over 75%        
        if(this.JustStarting){
            freeze=true;
            this.getStarted();
        }else{
        if(bossHealth>=75){
        this.Phaze1();
        }else if(bossHealth>=50){
        //if health is below 75 and above 50
        this.Phaze2();
        }else if(bossHealth>=25){
        //if health is below 50 and above 25
        this.Phaze3();
        } else if(bossHealth>0){
        //if health is below 25 and above 0
        this.Phaze4();
        }else if(bossHealth<=0){
        screenManager=2;
        }else{
            boss=false;
        }
        }
    }

    getStarted(){
        if(this.position.x<this.AniPos){
            this.AniPos-=3;
            c.save();
            c.translate(this.AniPos, this.position.y);
            c.rotate(rads(270));
            this.FlyDraw(this.width / 2 * (-1),this.height / 2 * (-1));
            c.restore();
        }else{
            this.drawImageRot(this.follow());
            this.JustStarting=false;
        }
    }

    follow(){
        var deg = Math.atan2((this.target.y-(this.position.y)),(this.target.x-(this.position.x)));
        this.angle=deg;
        deg*=180/Math.PI;
        return deg;
    }

    Phaze1(){
        this.drawImageRot(this.follow());
        //shoots lazer towards ufo unless ufo gets close then hits ufo
        if(CircleSquare(gameObjects[0], this.position.x, this.position.y, 50,0 ,360)){
            this.throwUFO();
        }else if(this.shoot){
            this.Shoot();
            }
    }

    Phaze2(){
        //Flys towards Ufo, if reached throws towards center of map waits then moves towards him again
        if(!gameObjects[0].thrown){
        this.velocity={
            x: Math.cos(this.angle)*6,
            y: Math.sin(this.angle)*6
        }
        }else{
        this.velocity={
            x: 0,
            y: 0 
        }
    }
        this.drawImageRot(this.follow());
        if(!CircleSquare(gameObjects[0], this.position.x, this.position.y, 40 ,0 ,360)){
            this.position.y+=this.velocity.y;
            this.position.x+=this.velocity.x;
        }else if(!gameObjects[0].thrown){
            this.throwUFO();
        }

    }

    Phaze3(){
        //Flys quickly bouncing off all sides of the map using same bounderies as the ufo
            if(this.position.y+this.velocity.y+this.height/2>=canvas.height-50){
                this.velocity.y=-8;
            }
            if(this.position.y+this.velocity.y-this.height/2<=CstartY){
                this.velocity.y=8;
            }
            if(this.position.x+this.width/2+this.velocity.x>=canvas.width){
                this.velocity.x=-8;
                this.bounce=1;
                this.pos=-1;
                this.fixer=0;
                this.newFixer=this.width*.10;
            }
            if(this.position.x-this.width/2+this.velocity.x<=CstartX){
                this.velocity.x=8;
                this.bounce=0;
                this.pos=1;
                this.fixer=1;
                this.newFixer=0;
            }
            this.position.y+=this.velocity.y;
            this.position.x+=this.velocity.x;
            this.angle=Math.atan2(this.velocity.y, this.velocity.x);
            this.angle*=180/Math.PI;
            this.drawImageRot(this.angle+90);
            if((checkCollision(this,gameObjects[0]))&&(!this.alreadyHit)){
                this.alreadyHit=true;
                this.resetHit();
                gameObjects[0].Hit(20);
            }
    }

    Phaze4(){
        //Flys to ufo throws it and stops there, when stopped shoot lazers
        this.velocity={
            x: Math.cos(this.angle)*6,
            y: Math.sin(this.angle)*6
        }
        this.drawImageRot(this.follow());

        if((!CircleSquare(gameObjects[0], this.position.x, this.position.y, 50,0 ,360))&&(!this.pause)){
            this.position.y+=this.velocity.y;
            this.position.x+=this.velocity.x;
        }else{
            //stop and shoot
            if((!gameObjects[0].thrown)&&(!this.pause)){
                this.throwUFO();
            }else if(this.shoot){
                this.P4Shoot();
            }
            this.pause=true;
        }
    }

    throwUFO(){
        //changes ufo velocity towards middle of map halting controls till its moved a little bit
        gameObjects[0].Hit(20);
        var clone=Object.assign({}, gameObjects[0].position);
        gameObjects[0].startpoint=clone; 
        gameObjects[0].angle=Math.atan2((canvas.height/2-(gameObjects[0].position.y)),(canvas.width/2-(gameObjects[0].position.x)));
        gameObjects[0].velocity={
            x: Math.cos(gameObjects[0].angle)*15,
            y: Math.sin(gameObjects[0].angle)*15
        }
        gameObjects[0].thrown=true;  
    }
    
    Shoot(){
        var deg = Math.atan2((this.target.y-(this.point.y)),(this.target.x-(this.point.x)));
        this.shoot=false;
        const velocity={
            x: Math.cos(deg)*15,
            y: Math.sin(deg)*15
        }
        projectiles.push(
            new LazerEyes({
                position: this.point,
                velocity: velocity,
                width: 100,
                height:1,
                angle:deg,
                color: "yellow",
                ID: this.ID
            })
        )
    }  

    hit(){
            bossHealth-=10;
    }

   async P4Shoot(){
        await new Promise(resolve => setTimeout(resolve, 1000));
        if(this.shoot){
            this.Shoot();
            }
            this.pause=false;
    }

    async resetHit(){
        await new Promise(resolve => setTimeout(resolve, 500));
        this.alreadyHit=false;
    }
}

var MotherShip={
    position:{
        x: canvas.width/2, 
        y: 0
    },
    velocity: 2,
    freeze:false,
    health:100,
    update: function() {
        if(!boss){
        //logic
        if(!this.freeze){
            if(CircleSquare(gameObjects[0],this.position.x, this.position.y+40, 20, 0, 360)){
                this.freeze=true;
                if(gameObjects[0].cowCount>0){
                MSTrip++;
                score+=gameObjects[0].cowCount;
                gameObjects[0].cowCount=0;
                }
            }
            if((this.position.x+80+this.velocity>=canvas.width)||(this.position.x-80+this.velocity<=CstartX)){
                this.velocity*=-1
            }
            this.position.x+=this.velocity;
        }else{
            if(!(CircleSquare(gameObjects[0],this.position.x, this.position.y+40, 20, 0, 360))){
                this.freeze=false;
            }
        }

        //design
        c.beginPath();
        c.fillStyle="grey";
        c.fillRect(this.position.x-80, this.position.y, 160, 60);
        c.fillStyle="purple";
        c.arc(this.position.x, this.position.y+40, 20, 0, rads(360));
        c.fill();
    }
    }

};

//All PROJECTILES
class Projectiles{
    constructor({position, velocity,angle,width, height,color, ID}){
        this.position=position;
        this.width=width;
        this.height=height;
        this.velocity=velocity;
        this.angle=angle;
        this.color=color;
        this.hitSomething=false;
        this.ID=ID
        this.startingPos={...position};
    }
    
    draw(){
        c.save();
        c.translate(this.position.x, this.position.y);
        c.fillStyle = this.color;
        c.rotate(this.angle)
        if(hitbox){
        c.fillRect(-this.width /2, -this.height /2, this.width, this.height);
        }
        this.drawDesign(-this.width /2, -this.height /2);
        c.restore();
    }

    drawDesign(middleX, middleY){
        //place holder
    }

    update(){
        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
        this.kill();
        this.draw();
        this.check_hit();
    }

    kill(){
        if(((this.position.x<CstartX)||(this.position.x>canvas.width))||((this.position.y<CstartY)||(this.position.y>canvas.height))){
            this.shootAgain(0);
            this.hitSomething=true;
        }
    }

    shootAgain(delay){
        gameObjects.forEach((object)=>{  
            if(object.ID==this.ID){
                setTimeout(function(){
                    this.hitSomething=true;
                    object.shoot=true;
                },delay);
            }
        })
    }
}

class Lazer extends Projectiles{
    constructor({position, velocity,angle,width, height,color, ID}){
        super({position, velocity,angle,width, height,color, ID});
    }

    drawDesign(middleX, middleY){
        c.fillRect(middleX, middleY, this.width, this.height);
    }

    check_hit(){
        gameObjects.forEach((object)=>{
            if(checkCollision(object, this)){
                object.hit();
                this.shootAgain(1000);
                this.hitSomething=true;
            }
        })
    }
}

class Bullet extends Projectiles{
    constructor({position, velocity,angle,width, height,color,ID}){
        super({position, velocity,angle,width, height,color,ID});
    }

    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="black";
        c.moveTo(middleX,middleY);
        c.quadraticCurveTo(middleX+this.width*.65, middleY-this.height/4,middleX+this.width, middleY+this.height/2); 
        c.quadraticCurveTo(middleX+this.width*.65, middleY+this.height+this.height/4,middleX, -middleY); 
        c.lineTo(middleX, middleY);
        c.fill();
    }
    
    check_hit(){
        if(checkCollision(this,gameObjects[0])){
            gameObjects[0].Hit(10);
           this.hitSomething=true;
           this.shootAgain(1000);
        }else if((CircleSquare(this,gameObjects[0].position.x, gameObjects[0].position.y,40, SheildAngStart, SheildAngEnd))&&(gameObjects[0].sheildHealth>0)){
           this.hitSomething=true;
            this.shootAgain(10)
        }
    }
}

class Rock extends Projectiles{
    constructor({position, velocity,angle,width, height,color,ID}){
        super({position, velocity,angle,width, height,color,ID});
    }

    kill(){
        if(((this.position.x<CstartX)||(this.position.x>canvas.width))||(this.position.y>canvas.height)){
            this.shootAgain(0);
            this.hitSomething=true;
        }
    }

    drawDesign(middleX, middleY){
        c.fillRect(middleX, middleY, this.width, this.height);
    }

    check_hit(){
        if(checkCollision(this,gameObjects[0])){
            gameObjects[0].Hit(10);
           this.hitSomething=true;
           this.shootAgain(1000);
        }else if((CircleSquare(this,gameObjects[0].position.x, gameObjects[0].position.y,40, SheildAngStart, SheildAngEnd))&&(gameObjects[0].sheildHealth>0)){
           this.hitSomething=true;
            this.shootAgain(10)
        }
    }

    update(){
        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
        this.velocity.y+=.05;
        this.kill();
        this.draw();
        this.check_hit();
    }
}

class ShotGun extends Projectiles{
    constructor({position, velocity,angle,width, height,color,ID}){
        super({position, velocity,angle,width, height,color,ID});
    }

    drawDesign(middleX, middleY){
        c.beginPath();
        c.fillStyle="black";
        c.moveTo(middleX,middleY);
        c.quadraticCurveTo(middleX+this.width*.65, middleY-this.height/4,middleX+this.width, middleY+this.height/2); 
        c.quadraticCurveTo(middleX+this.width*.65, middleY+this.height+this.height/4,middleX, -middleY); 
        c.lineTo(middleX, middleY);
        c.fill();
    }
    
    check_hit(){
        if(checkCollision(this,gameObjects[0])){
           this.hitSomething=true;
           gameObjects[0].Hit(0.5);
        }else if((CircleSquare(this,gameObjects[0].position.x, gameObjects[0].position.y,40, SheildAngStart, SheildAngEnd))&&(gameObjects[0].sheildHealth>0)){
           this.hitSomething=true;
        }
    }

    kill(){
        const distance=Math.sqrt(Math.pow(this.startingPos.x - this.position.x, 2) + Math.pow(this.startingPos.y - this.position.y, 2));
        if(distance >=400){
            this.hitSomething=true;
        }
    }
}

class FireWork extends Projectiles{
    constructor({position, velocity,angle,width, height,color,ID}){
        super({position, velocity,angle,width, height,color, ID});
        this.velocity.y=-6;
        this.velocity.x=Math.random() * 2 + -1;
        this.maxHeight=Math.random() * (300 - 200) + 200;
        this.boom=false;
        this.hitUFO=false;
        this.particles=[];
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256); 
        const b = Math.floor(Math.random() * 256); 
        this.rgbColor=`rgb(${r}, ${g}, ${b})`;
        this.radius=125;
        this.delay=false;
        }
    
    update(){
        if(this.boom){
            this.Boom();
        }else{
            this.changeV();
            this.draw();
        }
    }

    drawDesign(middleX, middleY){
        c.fillStyle="red";
        c.beginPath();
        c.moveTo(middleX+this.width/2, middleY);
        c.lineTo(middleX+this.width+this.width*.30, middleY+this.height/2);
        c.lineTo(middleX+this.width*.9, middleY+this.height/2);
        c.lineTo(middleX+this.width*.7, middleY+this.height);
        c.lineTo(middleX+this.width*.1, middleY+this.height);
        c.lineTo(middleX+this.width*.7, middleY+this.height/2);
        c.lineTo(middleX-this.width*.3, middleY+this.height/2);
        c.fill();

        c.beginPath();
        c.strokeStyle="white";
        c.moveTo(middleX+this.width*.3, middleY+this.height);
        c.lineTo(middleX+this.width*.1, middleY+this.height*2);
        c.stroke();
    }

    changeV(){
        if((this.position.y+this.velocity.y<=this.maxHeight)){
            this.explode();
        }else{
            if((CircleSquare(this,gameObjects[0].position.x, gameObjects[0].position.y,40, SheildAngStart, SheildAngEnd))&&(gameObjects[0].sheildHealth>0)){
                this.hitSomething=true; 
                this.shootAgain(1000);
            }else if(checkCollision(gameObjects[0],this)){
                this.explode();
                gameObjects[0].Hit(10);
            }
            this.position.x+=this.velocity.x;
            this.position.y+=this.velocity.y;  
        }
    }

    explode(){
        this.boom=true;
        for (let i = 0; i < 750; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = new Particle(this.position.x, this.position.y, this.rgbColor, angle);
            this.particles.push(particle);
          }
    }

    Boom(){
        if(hitbox){
        c.beginPath();
        c.arc(this.position.x,this.position.y,125,0,rads(360)); 
        c.fillStyle="orange";
        c.fill();  
        }
        this.particles.forEach((particle, element)=>{
            particle.update();
            particle.draw();
            const partDistance=Math.sqrt(Math.pow(particle.x-this.position.x, 2) + Math.pow(particle.y-this.position.y, 2));;
            if ( partDistance >= this.radius) {
                this.particles.splice(element, 1);
              }
           })
        if((CircleSquare(gameObjects[0],this.position.x, this.position.y,this.radius, 0,360))&&(!this.hitUFO)){
            this.hitUFO=true;
            gameObjects[0].Hit(10);
        }
        if(!this.delay){
            this.delay=true;
            this.shootAgain(2500);
            setTimeout(()=>{
                this.hitSomething=true;
            },2000)
        }
    }

}

class LazerEyes extends Projectiles{
    constructor({position, velocity,angle,width, height,color,ID}){
        super({position, velocity,angle,width, height,color,ID});
    }
    
    drawDesign(middleX, middleY){
        c.fillRect(middleX, middleY, this.width, this.height);
    }

    check_hit(){
        if(checkCollision(this,gameObjects[0])){
            gameObjects[0].Hit(10);
           this.hitSomething=true;
           this.shootAgain(1000);
        }else if((CircleSquare(this,gameObjects[0].position.x, gameObjects[0].position.y,40, SheildAngStart, SheildAngEnd))&&(gameObjects[0].sheildHealth>0)){
           this.hitSomething=true;
            this.shootAgain(10)
        }
    }
}

// Particle class for firework
class Particle {
    constructor(x, y, color, angle) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.angle = angle;
      this.speed = Math.random() * (3 - 0.1) + 0.1; // Random speed
      this.gravity = 0; // Gravity force
      this.alpha = 1; // Particle opacity
    }
  
    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
    }
  
    draw() {
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, 1, 0, Math.PI * 2);
      c.fill();
    }
}

//Function for adding new repeatable game elements
function PushNew(newObject){
    let newOb=newObject;
    let neg=0;
    let position=0;
    let velocity=0;
    if(newOb=="UFO"){
        gameObjects.push(new UFO({
            position: {
            x: canvas.width/2,
            y: canvas.height/2
        },
        velocity:{
            x: 0,
            y: 0
        },
            width:45,
            height:35,
        speed: 8,
        friction: .899,
        color: "green",
        ID: uniqueIdentity
        }))
        uniqueIdentity++;
    }
    if(newOb=="Farmer"){
        //random spawn in logic
        if(randomChance(.5)){
            //respawns on the left side
            position=Math.random() * (135 - 35) + 35;
            neg=1;
        }else{
            //respawns on the right side
            position=Math.random() * (1065 - 1165) + 1165;
            neg=-1;
        }
        const randomValue =Math.floor(Math.random() * 3);
        //pushes new object
        if (randomValue === 0) {
            gameObjects.push(new Gun_Farmer({
                position:{
                    x: position,
                    y: canvas.height-20
                },
                    width:12.5,
                    height:30,
                color: "grey",
                ID: uniqueIdentity,
                neg: neg
            }))
            uniqueIdentity++;
        } else if (randomValue === 1) {
            gameObjects.push(new ShotGun_Farmer({
                position:{
                    x: position,
                    y: canvas.height-20
                },
                    width:12.5,
                    height:30,
                color: "grey",
                ID: uniqueIdentity,
                neg: neg
            }))
            uniqueIdentity++;
        } else {
            gameObjects.push(new Rock_Farmer({
                position:{
                    x: position,
                    y: canvas.height-20
                },
                    width:12.5,
                    height:30,
                color: "grey",
                ID: uniqueIdentity,
                neg: neg
            }))
            uniqueIdentity++;
        }
    }
    if(newOb=="Bird"){
        let fix;
        let newFix;
        if(randomChance(.5)){
            //Respawns on right side
            position=canvas.width-20;
            velocity=3.5;
            neg=1;
            fix=0;
            newFix=1;
        }else{
            //Respawns on left side
            position=20;
            velocity=-3.5;
            neg=-1;  
            fix=1;
            newFix=0;
        }

        gameObjects.push(new Bird({   
            position: {
            x: position,
            y: 250
        },
        velocity:{
            x: velocity,
            y: 1
        },
            width:35,
            height:20,
        color: "grey",
        neg: neg,
        fix:fix,
        newFix: newFix 
        }))
    }
    if(newOb=="FWG"){
        let GoTo;
        let RL;
        if(randomChance(.5)){
            //starts on left
            GoTo=Math.random() * (450 - 350) + 350;
            position=CstartX;
            RL=false;
        }else{
            //starts on right
            GoTo=Math.random() * (850 - 750) + 750;
            position=canvas.width;    
            RL=true;
        }
        
        gameObjects.push(new FireWorkGirl({   
            position: {
            x: position,
            y: canvas.height-15
        },
        velocity:{
            x: 5,
            y: 0
        },
            width:14,
            height:18,
        color: "grey",
        MoveTo: GoTo,
        ID: uniqueIdentity,
        RL:RL
        }))
        uniqueIdentity++;
    }
    if(newObject=="SH"){
        gameObjects.push(new SuperHero({   
            position: {
            x: canvas.width/1.2,
            y: 100
        },
        velocity:{
            x: 0,
            y: 0
        },
            width:32,
            height:55,
            speed:8,
            friction:.9,
        color: "purple",
        ID:uniqueIdentity
        }))
        uniqueIdentity++;
    }
}
  
//COLLISION DETECTION CODE 
{
    // check if two rectangles are colliding using the Separating Axis Theorem (SAT)
    function checkCollision(rect1, rect2) {
        const rect1Vertices = getVertices(rect1);
        const rect2Vertices = getVertices(rect2);
        const axes = [];
          
          // get the normal vectors of the edges of each rectangle
          for (let i = 0; i < rect1Vertices.length; i++) {
            const j = (i + 1) % rect1Vertices.length;
            const normalVector = getNormalVector(rect1Vertices[i], rect1Vertices[j]);
            axes.push(normalVector);
          }
            for (let i = 0; i < rect2Vertices.length; i++) {
              const j = (i + 1) % rect2Vertices.length;
              const normalVector = getNormalVector(rect2Vertices[i], rect2Vertices[j]);
              axes.push(normalVector);
            }
                
            // project the vertices of both rectangles onto each axis and check for overlap
              for (let i = 0; i < axes.length; i++) {
                const axis = axes[i];
                let rect1Min = Infinity;
                let rect1Max = -Infinity;
                let rect2Min = Infinity;
                let rect2Max = -Infinity;
                  
                for (let j = 0; j < rect1Vertices.length; j++) {
                  const dot = dotProduct(rect1Vertices[j], axis);
                  rect1Min = Math.min(rect1Min, dot);
                  rect1Max = Math.max(rect1Max, dot);
                }
                  
                  for (let j = 0; j < rect2Vertices.length; j++) {
                    const dot = dotProduct(rect2Vertices[j], axis);
                    rect2Min = Math.min(rect2Min, dot);
                    rect2Max = Math.max(rect2Max, dot);
                  }
                    if (rect1Max < rect2Min || rect2Max < rect1Min) {
                      // no overlap on this axis, so the rectangles are not colliding
                      return false;
                    }
              }
                
                // if we've made it this far, the rectangles are colliding
                return true;
      }

    // get the vertices of a rectangle
    function getVertices(rect) {
       // console.log(rect);
        const sin = Math.sin(rect.angle);
        const cos = Math.cos(rect.angle);
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        //console.log(rect.position.x, rect.position.y,hw, hh, rect.angle, sin, cos);
        return [
          { x: rect.position.x + (cos * -hw) - (sin * -hh), y: rect.position.y + (sin * -hw) + (cos * -hh)},
          { x: rect.position.x + (cos * hw) - (sin * -hh), y: rect.position.y + (sin * hw) + (cos * -hh)},
          { x: rect.position.x + (cos * hw) - (sin * hh), y: rect.position.y + (sin * hw) + (cos * hh)},
          { x: rect.position.x + (cos * -hw) - (sin * hh), y: rect.position.y + (sin * -hw) + (cos * hh)}
        ];
    }
              
    // get the normal vector of a line segment
    function getNormalVector(p1, p2) {
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        const length = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
        return { x: -edge.y / length, y: edge.x / length };
    }

    // Calculate the dot product of two vectors
    function dotProduct(a, b) {
                return a.x * b.x + a.y * b.y;
    }

//Simpilar collision detection for non rotated rects
function CheckAABBCollision(rect1, rect2){
    if(rect1.position.x-rect1.width/2 < rect2.position.x + rect2.width/2 &&
        rect1.position.x + rect1.width/2 > rect2.position.x-rect2.width/2 &&
        rect1.position.y-rect1.height/2 < rect2.position.y + rect2.height/2 &&
        rect1.position.y + rect1.height/2 > rect2.position.y-rect2.height/2)
    {
        return true;
    }
    return false;
}

//collision detection for Circles and squares
function CircleSquare(rect, circleX, CircleY, radius, startAngle, endAngle){
        const vertices = getVertices(rect);
        let SA=rads(startAngle);
        let EA=rads(endAngle);
    for (let i = 0; i < vertices.length; i++) {
        let dx = vertices[i].x-circleX;
        let dy = vertices[i].y-CircleY;
        let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= radius) {
        let angle = Math.atan2(dy, dx);
        if(angle<0){
            angle+=2*Math.PI;
        }
       // console.log(angle.toFixed(3), SA.toFixed(3), EA.toFixed(3));
        if (angle >= SA && angle <= EA) {
          return true;
        }
      }
    }
    return false;
 }
}
//END OF COLLISION DETECTION CODE

//All key Inputs
{
window.addEventListener('keydown', function(e) {
    keys[e.key]=true;
});
window.addEventListener('keyup', function (e){
    keys[e.key]=false;
});
window.addEventListener('mousedown', function (e){
clicks[e.button]=true;
})
window.addEventListener('mouseup', function (e){
clicks[e.button]=false;
})
window.addEventListener('mousemove', function (e){
    mouseX=e.clientX-c.canvas.offsetLeft;
    mouseY=e.clientY-c.canvas.offsetTop;
})

}

//degs to rad
function rads(deg){
    var rad = deg * Math.PI / 180;
    return rad;
}

//Rotates a point around another point
function rotatePoint(aroundX, aroundY, PointX, PointY, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = cos * (PointX - aroundX) - sin * (PointY - aroundY) + aroundX;
    const y = cos * (PointY - aroundY) + sin * (PointX - aroundX) + aroundY;
    return { x, y };
}

//returns true or false based on the odds given 0-1 ex: if .8 is given 80% chance of being true
function randomChance(odds){
    return Math.random() < odds;
}

function checkForCow(beam){
    cows.forEach((cow, element)=>{
        if(CheckAABBCollision(beam, cow)){
            gameObjects[0].cowCount++;
            cows.splice(element,1);
            if(cows.length==0){
                setTimeout(() => {
                    CowReset();
                }, waitTime);
            }
        }
    })
}

function CowReset(){
    cows.push(
        new Cow({    
            position:{
            x:Math.random() * (canvas.width*.8 - canvas.width*.2) + canvas.width*.2,
            y:canvas.height-35
        },
            width:20,
            height:15,
        color: "gray",
        velocity:.6
    })
)
}

//UI overlays
function UI(){
    c.fillStyle="red";
    if(gameObjects[0].health>0){
    c.fillRect(5, 5, gameObjects[0].health*2, 4);
    }else{
        //defeat
        screenManager=3;
        c.fillRect(5, 5, 1, 4);
    }

    if((boss)&&(bossHealth>=0)){
        c.fillRect(canvas.width/2, 7, bossHealth*3, 10);
        c.fillRect(canvas.width/2, 7, -bossHealth*3, 10);
    }
    c.fillStyle="blue";
    if(gameObjects[0].sheildHealth>0){
        c.fillRect(5, 10, gameObjects[0].sheildHealth*2, 4);
    }else{
        c.fillRect(5, 10, 1, 4);
    }

    c.fillStyle="#331400";
    c.fillRect(5, 15, Math.round((gameObjects[0].cowCount / 3) * 199 + 1), 4);

    c.font="30px Impact";
    c.fillStyle="#ffff99";
    c.fillText(score, canvas.width-32, 30);
}

//draws shitty background lol
function GameBackgroundDraw(){
//     const gradient = c.createLinearGradient(0, canvas.height, 0, 0);
//    if((1-(score/15)*1)<0.65){
//     if((1.35-(score/15)*1.35)>0){
//     gradient.addColorStop(1.35-(score/15)*1.35, "#081d2b"); 
//     }
//     if((1-(score/15)*1)<0.3){
//         if((1.7-(score/20)*1.7)>0){    
//         gradient.addColorStop(1.7-(score/20)*1.7, "#040f16"); 
//         }else{
//             gradient.addColorStop(0, "#0a001a"); 
//         }
//     }
//    }
//    if((1-(score/15)*1)>0){
//    gradient.addColorStop(1-(score/15)*1, "#0c2b3f"); 
//    }
//    if((.7-(score/14)*.7)>0){
//     gradient.addColorStop(.7-(score/14)*0.7, "#1d4060");
//     }
//     if((.4-(score/13)*.4)>0){
//     gradient.addColorStop(.4-(score/13)*0.4, "#386fa4"); 
//     }
//     if((.2-(score/12)*.2)>0){
//     gradient.addColorStop(0.2-(score/12)*0.2, "#5cb2d9");
//     }
    c.beginPath();
    c.fillStyle="#386fa4";
    c.fillRect(CstartX, CstartY ,canvas.width, canvas.height);

    c.beginPath();
    c.fillStyle="#009900";
    c.moveTo(0, canvas.height-20);
    c.quadraticCurveTo(canvas.width/2, canvas.height*.9,canvas.width, canvas.height-20);
    c.fill();
    c.fillRect(CstartX, canvas.height-20, canvas.width, canvas.height);
    c.fillStyle="#008000";
    c.fillRect(CstartX, canvas.height-10, canvas.width, 10);
    c.closePath();
}

function WriteUFO(StrokeColor, fillColor, x, y){
    //U
    c.beginPath();
    c.fillStyle = fillColor; 
    c.strokeStyle=StrokeColor;
    c.moveTo(x,y);
    c.lineTo(x+20, y+80);
    c.lineTo(x+40, y+100);
    c.lineTo(x+90, y+100);
    c.lineTo(x+110, y+80);
    c.lineTo(x+130, y);
    c.lineTo(x+100, y);
    c.lineTo(x+90, y+65);
    c.lineTo(x+80, y+75);
    c.lineTo(x+55, y+75);
    c.lineTo(x+45, y+65);
    c.lineTo(x+30, y);
    c.lineTo(x, y);
    c.stroke();
    c.fill();

    //F
    x+=135;
    c.moveTo(x,y)
    c.lineTo(x,y+100);
    c.lineTo(x+40, y+100);
    c.lineTo(x+40, y+75);
    c.lineTo(x+100, y+75);
    c.lineTo(x+100, y+50);
    c.lineTo(x+45, y+50)
    c.lineTo(x+45, y+30);
    c.lineTo(x+130, y+30);
    c.lineTo(x+130, y);
    c.lineTo(x, y);
    c.stroke();
    c.fill();

//O
    x+=165;
    c.beginPath();
    c.moveTo(x,y)
    c.lineTo(x+70,y);
    c.lineTo(x+100, y+25);
    c.lineTo(x+100, y+75);
    c.lineTo(x+70, y+100);
    c.lineTo(x, y+100);
    c.lineTo(x-30, y+75)
    c.lineTo(x-30, y+75);
    c.lineTo(x-30, y+25);
    c.lineTo(x, y);
    c.stroke();

    y+=25;
    c.moveTo(x,y)
    c.lineTo(x+70,y);
    c.lineTo(x+70,y+50);
    c.lineTo(x,y+50);
    c.lineTo(x,y);
    c.stroke();
    c.fill("evenodd");
    

}

function DrawUFO(){
    //UFO ship
    c.beginPath();
    c.fillStyle="gray";
    c.strokeStyle="black";
    c.beginPath();
    c.ellipse(canvas.width/2, CstartY+80, 500, 40, 0, 0, rads(360));
    c.ellipse(canvas.width/2, CstartY+85, 450, 70, 0, 0, rads(180));
    c.fill();
    c.beginPath();
    c.ellipse(canvas.width/2, CstartY+80, 500, 20, 0, 0, rads(180));
    c.stroke();
    c.beginPath();
    c.ellipse(canvas.width/2, CstartY+50, 100, 50, 0, 0, rads(180),true);
    c.ellipse(canvas.width/2, CstartY+50, 100, 20, 0, 0, rads(180));
    c.fillStyle="#ccffff";
    c.fill();


    //UFO's beam
    c.beginPath();
    c.fillStyle="#cc33ff";
    c.strokeStyle="#e699ff";
    c.lineTo(canvas.width/2+50, canvas.height/2-200);
    c.lineTo(canvas.width/2+290,canvas.height/2-20);
    c.lineTo(canvas.width/2-290,canvas.height/2-20);
    c.lineTo(canvas.width/2-50, canvas.height/2-200);
    c.lineTo(canvas.width/2+50, canvas.height/2-200);
    c.stroke();
    c.fill();

    c.beginPath();
    c.fillStyle="#c61aff";
    c.ellipse(canvas.width/2, canvas.height/2, 300, 75, 0, 0, rads(360));
    c.fill();
    c.stroke();

    c.beginPath();
    c.fillStyle="#d24dff";
    c.ellipse(canvas.width/2, canvas.height/2-200, 50, 10, 0, 0, rads(360));
    c.fill();
    c.stroke();

}

//Start screen stuff
function startScreen(){
    //Background
    const gradient = c.createRadialGradient(canvas.width/2, canvas.height, 0, canvas.width/2, canvas.height, canvas.height);
    gradient.addColorStop(0, "#191970"); 
    gradient.addColorStop(0.1, "#4b0082"); 
    gradient.addColorStop(0.5, "#330033"); 
    gradient.addColorStop(1, "#000000"); 
    c.beginPath();
    c.fillStyle=gradient;
    c.fillRect(CstartX, CstartY ,canvas.width, canvas.height);

    //Draw UFO ship
    DrawUFO();

    //Creates "UFO"
    WriteUFO("black", "black", canvas.width/2-200, canvas.height/2-40);
    WriteUFO("black", "green", canvas.width/2-210, canvas.height/2-50);

    //brings back button
    buttonElement.style.display = "block";

    if(keys['w']){
        keyW.classList.add('active');
    }else{
        keyW.classList.remove('active');
    }
    if(keys['a']){
        keyA.classList.add('active');
    }else{
        keyA.classList.remove('active');
    }
    if(keys['s']){
        keyS.classList.add('active');
    }else{
        keyS.classList.remove('active');
    }
    if(keys['d']){
        keyD.classList.add('active');
    }else{
        keyD.classList.remove('active');
    }
    if(keys[' ']){
        Space.classList.add('active');
    }else{
        Space.classList.remove('active');
    }

    if(clicks['0']){
        leftClickButton.classList.add('clicked');
    }else{
        leftClickButton.classList.remove('clicked');
    }
    if(clicks['2']){
        rightClickButton.classList.add('clicked');
    }else{
        rightClickButton.classList.remove('clicked');
    }
}


//Win screen stuff
function winScreen(){
    const gradient = c.createRadialGradient(canvas.width/2, canvas.height, 0, canvas.width/2, canvas.height, canvas.height);
    //change colors
    gradient.addColorStop(0, "#4d79ff"); 
    gradient.addColorStop(0.1, "#0040ff"); 
    gradient.addColorStop(0.5, "#001a66"); 
    gradient.addColorStop(1, "#000000"); 
    c.beginPath();
    c.fillStyle=gradient;
    c.fillRect(CstartX, CstartY ,canvas.width, canvas.height);

    //draws ufo ship
    DrawUFO();
    
    //score
    c.font="50px Impact";
    c.fillStyle="#e580ff";
    c.fillText("WIN SCORE: "+score, canvas.width/2-127, canvas.height-307);
    c.fillStyle="black";
    c.fillText("WIN SCORE: "+score, canvas.width/2-130, canvas.height-310);

        //brings back button
        buttonElement.style.display = "block";
}

//Lose screen stuff
function LScreen(){
    const gradient = c.createRadialGradient(canvas.width/2, canvas.height, 0, canvas.width/2, canvas.height, canvas.height);
    //change colors
    gradient.addColorStop(0, "#ff4d4d"); 
    gradient.addColorStop(0.1, "#ff0000"); 
    gradient.addColorStop(0.5, "#cc0000"); 
    gradient.addColorStop(1, "#000000"); 
    c.beginPath();
    c.fillStyle=gradient;
    c.fillRect(CstartX, CstartY ,canvas.width, canvas.height);

    //draws ufo ship
    DrawUFO();
    
    //score
    c.font="50px Impact";
    c.fillStyle="#e580ff";
    c.fillText("LLLLL SCORE: "+score, canvas.width/2-127, canvas.height-307);
    c.fillStyle="black";
    c.fillText("LLLLL SCORE: "+score, canvas.width/2-130, canvas.height-310);

        //brings back button
        buttonElement.style.display = "block";
}

//frame updates
function animate(){
    if(screenManager==0){
        startScreen();
    }else if(screenManager==1){ 
        //background 
        GameBackgroundDraw();
        //all game objects 
        animateGameObejcts();
        //Health Bar and Score
        UI();
    }else if(screenManager==2){
        winScreen();
    }else if(screenManager==3){
        LScreen();
    }
    window.requestAnimationFrame(animate);
}

let FWG_GO=true;
let PushStart=false;
let insertBoss=false;
//dictates what game objects are being pushed into game 
function gameManager(){
    if(!PushStart){
        PushStart=true;
        PushNew("Farmer");
        PushNew("Bird");
    }
    if(FWG_GO&&MSTrip>0){
        FWG_GO=false;
        PushNew("FWG");
    }
    if(!insertBoss&&MSTrip==5){
        boss=true;
        insertBoss=true;
        PushNew("SH");
    }

}

//Updates different game elements based on different factors 
function animateGameObejcts(){
    MotherShip.update();
    gameObjects.forEach((object, element)=>{
        object.update();
        if(object.dead){
            gameObjects.splice(element, 1);
        }
    })
    projectiles.forEach((proj, element)=>{
        proj.update();
        if(proj.hitSomething){
            projectiles.splice(element, 1);
        }
    })
    cows.forEach((cow)=>{
        cow.update();
    })

    gameManager();
}

//game start function
function GameStart(){
    uniqueIdentity=0;
    gameObjects.length=0;
    projectiles.length=0;
    cows.length=0;
    FWG_GO=true;
    PushStart=false;
    insertBoss=false;
    MSTrip=0;
    PushNew("UFO");
    CowReset();
    freeze=false;
    farmerCount=0;
    score=0;
    boss=false;
    bossHealth=100;
    screenManager=1;//0=start, 1=gameplay, 2=win, 3=defeat 
    buttonElement.style.display = "none";
    toggleWrap.style.display="none";
    for (var i = 0; i < mouseButtons.length; i++) {
        mouseButtons[i].style.display = "none";
      }
    for (var i = 0; i < keyButtons.length; i++) {
        keyButtons[i].style.display = "none";
    }

    //canvas.style.cursor = 'none';
      if (toggle.checked) {
        hitbox=true;
    } else {
        hitbox=false;
      }
}

animate();
startScreen();