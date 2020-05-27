class Particle{
    constructor(id, x, y, vx, vy, m){
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.m = m;
        this.r = getRadius(m);
        this.v = Math.sqrt(Math.pow(this.vx, 2) + Math.pow(this.vy, 2));
        this.ek = [];
        this.ek.push([0, 0]);
        this.ax = 0
        this.ay = 0;
    }
}

// Functions to display or hide the welcome screen
function on() {
    document.getElementById("playButton").style.display = "block";
}

function off() {
    document.getElementById("playButton").style.display = "none";
}

var particles = [];
var ctx;
var canvas;
var table;
var a = 0;
var sa;
var ek = [];
var eff = 0.85;
var shot = new Audio("shot.mp3");
var wallhit = new Audio("wallhit.mp3");
var selector = document.getElementById('graph_type');
var sfr = 0;
var fr = 0;
var drawVelocityVector = false;
var measurementData = [];
var chartX = "measurement";
var chartY = "ekt"
measurementData.push('Measurement Number');
measurementData.push(0);
var bkg = new Image();
bkg.src = "pool.jpg"

ek.push('Kientic Energy (J)');
ek.push(0);

var measurement = 0;

// Load the google charts API
google.charts.load('current', {'packages':['corechart']});

function main(elem){
    off();
    canvas = document.getElementById(elem);
    ctx = canvas.getContext("2d");
    table = document.getElementById("particles");
    
    fr = document.getElementById("fr").value;
    //sfr = document.getElementById("sfr").value;

    drawVelocityVector = document.getElementById("drawvelocity").checked;

    reloadDropdowns();

    // Set a callback to run when the charts API is loaded
    google.charts.setOnLoadCallback(drawKEChart);
   
    //canvas.addEventListener("mousedown", doMouseDown, false);
    //canvas.addEventListener("onmouseup", doMouseUp, false);

    // Loop through each particle every 10 milliseconds, create measurements every 1 second
    setInterval(loop, 20);
    setInterval(measureData, 1000);
}

