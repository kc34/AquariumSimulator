/**
 * Tank: Stores everything.
 * The model part of MVC.
 */
var Tank = function() {
	this.entities = [[], [], []]; // Type-hashed!
	this.wrapped = {x : true, y : false};
}
Tank.prototype.addDonut = function(x, y) {
	this.entities[0].push(new Donut(x, y))
}
Tank.prototype.update = function(dt) {
	
	// supply donut
	if (this.entities[0].length < 100) {
		this.addDonut(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
	}
	
	// supply fish!
	if (this.entities[1].length < 500) {
		this.entities[1].push(new Fish(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0, 0));
	}
	
	// supply sharks!
	if (this.entities[2].length < 3) {
		this.entities[2].push(new Shark(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0, 0));
	}
	
	// Moving entities.
	
	this.entities[0].forEach(function(donut) {
		attemptedMove = donut.tryMove(dt);
		this.doMove(donut, attemptedMove, dt);
	}, this);
	
	this.entities[1].forEach(function(fish) {
		
		var visibleDonuts = this.entities[0].filter(function (donut) {
				return this.getDisplacement(fish, donut)[2] < fish.eyesight;
			}, this);
		var visibleSharks = this.entities[2].filter(function (shark) {
				return this.getDisplacement(fish, shark)[2] < fish.eyesight + Math.sqrt(shark.mass);
			}, this);
		attemptedMove = fish.tryMove(dt, visibleDonuts, visibleSharks);
		this.doMove(fish, attemptedMove, dt);
		
	}, this);
	
	this.entities[2].forEach(function(shark) {
		
		var visibleFish = this.entities[1].filter(function (fish) {
				return this.getDisplacement(shark, fish)[2] < shark.eyesight;
			}, this);
		attemptedMove = shark.tryMove(dt, visibleFish);
		this.doMove(shark, attemptedMove, dt);
		
	}, this);
	
	// Collision detection.
	
	this.checkForEat(this.entities[1], this.entities[0]);
	this.checkForEat(this.entities[2], this.entities[1]);
};

Tank.prototype.checkForEat = function(predatorList, preyList) {
	predatorList.forEach(function(predator) {
		preyList.forEach(function(prey) {
			if (this.getDisplacement(predator, prey)[2] < Math.sqrt(predator.mass)) {
				predator.mass += prey.mass;
				var index = preyList.indexOf(prey);
				preyList.splice(index, 1);
			}
		}, this);
	}, this);
}

Tank.prototype.doMove = function(entity, attemptedMov, dt) {
	var windowSize = {x : window.innerWidth, y : window.innerHeight};
	attemptedMove = {x : attemptedMove[0], y : attemptedMove[1]};
	["x", "y"].forEach(function (dim) {
		if (this.wrapped[dim] === true) {
			entity[dim] += attemptedMove[dim] * dt;
			entity[dim] = (entity[dim] + windowSize[dim]) % windowSize[dim];
		} else {
			if (entity[dim] + attemptedMove[dim] * dt < 0) {
				entity[dim] = 0;
				entity["d" + dim] *= -2;
			} else if (entity[dim] + attemptedMove[dim] * dt > windowSize[dim]) {
				entity[dim] = windowSize[dim];
				entity["d" + dim] *= -2;
			} else {
				entity[dim] += attemptedMove[dim] * dt;
			}
		}
	}, this);
};
Tank.prototype.draw = function(partialFrameTime) {
	
	// start with a screen clear
	ctx.fillStyle = "#334D66";
	ctx.fillRect( 0 , 0 , window.innerWidth , window.innerHeight );

	// Use respective draw functions for each fish.
	this.entities[0].forEach(function(donut) {draw_donut(donut, partialFrameTime);});
	this.entities[1].forEach(function(fish) {draw_fish(fish, partialFrameTime);});
	this.entities[2].forEach(function(shark) {draw_fish(shark, partialFrameTime);});
}

var draw_donut = function(donut, partialFrameTime) {
	ctx.strokeStyle = "#880000";
	ctx.beginPath();
	ctx.arc( donut.x + donut.dx * partialFrameTime,
			 donut.y + donut.dy * partialFrameTime,
			 3 , 0 , 2 * Math.PI );
	ctx.stroke();
};

/**
 * Draws a fish.
 */
var draw_fish = function(fish, accumulator) {
	radius = Math.sqrt(fish.mass);
	
	var ori = ((fish.ddx >= 0) ? 1 : -1);
	
	adjusted_x = fish.x + fish.dx * accumulator + 0.5 * fish.ddx * Math.pow(accumulator, 2);
	adjusted_y = fish.y + fish.dy * accumulator + 0.5 * fish.ddy * Math.pow(accumulator, 2);
	
	var tail = new Path2D();
	tail.moveTo(adjusted_x , adjusted_y);
	tail.lineTo( adjusted_x + radius * -2 * ori, adjusted_y + radius * 1);
	tail.lineTo( adjusted_x + radius * -2 * ori, adjusted_y + radius * -1);
	ctx.fillStyle = fish.tailColor;
	ctx.fill(tail);
		
	var tail2 = new Path2D();
	tail2.moveTo(adjusted_x , adjusted_y);
	tail2.lineTo( adjusted_x + radius * -1.6 * ori, adjusted_y + radius * 0.8);
	tail2.lineTo( adjusted_x + radius * -1.6 * ori, adjusted_y + radius * -0.8);
	ctx.fillStyle = fish.bodyColor;
	ctx.fill(tail2);
		
	var fin = new Path2D();
	fin.moveTo( adjusted_x + radius * -1 * ori, adjusted_y + radius * 1.5);
	fin.lineTo( adjusted_x + radius * -0.5 * ori, adjusted_y + radius * 0);
	fin.lineTo( adjusted_x + radius * -1 * ori, adjusted_y + radius * -1.5);
	fin.lineTo( adjusted_x + radius * 0 * ori, adjusted_y + radius * -1);
	fin.lineTo( adjusted_x + radius * 0 * ori, adjusted_y + radius * 1);
	ctx.fillStyle = fish.bodyColor;
	ctx.fill(fin);
		
	// Fish head
	ctx.beginPath();
	ctx.arc( adjusted_x , adjusted_y , radius , 0 , 2 * Math.PI );
	ctx.fillStyle = fish.bodyColor;
	ctx.fill();
		
	// Fish eyeball
	ctx.beginPath();
	ctx.arc( adjusted_x + radius * 0.5 * ori, adjusted_y + radius * -0.5, radius / 4, 0 , 2 * Math.PI );
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
		
	// Fish pupil
	ctx.beginPath();
	ctx.arc( adjusted_x + radius * 0.6 * ori, adjusted_y + radius * -0.6, radius / 8, 0 , 2 * Math.PI );
	ctx.fillStyle = "#000000";
	ctx.fill();
	
};

Tank.prototype.getDisplacement = function(obj1, obj2) {
	var windowSize = {x : window.innerWidth, y : window.innerHeight};
	var displacement = {};
	["x", "y"].forEach(function (dim) {
		displacement[dim] = obj2[dim] - obj1[dim];
		if (this.wrapped[dim] == true) {
			if (displacement[dim] > windowSize[dim] / 2) {
				displacement[dim] = displacement[dim] - windowSize[dim];
			} else if (displacement[dim] < -1 * windowSize[dim] / 2) {
				displacement[dim] = displacement[dim] + windowSize[dim];
			}
		}
	}, this);
	return [displacement["x"], displacement["y"], Tank.getDistance(displacement["x"], displacement["y"])];
};

Tank.getDistance = function(leg1, leg2) {
	return Math.sqrt(Math.pow(leg1, 2) + Math.pow(leg2, 2));
};