$(document).ready(() => {

    var options = {
        bloodCellRadius: 3,
        virusRadius: 2,
        defenderRadius: 3,
        defenderRatio: 0.1,
        defenseDistance: 10,
        followDistance: 400,
        infectionDistance: 10,
        bloodCellStartCount: 200,
        virusStartCount: 2,
        bloodCellLimit: 1000,
        maxDefenderRatio: 0.5,
    };

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
            this.radius = options.bloodCellRadius;
            this.angle = Math.random() * 360;
            this.speed = 8;
        }

        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                if(getDistance(x,v.pos.x,y,v.pos.y) < options.infectionDistance && !this.isInfected) {
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
            if(bloodCellCount < options.bloodCellLimit) {
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
            this.radius = options.virusRadius;
        }
    }

    class Defender extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.color = "blue";
            this.angle = Math.random() * 360;
            this.speed = 8;
            this.radius = options.defenderRadius;
        }

        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                var dist = getDistance(x,v.pos.x,y,v.pos.y);
                if(dist < options.followDistance) {
                    this.angle = getFollowAngle(x,v.pos.x,y,v.pos.y);
                    if(dist < options.defenseDistance) {
                        if(Math.random() < 0.3) {
                            if(agents.filter(a => a instanceof Defender).length < Math.floor(options.maxDefenderRatio * options.bloodCellStartCount)) {
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
        agents = [...agents,new Defender({x:randX,y:randY,id:"defender"+agents.filter(a => a instanceof Defender).length})];
        $("#whiteBloodCellCount").text(agents.filter(a => a instanceof Defender).length);
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
            if(agent instanceof BloodCell && agents.filter(a => a instanceof BloodCell).length < options.bloodCellStartCount && !agent.isInfected) {
                agent.divide();
            }
        });
    }

    function setOptionsMenuValues() {
        $("#bloodCellStartCount").val(options.bloodCellStartCount);
        $("#virusStartCount").val(options.virusStartCount);
        $("#defenderRatio").val(options.defenderRatio);
        $("#defenseDistance").val(options.defenseDistance);
        $("#infectionDistance").val(options.infectionDistance);
    }

    function setOptionsValues(newValues) {
        for(var key in newValues) {
            options[key] = newValues[key];
        }
    }

    function setSimulationActiveState(active) {
        if(active) {
            $("#startButton").attr("data-running","true").removeClass("btn-success").addClass("btn-danger").text("Stop");
            $("#optionsButton").attr("disabled","");
            startSimulation();
        }
        else {
            $("#startButton").attr("data-running","false").removeClass("btn-danger").addClass("btn-success").text("Start");
            $("#optionsButton").removeAttr("disabled");
            clearInterval(moveAgentsRandomly);
        }
    }
    function showCompleteMessage() {
        var dialog = $("<div>")
        .attr({
            "class":"completeDialog d-flex flex-column align-item-center justify-content-center",
            "id":"completionDialog"
        });
        var message = $("<div>")
        .attr({
            "class":"card rounded d-inline-block m-4"
        })
        .html(
            `<div class="card-header">`
            +`<h2 class="card-title">Simulation Complete</h2>`
            +`</div>`
            +`<div class="card-body">`
            +`<p class="lead">All viruses were eliminated by the white blood cells.</p>`
            +`</div>`
            +`<div class="card-footer">`
            +`<div class="btn-group w-100">`
            +`<button class="btn btn-warning" id="dialogOptionsButton">Options</button>`
            +`<button id="dialogRestartButton" class="btn btn-info">Restart</button>`
            +`</div>`
            +`</div>`
        )
        $(dialog).hide();
        $(message).appendTo(dialog);
        $(dialog).appendTo("body");
        $(dialog).fadeIn();
    }

    $(document).on("click","#dialogRestartButton",() => {
        $("#completionDialog").remove();
        setSimulationActiveState(true);
    });

    $(document).on("click","#dialogOptionsButton",() => {
        $("#completionDialog").remove();
        $("#optionsMenu").collapse("show");
        setOptionsMenuValues();
    });

    $("#optionsButton").click(() => {
        $("#optionsMenu").collapse("show");
        setOptionsMenuValues();
    });

    $("#closeOptionsMenuButton").click(() => {
        $("#optionsMenu").collapse("hide");
    });

    $("#updateOptionsButton").click(() => {
        let bloodCellStartCount = parseInt($("#bloodCellStartCount").val());
        let virusStartCount = parseInt($("#virusStartCount").val());
        let defenderRatio = parseFloat($("#defenderRatio").val());
        let defenseDistance = parseInt($("#defenseDistance").val());
        let infectionDistance = parseInt($("#infectionDistance").val());
        setOptionsValues({bloodCellStartCount,virusStartCount,defenderRatio,defenseDistance,infectionDistance});
        $("#optionsMenu").collapse("hide");
    });

    $("#startButton").click(() => {
        setSimulationActiveState($("#startButton").attr("data-running") == "false")
    });

    function startSimulation() {
        agents = [];

        for(let i = 0; i < options.bloodCellStartCount; i++) {
            let randX = (Math.random() * xLimit);
            let randY = (Math.random() * yLimit);
            if(i < options.bloodCellStartCount * options.defenderRatio) {
                agents = [...agents,new Defender({x:randX,y:randY,id:"defender"+i})];
            }
            else {
                agents = [...agents,new BloodCell({x:randX,y:randY,id:"bloodcell"+i})];
            }
        }

        $("#bloodCellCount").text(agents.filter(a => a instanceof BloodCell).length);
        $("#virusCount").text(options.virusStartCount);
        $("#whiteBloodCellCount").text(agents.filter(a => a instanceof Defender).length);

        for(let i = 0; i < options.virusStartCount; i++) {
            let randX = (Math.random() * xLimit);
            let randY = (Math.random() * yLimit);
            agents = [...agents,new Virus({x:randX,y:randY,id:"virus"+i})];
        }

        moveAgentsRandomly = setInterval(() => {
            if(agents.filter(a => a instanceof Virus).length == 0 && agents.filter(a => a instanceof BloodCell && a.isInfected).length == 0) {
                setSimulationActiveState(false);
                showCompleteMessage();
                return;
            }
            moveAgents();
        },100);
    }

    var moveAgentsRandomly;
    var agents;
    
});