// The main loop function that handles each particle
function loop(){
    

    // Set volumes of sounds according to % energy transferred
    eff = document.getElementById("effe").value/100;
    shot.volume = 1 - eff;
    wallhit.volume = 1 - eff;

    // Acceleration = 9.8*uk (derived from F=ma, -uk*g*m=m*a)
    a = -(9.8)*fr;
    sa = -(9.8)*sfr;

    chartX = document.getElementById("graphx").value;
    chartY = document.getElementById("graphy").value;
    drawVelocityVector = document.getElementById("drawvelocity").checked;

    // Write the current kinetic energy, then reset to 0 for recalculation
    document.getElementById("ek").innerHTML = ek[ek.length-1];

    // Draw board, then process collisions.
    draw();
    separate();
    detectCollisions();

    // Iterate through each particle, to change it's velocity from acceleration, and position from velocity
    particles.forEach((elem, i) => {

        // Determine velocity vector and store for later use
        elem.v = Math.sqrt(Math.pow(elem.vx, 2) + Math.pow(elem.vy, 2));
        
        // Check for collisions with wall, and on collision set to - velocity
        if(elem.x + elem.vx > canvas.width - elem.r || elem.x + elem.vx < elem.r){
            elem.vx = -eff*elem.vx;
            let wallHitAudio = wallhit.cloneNode();
            wallHitAudio.volume = 1 - eff;
            wallHitAudio.play()

            // Fix bug of balls getting stuck in walls, if a ball is in a wall move it out
            if(elem.x + elem.vx > canvas.width - elem.r){
                elem.x = canvas.width - elem.r;
            }
            
            if(elem.x + elem.vx < elem.r){
                elem.x = elem.r;
            }
            
        }
        if(elem.y + elem.vy > canvas.height - elem.r || elem.y + elem.vy < elem.r){
            elem.vy = -eff*elem.vy;
            let wallHitAudio = wallhit.cloneNode();
            wallHitAudio.volume = 1 - eff;
            wallHitAudio.play()

            // Fix bug of balls getting stuck in walls, if a ball is in a wall move it out
            if(elem.y + elem.vy < elem.r){
                elem.y = elem.r;
            }
            if(elem.y + elem.vy > canvas.width - elem.r){
                elem.y = canvas.height - elem.r;
            }
        }
        
        // Calculate Theta, and acceleration values based on the direction of the velocity vector
        elem.theta = Math.atan2(elem.vx,elem.vy);
        elem.sax = sa*Math.abs(Math.sin(elem.theta));
        elem.say = sa*Math.abs(Math.cos(elem.theta));

        elem.ax = a*Math.abs(Math.sin(elem.theta));
        elem.ay = a*Math.abs(Math.cos(elem.theta));
        
        // If the particle has enough velocity to be decelerated, decelerate it
        if(!Math.abs(elem.vx) < Math.abs(elem.ax) || !Math.abs(elem.vy) < Math.abs(elem.ay)){
            // Add acceleration to velocity each iteration
            if(elem.vx > 0){
                elem.vx += elem.ax;
             }
            else{
                elem.vx -= elem.ax;
             }

             // Add acceleration to velocity each iteration
             if(elem.vy > 0){
                 elem.vy += elem.ay;
             }
             else{
                 elem.vy -= elem.ay;
             }

        }else{
            elem.ax = 0;
            elem.ay = 0;
        
    }
    // Set velocity to zero if the acceleration is larger than it
    if(Math.abs(elem.ay) > Math.abs(elem.vy) || Math.abs(elem.ax) > Math.abs(elem.vx)){
            elem.ax = 0;
            elem.ay = 0;
            elem.vx = 0;
            elem.vy = 0;
    }else{
        if((elem.vx == 0 || elem.vy == 0) && (Math.abs(elem.say) > Math.abs(elem.vy) || Math.abs(elem.sax) > Math.abs(elem.vx))){
            elem.ax = 0;
            elem.ay = 0;
            elem.vx = 0;
            elem.vy = 0;
        }else{
            // Each iteration add the velocity to the position
            elem.x += elem.vx;
            elem.y += elem.vy;
        }
    
    }   
        
        // Display data in the table
        table.rows[i+1].cells[0].innerHTML = elem.m + " kg";
        table.rows[i+1].cells[1].innerHTML = Math.abs(elem.vx.toPrecision(2));
        table.rows[i+1].cells[2].innerHTML = Math.abs(elem.vy.toPrecision(2));
        table.rows[i+1].cells[3].innerHTML = elem.ax.toPrecision(2);
        table.rows[i+1].cells[4].innerHTML = elem.ay.toPrecision(2);
    })
}

// Function to draw all particles on the canvas, and draw velocity vectors
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bkg, 0, 0, canvas.width, canvas.height); 
    particles.forEach((elem, i) => 
    {
        // Draw actual particle
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.arc(elem.x, elem.y, elem.r, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();

        // Center mass in particle
        ctx.font = elem.m*0.55 + 'px serif';
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(elem.m+"kg", elem.x, elem.y + elem.r/4);

        // Draw Velocity Vector, if this option is selected
        if(drawVelocityVector){
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.moveTo(elem.x, elem.y);
        ctx.lineTo(elem.x + elem.v*Math.sin(elem.theta)* 10, elem.y + elem.v*Math.cos(elem.theta) * 10);
        ctx.stroke(); 
        }
        
    });
    
}

