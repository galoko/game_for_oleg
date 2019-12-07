const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;
const mat4 = glMatrix.mat4;
const toRadian = glMatrix.glMatrix.toRadian;

class GameObjectTemplate {
	constructor(sprite_id, width, height) {
		this.width = width;
		this.height = height;
		this.sprite = document.getElementById(sprite_id);
	}
}

const men = new GameObjectTemplate("men", 0.66, 2.0);
const bush = new GameObjectTemplate("bush", 1.0, 0.58);

class GameObject {
	constructor(template, x, y, z) {
		this.width = template.width;
		this.height = template.height;
		this.sprite = template.sprite;
		
		this.position = vec4.fromValues(x, y, z, 1);

		this.recalcPositions();
	}

	recalcPositions() {
		const x = this.position[0];
		const y = this.position[1];
		const z = this.position[2];

		this.topLeft     = vec4.fromValues(x - this.width / 2, y, z - this.height, 1);
		this.bottomRight = vec4.fromValues(x + this.width / 2, y, z, 1);
	}
}

const scene = document.getElementById('scene');
const context = scene.getContext('2d');
const screenWidth = scene.offsetWidth;
const screenHeight = scene.offsetHeight;

scene.width = screenWidth;
scene.height = screenHeight;

const cameraPosition = vec3.fromValues(0, 0, -2);
const cameraLookAt = vec3.fromValues(0, 1, -2);

const projection = mat4.create();
const view = mat4.create();
const vp = mat4.create();

const aspectRatio = screenWidth / screenHeight;
const FOV = 60;
mat4.perspective(projection, toRadian(FOV), aspectRatio, 0.1, 1000.0);

function updateView() {
	const up = vec3.fromValues(0, 0, 1);
	mat4.lookAt(view, cameraPosition, cameraLookAt, up);
	mat4.mul(vp, projection, view);
}

updateView();

const objects = [];

objects.push(new GameObject(men,  1, 15, 0));
objects.push(new GameObject(men, -1, 25, 0));
objects.push(new GameObject(men,  1.5, 33, 0));
objects.push(new GameObject(bush, -0.5, 45, 0));
objects.push(new GameObject(men,  -3, 66, 0));

const player = new GameObject(men, 0, 5, 0);
objects.push(player);

const topLeftScreen = vec4.create();
const bottomRightScreen = vec4.create();

const topLeftScreenLeft = vec4.create();
const topLeftScreenRight = vec4.create();

const groundEnd = vec4.fromValues(0, 1000, 0, 1);

var keys = [];

function draw() {
	let offsetX = 0.0;
	let offsetY = 0.0;

	if (keys[68] || keys[39]) {
		offsetX =  1;
	} else if (keys[65] || keys[37]) {
		offsetX = -1;
	}
	if (keys[87] || keys[38]) {
		offsetY =  3;
	} else if (keys[83] || keys[40]) {
		offsetY = -3;
	}
	var len = Math.hypot(offsetX, offsetY);
	if (len > 0) {
		len = 1;
		len *= 10;

		offsetX /= len;
		offsetY /= len;

		vec4.add(player.position, player.position, vec4.fromValues(offsetX, offsetY, 0, 0));
		player.recalcPositions();

		vec3.add(cameraPosition, cameraPosition, vec3.fromValues(offsetX, offsetY, 0));
		vec3.add(cameraLookAt, cameraLookAt, vec3.fromValues(offsetX, offsetY, 0));
		updateView();
	}

	context.fillStyle = '#87CEEB';
	context.fillRect(0, 0, scene.width, scene.height);

	vec4.transformMat4(topLeftScreen, groundEnd, vp);
	const groundY = topLeftScreen[1] / topLeftScreen[3];

	context.fillStyle = '#9b7653';
	context.fillRect(0, groundY * screen.height + screenHeight / 2, scene.width, scene.height);

	objects.sort((left, right) => {
		vec4.transformMat4(topLeftScreenLeft, left.topLeft, vp);
		vec4.transformMat4(topLeftScreenRight, right.topLeft, vp);

		const zLeft = topLeftScreenLeft[2] / topLeftScreenLeft[3];
		const zRight = topLeftScreenRight[2] / topLeftScreenRight[3];

		if (zLeft > zRight) 
			return -1;
		else if (zLeft < zRight)
			return 1;
		else	
			return 0;
	});

	objects.forEach((object) => {
		vec4.transformMat4(topLeftScreen, object.topLeft, vp);
		vec4.transformMat4(bottomRightScreen, object.bottomRight, vp);

		const z = topLeftScreen[2] / topLeftScreen[3];
		if (z > 1) {
			return;
		}

		const x1 = topLeftScreen[0] / topLeftScreen[3];
		const y1 = topLeftScreen[1] / topLeftScreen[3];

		const x2 = bottomRightScreen[0] / bottomRightScreen[3];
		const y2 = bottomRightScreen[1] / bottomRightScreen[3];



		const width = x2 - x1;
		const height = y2 - y1;

		context.drawImage(object.sprite, x1 * screenWidth + screenWidth / 2, y1 * screenHeight + screenHeight / 2, width * screenWidth, height * screenHeight);
	});

	requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

window.onkeydown = (event) => {
	keys[event.keyCode] = true;
}

window.onkeyup = (event) => {
	keys[event.keyCode] = false;
}