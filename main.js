const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;
const mat4 = glMatrix.mat4;
const toRadian = glMatrix.glMatrix.toRadian;
const quat = glMatrix.quat;

class GameObjectTemplate {
	constructor(sprite_id, width, height) {
		this.width = width;
		this.height = height;
		this.sprite = document.getElementById(sprite_id);
	}
}

const men = new GameObjectTemplate("men", 0.66, 2.0);
const bush = new GameObjectTemplate("bush", 1.0, 0.58);
const snowball = new GameObjectTemplate("snowball", 0.15, 0.15);

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
		this.topRight    = vec4.fromValues(x + this.width / 2, y, z - this.height, 1);

		this.bottomLeft  = vec4.fromValues(x - this.width / 2, y, z, 1);
		this.bottomRight = vec4.fromValues(x + this.width / 2, y, z, 1);
	}
}

const scene = document.getElementById('scene');
const context = scene.getContext('2d');
const screenWidth = scene.offsetWidth;
const screenHeight = scene.offsetHeight;

scene.width = screenWidth;
scene.height = screenHeight;

const cameraPosition = vec3.fromValues(0, -4.5, -5.9);
const cameraLookAt = vec3.fromValues(0, 1, -3);

const projection = mat4.create();
const view = mat4.create();
const vp = mat4.create();

const aspectRatio = screenWidth / screenHeight;
const FOV = 90;
mat4.perspective(projection, toRadian(FOV), aspectRatio, 0.1, 1000.0);

function updateView() {
	const up = vec3.fromValues(0, 0, 1);
	mat4.lookAt(view, cameraPosition, cameraLookAt, up);
	mat4.mul(vp, projection, view);
}

updateView();

const output = vec4.create();
function toScreen(spaceCoord) {
	vec4.transformMat4(output, spaceCoord, vp);

	return {
		x: output[0] / output[3],
		y: output[1] / output[3],
		z: output[2] / output[3]
	}
}

function toCanvas(screenCoord, width, height) {
	if (width === undefined) {
		width = screenCoord.width;
	}
	if (height === undefined) {
		height = screenCoord.height;
	}

	if (width === undefined) {
		width = 0;
	}
	if (height === undefined) {
		height = 0;
	}

	const result = {};
	result.width  = width  * screenWidth;
	result.height = height * screenHeight;

	result.x = screenCoord.x * screenWidth  + screenWidth  / 2 - result.width / 2;
	result.y = screenCoord.y * screenHeight + screenHeight / 2;

	return result;
}

const objects = [];

objects.push(new GameObject(men,  1, 15, 0));
objects.push(new GameObject(men, -1, 25, 0));

var physics = [];
for (var x = -25; x < 25; x++) {
	for (var y = 50; y < 100; y++) {
		var snowballInstance = new GameObject(snowball, x * 0.3, y * 0.3, -10 + randomRange(-1.0, 0.0));
		objects.push(snowballInstance);
		physics.push(snowballInstance);
		snowballInstance.velocity = vec4.fromValues(0, 0, 0, 1);
	}
}
objects.push(new GameObject(men,  1.5, 33, 0));
objects.push(new GameObject(bush, -0.5, 45, 0));
objects.push(new GameObject(men,  -3, 66, 0));

function randomRange(min, max) {
	return Math.random() * (max - min + 1) + min;
}

const player = new GameObject(men, 0, 5, 0);
objects.push(player);

const groundEnd = vec4.fromValues(0, 1000, 0, 1);

var keys = [];

function applyControls() {
	let offsetX = 0.0;
	let offsetY = 0.0;

	if (keys[68] || keys[39]) {
		offsetX =  1;
	} else if (keys[65] || keys[37]) {
		offsetX = -1;
	}
	if (keys[87] || keys[38]) {
		offsetY =  1;
	} else if (keys[83] || keys[40]) {
		offsetY = -1;
	}
	var len = Math.hypot(offsetX, offsetY);
	if (len > 0) {
		len *= 10;

		offsetX /= len;
		offsetY /= len;

		vec4.add(player.position, player.position, vec4.fromValues(offsetX, offsetY, 0, 0));
		player.recalcPositions();

		vec3.add(cameraPosition, cameraPosition, vec3.fromValues(offsetX, offsetY, 0));
		vec3.add(cameraLookAt, cameraLookAt, vec3.fromValues(offsetX, offsetY, 0));
		updateView();
	}
}

