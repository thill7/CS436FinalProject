$(document).ready(() => {

    var circleRadius = 5;

    var virusRadius = 2;

    var defenderRatio = 0.2;

    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");

    var globalAgentCount = 200;

    var xLimit = canvas.width;
    var yLimit = canvas.height;

    var vmax = xLimit > yLimit ? (xLimit / 100) : (yLimit / 100);

    var hole = {
        x: (canvas.width / 4) * 3   ,
        yStart: (canvas.height / 6) * 2,
        yEnd: (canvas.height / 6) * 4
    }

    class Agent {
        constructor({xPos,yPos,isVirus,radius,id,isDefender}) {
            this.isVirus = isVirus;
            this.isInfected = false;
            this.isDefender = isDefender;
            this.position = {xPos,yPos};
            this.color = isVirus ? "red" : (this.isDefender ? "blue" : "green");
            this.angle = Math.random() * 360;
            this.speed = 8;
            this.id = id;
            this.radius = radius;
        }

        getNeighbors(agents) {
            var neighbors = agents.filter(a => {
                let distance = getDistance(this.position.xPos,a.position.xPos,this.position.yPos,a.position.yPos);
                return a.elementID != this.elementID && distance < 150;
            });
            return neighbors;
        }

        checkVirus() {
            var {xPos, yPos} = this.position;
            viruses.forEach(v => {
                if(getDistance(xPos,v.position.xPos,yPos,v.position.yPos) < 5) {
                    if(!this.isDefender){
                        if(Math.random() < 0.1) {
                            this.infect(viruses);
                            return false;
                        }
                    }
                    else {
                        if(Math.random() < 0.3) {
                            viruses = viruses.filter(vi => vi.id != v.id);
                            $("#virusCount").text(viruses.length);
                        }
                    }
                }
            });
        }

        infect() {
            //console.log("infected!");
            this.isInfected = true;
            this.isDefender = false;
            this.color = "yellow";
            var {xPos, yPos} = this.position;
            var id = this.id;
            setTimeout(() => {
                for(let i = 0; i < 2; i++) {
                    viruses = [...viruses,new Agent({xPos,yPos,id:"virus"+viruses.length, isVirus: true,radius:virusRadius})]
                }
                $("#virusCount").text(viruses.length);
                removeAgent(id);
            },5000);
        }

        draw(newXPos,newYPos) {
            if(newXPos <= 0 || newXPos >= xLimit || newYPos <= 0 || newYPos >= yLimit) {
                this.angle = Math.random() * 360;
                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.strokeStyle = this.color;
                ctx.moveTo(newXPos,newYPos);
                ctx.arc(this.position.xPos,this.position.yPos,this.radius,0,2*Math.PI);
                return;
            }
            this.position.xPos = newXPos;
            this.position.yPos = newYPos;
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            ctx.moveTo(newXPos,newYPos);
            ctx.arc(newXPos,newYPos,this.radius,0,2*Math.PI);
            ctx.fill();
        }
    }

    function getDistance(x1, x2, y1, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var c = Math.sqrt( a*a + b*b );
        return c;
    }

    function removeAgent(id) {
        agents = agents.filter(a => a.id != id);
        globalAgentCount--;
        $("#agentCount").text(globalAgentCount);
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
            let neighbors = agent.getNeighbors(agents);
            neighbors.forEach(neighbor => {
                if(getDistance(neighbor.position.xPos, agent.position.xPos, neighbor.position.yPos, agent.position.yPos) < circleRadius) {
                    let tempAngle = neighbor.angle;
                    neighbor.angle = agent.angle;
                    agent.angle = tempAngle;
                }
            });
            if(neighbors.length > 2) {
                agent.angle = Math.random() * 360;
            }
            let newX = agent.position.xPos + agent.speed * Math.sin(agent.angle);
            let newY = agent.position.yPos - agent.speed * Math.cos(agent.angle);
            //console.log({newX,newY});
            agent.draw(newX,newY);
            if(!agent.isInfected) {
                agent.checkVirus(viruses);
            }
        });
        ctx.beginPath();
        viruses.forEach(v => {
            let newX = v.position.xPos + v.speed * Math.sin(v.angle);
            let newY = v.position.yPos - v.speed * Math.cos(v.angle);
            //console.log({newX,newY});
            v.draw(newX,newY);
        });
    }

    var agents = [];
    var viruses = [];
    
    $("#agentCount").text(globalAgentCount);
    $("#virusCount").text(1);

    for(let i = 0; i < globalAgentCount; i++) {
        let randX = (Math.random() * xLimit);
        let randY = (Math.random() * yLimit);
        agents = [...agents,new Agent({xPos:randX,yPos:randY, id: "agent"+i, radius:circleRadius, isDefender: i < (globalAgentCount * defenderRatio)})];
    }

    viruses = [new Agent({xPos:Math.random() * xLimit, yPos:Math.random() * yLimit,isVirus:true,id:"virus"+0,radius:virusRadius})];

    var moveAgentsRandomly = setInterval(() => {
        moveAgents();
    },100);
});