$(document).ready(() => {

    var bloodCellRadius = 5;

    var virusRadius = 2;

    var defenderRadius = 3;

    var defenderRatio = 0.01;

    var defenseDistance = 10;

    var followDistance = 400;

    var infectionDistance = 10;

    var bloodCellStartCount = 50;

    var virusStartCount = 2;

    var defenderSpawnRate = 5000;

    var defenderLifeSpan = 5000;

    var bloodCellLimit = 1000;

    var bloodCellLifespan = 10000;

    var maxDefenderRatio = 0.5;

    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");

    var xLimit = canvas.width;
    var yLimit = canvas.height;

    var vmax = xLimit > yLimit ? (xLimit / 100) : (yLimit / 100);

    class Cell {
        constructor({x,y,radius,id}) {
            this.pos = {x,y};
            this.color = "red";
            this.angle = Math.random() * 360;
            this.id = id;
        }

        getNeighbors(agents,dist) {
            var neighbors = agents.filter(a => {
                let distance = getDistance(this.pos.x,a.pos.x,this.pos.y,a.pos.y);
                return a.elementID != this.elementID && distance < dist;
            });
            return neighbors;
        }

        draw(newXPos,newYPos) {
            if(newXPos <= 0 || newXPos >= xLimit || newYPos <= 0 || newYPos >= yLimit) {
                this.angle = Math.random() * 360;
                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.strokeStyle = this.color;
                ctx.moveTo(this.pos.x,this.pos.y);
                ctx.arc(this.pos.x,this.pos.y,this.radius,0,2*Math.PI);
                ctx.fill();
                return;
            }
            this.pos.x = newXPos;
            this.pos.y = newYPos;
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            ctx.moveTo(newXPos,newYPos);
            ctx.arc(newXPos,newYPos,this.radius,0,2*Math.PI);
            ctx.fill();
        }

    }

    class BloodCell extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.isInfected = false;
            this.radius = bloodCellRadius;
            this.angle = Math.random() * 360;
            this.speed = 8;
            this.radius = bloodCellRadius;
        }

        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                if(getDistance(x,v.pos.x,y,v.pos.y) < infectionDistance && !this.isInfected) {
                    if(Math.random() < 0.1) {
                        this.infect();
                        return false;
                    }
                }
                
            });
        }

        infect() {
            this.isInfected = true;
            this.color = "yellow";
            var {x, y} = this.pos;
            var id = this.id;
            setTimeout(() => {
                for(let i = 0; i < 2; i++) {
                    agents = [...agents,new Virus({x,y,id:"virus"+agents.filter(a => a instanceof Virus).length})]
                }
                $("#virusCount").text(agents.filter(a => a instanceof Virus).length);
                removeAgent(id);
            },5000);
        }

        divide() {
            var bloodCellCount = agents.filter(a => a instanceof BloodCell).length;
            if(bloodCellCount < bloodCellLimit) {
                agents = [...agents,new BloodCell({x:this.pos.x,y:this.pos.y,id:"bloodcell"+bloodCellCount})];
                $("#bloodCellCount").text(agents.filter(a => a instanceof BloodCell).length);
            }
            
        }
    }

    class Virus extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.color = "green";
            this.angle = Math.random() * 360;
            this.speed = 10;
            this.radius = virusRadius;
        }
    }

    class Defender extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.color = "blue";
            this.angle = Math.random() * 360;
            this.speed = 8;
            this.radius = defenderRadius;
        }

        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                var dist = getDistance(x,v.pos.x,y,v.pos.y);
                if(dist < followDistance) {
                    this.angle = getFollowAngle(x,v.pos.x,y,v.pos.y);
                    if(dist < defenseDistance) {
                        if(Math.random() < 0.3) {
                            if(agents.filter(a => a instanceof Defender).length < Math.floor(maxDefenderRatio * bloodCellStartCount)) {
                                spawnWhiteBloodCell();
                            } 
                            removeAgent(v.id);
                        }
                    }
                }
            });
        }
    }

    function getFollowAngle(x1,x2,y1,y2) {
        var angle = Math.atan2(y1-y2,x1-x2);
        angle = (180 / Math.PI) * angle;
        if (angle < 0) angle = 360 + angle;
        return angle; 
    }

    function getDistance(x1, x2, y1, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var c = Math.sqrt( a*a + b*b );
        return c;
    }

    function removeAgent(id) {
        agents = agents.filter(a => a.id != id);
        $("#bloodCellCount").text(agents.filter(a => a instanceof BloodCell).length);
        $("#virusCount").text(agents.filter(a => a instanceof Virus).length);
    }

    function spawnWhiteBloodCell() {
        let randX = Math.random() * xLimit;
        let randY = Math.random() * yLimit;
        agents = [...agents,new Defender({x:randX,y:randY,id:"defender"+agents.filter(a => a instanceof Defender).length})]
        
    }

    function moveRandom(agents) {
        agents.forEach(agent => {
            let newX = Math.random() * xLimit;
            let newY = Math.random() * yLimit;
            agent.draw(newX,newY);
        });
    }

    function moveAgents() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
        agents.forEach(agent => {
            let newX = agent.pos.x + agent.speed * Math.sin(agent.angle);
            let newY = agent.pos.y - agent.speed * Math.cos(agent.angle);
            //console.log({newX,newY});
            agent.draw(newX,newY);
            if(!(agent instanceof Virus)) {
                agent.checkVirus();
            }
            if(agent instanceof BloodCell && agents.filter(a => a instanceof BloodCell).length < bloodCellStartCount && !agent.isInfected) {
                agent.divide();
            }
        });
    }

    var agents = [];
    
    $("#bloodCellCount").text(bloodCellStartCount);
    $("#virusCount").text(virusStartCount);

    for(let i = 0; i < bloodCellStartCount; i++) {
        let randX = (Math.random() * xLimit);
        let randY = (Math.random() * yLimit);
        if(i < bloodCellStartCount * defenderRatio) {
            agents = [...agents,new Defender({x:randX,y:randY,id:"defender"+i})];
        }
        else {
            agents = [...agents,new BloodCell({x:randX,y:randY,id:"bloodcell"+i})];
        }
    }

    for(let i = 0; i < virusStartCount; i++) {
        let randX = (Math.random() * xLimit);
        let randY = (Math.random() * yLimit);
        agents = [...agents,new Virus({x:randX,y:randY,id:"virus"+i})];
    }

    var moveAgentsRandomly = setInterval(() => {
        moveAgents();
    },100);
});