function objectToFourPoints(object) {
	return {
		topLeft: toScreen(object.topLeft),
		topRight: toScreen(object.topRight),

		bottomLeft: toScreen(object.bottomLeft),
		bottomRight: toScreen(object.bottomRight)
	}
}

function fourPointsToCenterWidthHeight(fourPoints) {
	const topWidth    = fourPoints.topRight.x    - fourPoints.topLeft.x;
	const bottomWidth = fourPoints.bottomRight.x - fourPoints.bottomLeft.x;

	const leftHeight  = fourPoints.bottomLeft.y  - fourPoints.topLeft.y;
	const rightHeight = fourPoints.bottomRight.y - fourPoints.topRight.y;

	return {
		x: (fourPoints.topLeft.x + fourPoints.topRight.x + fourPoints.bottomLeft.x + fourPoints.bottomRight.x) / 4,
		y: (fourPoints.topLeft.y + fourPoints.topRight.y) / 2,
		z: Math.max(fourPoints.topLeft.z, fourPoints.topRight.z, fourPoints.bottomLeft.z, fourPoints.bottomRight.z),
		width: (topWidth + bottomWidth) / 2,
		height: (rightHeight + leftHeight) / 2
	}
}

function processPhysics() {
	const t = vec4.fromValues(1 / 60, 1 / 60, 1 / 60, 1);
	const gravity = vec4.create();
	vec4.mul(gravity, vec4.fromValues(0, 0, 9.8, 1), t);
	
	physics.forEach((object) => {
		vec4.add(object.velocity, object.velocity, gravity);
		const positionOffset = vec4.create();
		vec4.mul(positionOffset, object.velocity, t);
		vec4.add(object.position, object.position, positionOffset);
		if (object.position[2] > 0) {
			object.velocity[2] = -object.velocity[2] * 1.0;
			object.position[2] = 0;
		}
		object.velocity[1] -= 0.005;
		object.recalcPositions();
	});
}

function draw() {
	applyControls();
	processPhysics();

	context.fillStyle = '#87CEEB'; // sky
	context.fillRect(0, 0, scene.width, scene.height);

	const groundPlane = toCanvas(toScreen(groundEnd), 1, 1);

	context.fillStyle = '#9b7653';
	context.fillRect(0, groundPlane.y, groundPlane.width, groundPlane.height * 2);

	context.strokeStyle = 'black';
	context.beginPath();

	const startX = Math.trunc(cameraPosition[0]);
	const startY = Math.trunc(cameraPosition[1]);

	for (let x = -100; x <= 100; x++) {
		const startH = toCanvas(toScreen(vec4.fromValues(x, startY + 3, 0, 1)));
		const endH   = toCanvas(toScreen(vec4.fromValues(x, startY + 30, 0, 1)));

		context.moveTo(startH.x, startH.y);
		context.lineTo(endH.x, endH.y);
	}

	for (let y = 3; y <= 30; y++) {
		const startV = toCanvas(toScreen(vec4.fromValues(startX - 1000, startY + y, 0, 1)));
		const endV   = toCanvas(toScreen(vec4.fromValues(startX + 1000, startY + y, 0, 1)));

		context.moveTo(startV.x, startV.y);
		context.lineTo(endV.x, endV.y);
	}

	context.stroke();

	objects.sort((left, right) => {
		const zLeft  = fourPointsToCenterWidthHeight(objectToFourPoints(left)).z;
		const zRight = fourPointsToCenterWidthHeight(objectToFourPoints(right)).z;

		if (zLeft > zRight) 
			return -1;
		else if (zLeft < zRight)
			return 1;
		else	
			return 0;
	});

	objects.forEach((object) => {
		const screenRect = fourPointsToCenterWidthHeight(objectToFourPoints(object));

		const z = screenRect.z;
		if (z > 1) {
			return;
		}

		const canvasRect = toCanvas(screenRect);

		context.drawImage(object.sprite, canvasRect.x, canvasRect.y, canvasRect.width, canvasRect.height);
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