// Function that returns the distance between the two particles given
function getDistance(p1, p2){
    let xDist = Math.abs(p1.x - p2.x);
    let yDist = Math.abs(p1.y - p2.y);

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

var collisions = [];

// Function that will separate all particles on the canvas
function separate(){
    collisions = [];
    let noOverlap = false;
    while(!noOverlap){
        noOverlap = true;
        particles.forEach((elem1, i) => {
            for(var j = i+1; j < particles.length; j++){
                elem2 = particles[j];
                // Make sure not comparing the same element
                if(elem1 != elem2){
                    // If the particles are overlapping
                if(getDistance(elem1, elem2) < elem1.r + elem2.r){
                    collisions.push({element1: elem1, element2: elem2});
                    console.log("overlap");
                    
                    // Move the particle back to its previous position, only if doing so will not put it inside of a wall
                    if(!elem1.x - elem1.vx > canvas.width - elem1.r || !elem1.x - elem1.vx < elem1.r)
                        elem1.x -= elem1.vx;
                    
                    if(!elem2.x - elem2.vx > canvas.width - elem2.r || !elem2.x - elem2.vx < elem2.r)
                        elem2.x -= elem2.vx;
                    
                    if(!elem1.y - elem1.vy > canvas.height - elem1.r || !elem1.y - elem1.vy < elem1.r)
                        elem1.y -= elem1.vy;

                    if(!elem2.y - elem2.vy > canvas.height - elem2.r || !elem2.y - elem2.vy < elem2.r)
                        elem2.y -= elem2.vy;
                    
                        noOverlap = false;
                    
                    draw();
                }
            }
            }
        })
    }
}

// Function that detects, and handles all collisions.
function detectCollisions(){
    
    collisions.forEach((collision) => {
        let shotAudio = shot.cloneNode()
        shotAudio.volume = 1 - eff;
        shotAudio.play()
        elem1 = collision.element1;
        elem2 = collision.element2;
        
            // Check if the particles being compared are the same, if they are don't run collision detection or particles will collide with themselves. 
            if(elem1 != elem2){
                    elem1.px = elem1.x;
                    elem1.py = elem1.y;
                    elem2.px = elem2.x;
                    elem2.py = elem2.y;

                    // Store previous velocities, this will be used later when detecting static friction
                    elem1.pvx = elem1.vx;
                    elem1.pvy = elem1.vy;
                    elem2.pvx = elem2.vx;
                    elem2.pvy = elem2.vy;

                    // If the particles are still overlapping, separate them again
                    if(getDistance(elem1, elem2) < elem1.r + elem2.r){
                        console.log("overlap");
                        elem1.x -= elem1.vx;
                        elem1.y -= elem1.vy;
                        elem2.x -= elem2.vx;
                        elem2.y -= elem2.vy;
                    }                 

                    // Theta = angle of velocity
                    let theta1 = Math.atan2(elem1.vx,elem1.vy);
                    let theta2 = Math.atan2(elem2.vx,elem2.vy);

                    // Phi = angle of collision
                    let phi = Math.atan2((elem2.px - elem1.px),(elem2.py - elem1.py));

                    // Find rotated x & y components, with x axis parallel to the contact normal vector
                    let v1xr = elem1.v*Math.cos(theta1 - phi);
                    let v1yr = elem1.v*Math.sin(theta1 - phi);
                    let v2xr = elem2.v*Math.cos(theta2 - phi);
                    let v2yr = elem2.v*Math.sin(theta2 - phi);

                    // Use the rotated components to solve a 1 dimensional collision. 
                    let v1fxr = eff*(v1xr*(elem1.m - elem2.m) + 2*elem2.m*v2xr)/(elem1.m + elem2.m);
                    let v2fxr = eff*(v2xr*(elem2.m - elem1.m) + 2*elem1.m*v1xr)/(elem2.m + elem1.m);    

                    elem1.vy = v1fxr*Math.cos(phi) + v1yr*Math.cos(phi + Math.PI/2);
                    elem1.vx = v1fxr*Math.sin(phi) + v1yr*Math.sin(phi + Math.PI/2);
                    elem2.vy = v2fxr*Math.cos(phi) + v2yr*Math.cos(phi + Math.PI/2);
                    elem2.vx = v2fxr*Math.sin(phi) + v2yr*Math.sin(phi + Math.PI/2);

                    // Calculate new theta, and static acceleration for static friction checking
                    elem1.theta = Math.atan2(elem1.vx,elem1.vy);
                    elem1.sax = sa*Math.abs(Math.sin(elem1.theta));
                    elem1.say = sa*Math.abs(Math.cos(elem1.theta));

                    elem2.theta = Math.atan2(elem2.vx,elem2.vy);
                    elem2.sax = sa*Math.abs(Math.sin(elem2.theta));
                    elem2.say = sa*Math.abs(Math.cos(elem2.theta));

                    if((elem2.sax > elem2.vx || elem2.say > elem2.vy) && (elem2.pvx == 0 || elem2.pvy == 0)){
                        //elem2.vx = 0;
                        //elem2.vy = 0;
                    }

                    if(elem1.sax > elem1.vx || elem1.say > elem1.vy && (elem1.pvx == 0 || elem1.pvy == 0)){
                        //elem1.vx = 0;
                        //elem1.vy = 0;
                    }
                    
            }
    });
}

// Function called when the add particle button is submitted
function addParticle(){
    var form = document.getElementById("add");
    var errMsg = "Errors: "; // String to store all errors with entered data
    // Mass cannot be less than 1 error
    if(form["mass"].value < 1){
        errMsg += "Cannot Have Negative, or Zero Mass! "
    }
    // Mass is too large for the canvas size error
    else if(getRadius(form["mass"].value)*2 + 10 > canvas.width || getRadius(form["mass"].value)*2 + 10 > canvas.height){
        errMsg += "That mass is too large for this canvas! "
    }else if(!form["xvel"].value || !form["yvel"].value || !form["mass"].value){
        errMsg += "One or more values is not defined! "
    }else if(form["xvel"].value > canvas.width - getRadius(form["mass"].value)*4 || form["yvel"].value > canvas.height - getRadius(form["mass"].value)*4){
        errMsg += "The velocity of the particle you added is too large for that mass and this canvas size! "
    }
    // If no errors, add rows to the table and insert the particle into the array
    else{
        

        var xv = parseInt(form["xvel"].value)
        var yv = parseInt(form["yvel"].value)

        // Check if the acceleration is larger than the velocity, if so set velocity to 0 and not negative.

        let n = 1;
        if(particles.length > 0){
            n = particles[particles.length-1].id +1;
        }

        // Find a position that is not ontop of another ball, or inside of a wall. This will randomize the position 9 times or until a successful location is discovered. 
        let validPos = false;
        let numtries = 0;
        let tx = 0; let ty = 0;
        while(!validPos && numtries < 9){
            numtries ++;
            validPos = true;
            tx = Math.round(Math.random()*((canvas.width - getRadius(parseInt(form["mass"].value))) - getRadius(parseInt(form["mass"].value)) - 5) + getRadius(parseInt(form["mass"].value)) + 5);
            ty = Math.round(Math.random()*((canvas.height - getRadius(parseInt(form["mass"].value))) - getRadius(parseInt(form["mass"].value)) - 5) + getRadius(parseInt(form["mass"].value)) + 5);
            let temp = new Particle(n, tx, ty, xv, yv, parseInt(form["mass"].value)+5);
            particles.forEach(particle =>{
                if(getDistance(particle, temp) < particle.r + temp.r){
                    validPos = false;
                }
            })
        }
        // if a valid position was found create it
        if(validPos){
            table.insertRow();
        table.rows[table.rows.length -1].insertCell();
        table.rows[table.rows.length -1].insertCell();
        table.rows[table.rows.length -1].insertCell();
        table.rows[table.rows.length -1].insertCell();
        table.rows[table.rows.length -1].insertCell();
            particles.push(new Particle(n, tx, ty, xv, yv, parseInt(form["mass"].value)));
        }else{
            errMsg += "Not enough room for that particle on the canvas! "
        }
        
        reloadDropdowns();
    }
    if(errMsg != "Errors: "){
        alert(errMsg);
    }
}

// Function that returns a radius, by multiplying the given mass by a constant
function getRadius(mass){
    return mass*0.8;
}

// Function to remove a particle from the array by id
function remParticle(id){
    alert("remove");
    id = parseInt(id, 10);
    
    particles = particles.filter(function(element, i){
        eid = element.id;
        
        if(id == eid){
            table.deleteRow(i+1);
        }
        return id != eid;
    });
    console.log(particles);
}

// Function that adds the data at the current time to their respective array
function measureData(){
    measurement++;
    let ekt = 0;
    particles.forEach((elem, i) => {
        ekt += 0.5*Math.pow(elem.v, 2)*elem.m;
        // Ek=0.5mv^2, add to total
        elem.ek.push(0.5*Math.pow(elem.v, 2)*elem.m);
        measurementData.push(measurement);
        
    })
    ek.push(ekt.toPrecision(6));
    if(measurement > 100){
        measurement = 0;
        measurementData = [];
        measurementData.push('Time (s)');
        measurementData.push(0);
        ek = [];
        ek.push('Kientic Energy (J)');
        ek.push(0);

        particles.forEach((elem, i) => {
            elem.ek = [];
            elem.ek.push('Kientic Energy (J)');
        })
    }
    drawKEChart();
}

// Function to draw the graph based on the selected values
function drawKEChart() {
    //console.log(chartX);
    let x = [];
    if(chartX == "measurement"){
        x = [...measurementData];
    }else if(chartX == "ekt"){
        x = [...ek];
    }else{
        x = [...particles[parseInt(chartX, 10)-1].ek];
    }

    let y = [];
    if(chartY == "measurement"){
        y = [...measurementData];
    }else if(chartY == "ekt"){
        y = [...ek];
    }else{
        y = [...particles[parseInt(chartY, 10)-1].ek];
    }
    
    var arr = [];
    x.forEach((n, i) =>{
        arr.push([n, y[i]]);
    })

    var data = google.visualization.arrayToDataTable(arr);

      var options = {
        title: 'Graph (Change X and Y Axis in the above form):',
        legend: { position: 'bottom' }
      };

      var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

      chart.draw(data, options);

}

// Function called when static friction is changed, to make sure a valid number is selected
function sfrChange(){
    let element = document.getElementById("sfr");
    if(element.value >= 1){
        alert("The coefficient of static friction cannot be more than 1 for a billiard ball!");
        element.value = sfr;
    }else if(element.value <= fr){
        alert("The coefficient of kinetic friction cannot be more than the coefficient of static friction!");
        element.value = sfr;
    }
    else{
        sfr = document.getElementById("sfr").value;
    }
}

// Function called when kinetic friction is changed, to make sure a valid number is selected
function frChange(){
    let element = document.getElementById("fr");
    if(element.value >= 1){
        alert("The coefficient of kinetic friction cannot be more than 1 for a billiard ball!");
        element.value = fr;
    }else if(element.value < 0){
        alert("The coefficient of kinetic friction for a billiard ball cannot be negative!");
        element.value = fr;
    }
    //else if(element.value >= sfr){
    //    alert("The coefficient of kinetic friction cannot be more than the coefficient of static friction!");
    //    element.value = fr;
    //}
    else{
        fr = element.value;
    }
}

// Function called when % effectiveness is changed, to make sure a valid number is selected
function effeChange(){
    let element = document.getElementById("effe");
    if(element.value > 100){
        alert("There cannot be more than 100% efficient collisions! ");
        element.value = eff*100;
    }
    else if(element.value < 0){
        alert("There cannot be less than 0% effecient collisions! ");
        element.value = eff*100;
    }else{
        eff = element.value/100;
    }
}

// Function called to reset the dropdown menus when particles are added
function reloadDropdowns(){
    
    let xSelect = document.getElementById("graphx");
    for(let i = 0; i < xSelect.options.length; i++){
        xSelect.options.remove(i);
        i--;
    }

    let ySelect = document.getElementById("graphy");
    for(let j = 0; j < ySelect.options.length; j++){
        ySelect.options.remove(j);
        j--;
    }

    let xtOption = document.createElement("option");
    xtOption.text = "Time"
    xtOption.value = "measurement"

    let xeOption = document.createElement("option");
    xeOption.text = "Total Kinetic Energy"
    xeOption.value = "ekt"

    let ytOption = document.createElement("option");
    ytOption.text = "Time"
    ytOption.value = "measurement"

    let yeOption = document.createElement("option");
    yeOption.text = "Total Kinetic Energy"
    yeOption.value = "ekt"

    xSelect.options.add(xtOption, 0);
    xSelect.options.add(xeOption, 1);

    ySelect.options.add(ytOption, 1);
    ySelect.options.add(yeOption, 0);

    particles.forEach((elem, i) =>{
        let temp = document.createElement("option");
        let temp2 = document.createElement("option");
        temp.text = "Particle " + (i+1).toString() + " Kinetic Energy"
        temp.value = i+1;
        temp2.text = "Particle " + (i+1).toString() + " Kinetic Energy"
        temp2.value = i+1;
        xSelect.options.add(temp, xSelect.options.length-1);
        ySelect.options.add(temp2, ySelect.options.length-1);
    })
}

function setVelocity(event){
    let x = event.clientX-25;
    let y = event.clientX-25;
    while(mouseIsDown){
        console.log(x);
    }
}

function doMouseDown(event){
    mouseIsDown = true;
    setVelocity(event);
}

function doMouseUp(event){
    alert();
    mouseIsDown = false;
}