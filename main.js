class GameObjectTemplate {
	sprite;
	
	constuructor(sprite_id, width, height) {
		this.width = width;
		this.height = height;
		this.sprite = document.getElementById(sprite_id);
	}
}

const men = new GameObjectTemplate("men", 0.66, 2.0);
const bush = new GameObjectTemplate("men", 1.0, 0.58);

class GameObject {
	template, position;
	
	constructor(template, x, y, z) {
		this.template = template;
		this.position = vec3.fromValues(x, y, z);
	}
}

let camaraPosition = vec3.fromValues(0, 0, 0);
let cameraDirection = vec3.fromValues(0, 0, 0);