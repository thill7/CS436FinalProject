$(document).ready(() => {
    //global attributes used in calculations and default object properties
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
        defaultSpeed: 10,
        defaultRadius: 3,
        infectionProbability: 0.1,
        defenseProbability: 0.3,
    };
    //the drawing environment for "drawing" each agent
    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");
    //the coordinate limits of the window, determining when agents collide with the walls
    var xLimit = canvas.width;
    var yLimit = canvas.height;

    //the main class from which all agents inherit
    class Cell {
        constructor({x,y,id}) {
            this.pos = {x,y};
            this.color = "red";
            this.angle = Math.random() * 360;
            this.id = id;
            this.radius = options.defaultRadius;
            this.speed = options.defaultSpeed;
        }
        //returns a collection of all neighboring agents within a certain distance
        getNeighbors(agents,dist) {
            var neighbors = agents.filter(a => {
                let distance = getDistance(this.pos.x,a.pos.x,this.pos.y,a.pos.y);
                return a.elementID != this.elementID && distance < dist;
            });
            return neighbors;
        }
        //moves the agent to a new location if its within the bounds of the window, else it changes direction and stays put
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
    //inherits from Cell 
    class BloodCell extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.isInfected = false;
            this.radius = options.bloodCellRadius;
            this.angle = Math.random() * 360;
            this.speed = 8;
        }
        //for each virus within a certain distance, there is a chance that the cell will become infected through infect() method
        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                if(getDistance(x,v.pos.x,y,v.pos.y) < options.infectionDistance && !this.isInfected) {
                    if(Math.random() < options.infectionProbability) {
                        this.infect();
                        return false;
                    }
                }
                
            });
        }
        //the isInfected boolean is tripped, inhibiting division and setting a 5 second timer, after which the cell will "die" and release copies of the virus
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
        //a cell will divide only if it is not infected and the current count of blood cells is less than the max amount
        divide() {
            var bloodCellCount = agents.filter(a => a instanceof BloodCell).length;
            if(bloodCellCount < options.bloodCellLimit) {
                agents = [...agents,new BloodCell({x:this.pos.x,y:this.pos.y,id:"bloodcell"+bloodCellCount})];
                $("#bloodCellCount").text(agents.filter(a => a instanceof BloodCell).length);
            }
            
        }
    }
    //virus class inherits from Cell, just using basic functions
    class Virus extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.color = "green";
            this.angle = Math.random() * 360;
            this.speed = 10;
            this.radius = options.virusRadius;
        }
    }
    //defender (i.e. White Blood Cell) inherits from Cell
    class Defender extends Cell {
        constructor({x,y,id}) {
            super({x,y,id});
            this.color = "blue";
            this.angle = Math.random() * 360;
            this.speed = 8;
            this.radius = options.defenderRadius;
        }
        //checks neighbors to look for viruses; will change its angle to "follow" viruses within a certain radius and destroy ones that are closer based on a probaility
        checkVirus() {
            var {x, y} = this.pos;
            agents.filter(a => a instanceof Virus).forEach(v => {
                var dist = getDistance(x,v.pos.x,y,v.pos.y);
                if(dist < options.followDistance) {
                    this.angle = getFollowAngle(x,v.pos.x,y,v.pos.y);
                    if(dist < options.defenseDistance) {
                        if(Math.random() < options.defenseProbability) {
                            if(agents.filter(a => a instanceof Defender).length < Math.floor(options.defenderRatio * 5 * options.bloodCellStartCount)) {
                                spawnWhiteBloodCell();
                            } 
                            removeAgent(v.id);
                        }
                    }
                }
            });
        }
    }

    //used by defender cells to determine the angle to move in the direction of a virus
    function getFollowAngle(x1,x2,y1,y2) {
        var angle = Math.atan2(y1-y2,x1-x2);
        angle = (180 / Math.PI) * angle;
        if (angle < 0) angle = 360 + angle;
        return angle; 
    }
    //used to determine whether an agent is within a certain distance of another agent
    function getDistance(x1, x2, y1, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var c = Math.sqrt( a*a + b*b );
        return c;
    }
    //used to destroy agents, i.e. remove them from the "agents" array
    function removeAgent(id) {
        agents = agents.filter(a => a.id != id);
        $("#bloodCellCount").text(agents.filter(a => a instanceof BloodCell).length);
        $("#virusCount").text(agents.filter(a => a instanceof Virus).length);
    }
    //creates a white blood cell at a random location
    function spawnWhiteBloodCell() {
        let randX = Math.random() * xLimit;
        let randY = Math.random() * yLimit;
        agents = [...agents,new Defender({x:randX,y:randY,id:"defender"+agents.filter(a => a instanceof Defender).length})];
        $("#whiteBloodCellCount").text(agents.filter(a => a instanceof Defender).length);
    }
    //used for testing purposes
    function moveRandom(agents) {
        agents.forEach(agent => {
            let newX = Math.random() * xLimit;
            let newY = Math.random() * yLimit;
            agent.draw(newX,newY);
        });
    }
    //a function repeated at a regular interval that moves agents, makes any agent that's not a virus check for viruses around it, and trigger cell division
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
    //updates the options menu inputs with the current values of global properties
    function setOptionsMenuValues() {
        $("#bloodCellStartCount").val(options.bloodCellStartCount);
        $("#virusStartCount").val(options.virusStartCount);
        $("#defenderRatio").val(options.defenderRatio);
        $("#defenseDistance").val(options.defenseDistance);
        $("#infectionDistance").val(options.infectionDistance);
    }
    //updates global options to reflect values defined in options menu
    function setOptionsValues(newValues) {
        for(var key in newValues) {
            options[key] = newValues[key];
        }
    }
    //starts or stops the simulation, based on a boolean passed, and updates buttons to reflect state
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
    //modal shown when there are no more viruses and no infected cells, giving options to start over or change options
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
    //clicks handlers for buttons
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
    //pulls options from option inputs and saves them to the global state
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
    //initializes and begins running the simulation
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
    //variable that holds the repeating function for moving the agents
    var moveAgentsRandomly;
    //holds the array of agents
    var agents;
    
});