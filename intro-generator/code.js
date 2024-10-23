const FPS = 60;

class Animator {
	constructor(canvas, video, width, height, animation) {
		this.canvas = canvas;
		this.video = video;
		this.width = width;
		this.height = height;
		this.animation = animation;
		this.stream = canvas.captureStream(0);
		this.recorder = new MediaRecorder(this.stream, {
		//	mimeType: 'video/mp4',
			audioBitsPerSecond: 0,
			videoBitsPerSecond: 1024 * 1024 * 5,
		});
		this.chunks = [];

		this.recorder.onstop = () => {
			console.log('recording stopped');
			var blob = new Blob(this.chunks, {'type': this.chunks[0].type});
			const size = this.chunks.reduce((a, blob) => a + blob.size, 0);
			console.log('Total size', size);
			this.chunks = [];
			var url = URL.createObjectURL(blob);
			this.video.src = url;
		};
		this.recorder.ondataavailable = (e)  => {
			console.log('recording data available', e.data.size, this.recorder.state)
			this.chunks.push(e.data);
		};
		this.recorder.error = (e) => {
			console.log('Recorder errored', e);
		};

		this.frameNumber = 0;
		this.resolvePromise = () => {};
	}

	run() {
		const t = this;
		return t.animation.prepare().then(() => {
			t.frameNumber = 0
			return new Promise((resolve, reject) => {
				t.resolvePromise = resolve;
				t.recorder.start(1000);
				t._run();
			});
		});
	}

	_run() {
		var remaining = 0;
		var result = false;
			const start = performance.now();

			result = this.draw();

			const end = performance.now();
			const elapsed = end - start;
			remaining = (1000 / FPS) - elapsed;

			if (result)
				return;
			if (remaining < 0) {
				console.log('Slow frame rate', elapsed);
			}

		setTimeout(() => { this._run() }, remaining);
	}

	draw() {
		this.frameNumber += 1;
		this._draw();

		if (this.stream.requestFrame)
			this.stream.requestFrame();
		else
			this.stream.getTracks().forEach((stream) => {
				if (stream.requestFrame) stream.requestFrame();
				else console.log('No requestFrame for stream', stream);
		});

		if (this.frameNumber > this.animation.duration * FPS) {
			console.log('Stopping recording');
			this.recorder.stop();
			this.resolvePromise();
			return true;
		}
		return false;
	}

	_draw(){
		const ctx = this.canvas.getContext('2d');
		const ctx3D = this.canvas.getContext('webgl');
		ctx.globalCompositionOperation = "source-out";
		ctx.fillStyle = 'white';
		ctx.globalAlpha = 1;
		ctx.clearRect(0,0, this.width, this.height);

		this.animation.draw(ctx, this.frameNumber, this.width, this.height, ctx3D);
	}
}

class Animation {
	constructor(imagePath) {
		this.image = new Image();
		this.imagePath = imagePath;
		this.duration = 7;
		this.maxFrames = FPS * this.duration;
	}

	prepare() {
		var promise = new Promise((resolve, reject) => {
			this.image.onload = () => {
				resolve();
			};
			this.image.src = this.imagePath;
		})
		return promise;
	}

	draw(ctx, frameNumber, width, height) {
		const fadeProgressPct = frameNumber / (FPS * 3.5);
		const progressPct = frameNumber / this.maxFrames;
		
		ctx.fillStyle = 'white';
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, width, height);

		ctx.globalAlpha = fadeProgressPct < 1 ? fadeProgressPct : 1;
		ctx.drawImage(this.image, 0, 0, width, height);
	}
}


class OutroAnimation {
	constructor(imagePath, licenseImagePath) {
		this.image = new Image();
		this.licenseImage = new Image();
		this.imagePath = imagePath;
		this.licenseImagePath = licenseImagePath;
		this.duration = 7;
		this.maxFrames = FPS * this.duration;
	}

	prepare() {
		var p1 = new Promise((resolve, reject) => {
			this.image.onload = () => {
				resolve();
			};
			this.image.src = this.imagePath;
		})
		var p2 = new Promise((resolve, reject) => {
			this.licenseImage.onload = () => {
				resolve();
			};
			this.licenseImage.src = this.licenseImagePath;
		});
		return Promise.all([p1, p2]);
	}

	draw(ctx, frameNumber, width, height) {
		const timeElapsed = frameNumber / FPS;
		const fadeDuration = 3.5;
		const fadeProgressPct = frameNumber / (FPS * fadeDuration);
		const licenseFadeProgress = fadeProgressPct < 1 ? 0 : (frameNumber - (fadeDuration * FPS)) / (0.5 * FPS);
		
		ctx.fillStyle = 'white';
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, width, height);

		ctx.globalAlpha = fadeProgressPct < 1 ? fadeProgressPct : 1;
		ctx.drawImage(this.image, 0, 0, width, height);
		if (fadeProgressPct >= 1) {
			const padding = 15;
     		ctx.globalAlpha = licenseFadeProgress; 
			ctx.drawImage(this.licenseImage,
						  width - this.licenseImage.width - padding,
						  height - this.licenseImage.height - padding,
						  this.licenseImage.width,
						  this.licenseImage.height);
		}

		if (false) {
			ctx.fillStyle = 'red';
			ctx.globalAlpha = 1;
			ctx.font = '48px serif'
			ctx.fillText(timeElapsed + " " + frameNumber, 50, 50);
		}
	}
}

class IntroAnimation {
	constructor(imagePath, title, person) {
		this.image = new Image();
		this.imagePath = imagePath;
		this.title = title;
		this.person = person;
		this.duration = 7;
		this.maxFrames = FPS * this.duration;
	}

	prepare() {
		var promise = new Promise((resolve, reject) => {
			this.image.onload = () => {
				resolve();
			};
			this.image.src = this.imagePath;
		})
		return promise;
	}

	draw(ctx, frameNumber, width, height) {
		const elapsedTime = frameNumber / FPS;
		const fadeProgressPct = frameNumber / (FPS * 3.5);
		const progressPct = frameNumber / this.maxFrames;
		
		ctx.fillStyle = 'white';
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, width, height);

		ctx.globalAlpha = fadeProgressPct < 1 ? fadeProgressPct : 1;
		// center the image
		const padding = 15;
		const desiredWidth = 840;
		const scaledHeight = (desiredWidth / this.image.width) * this.image.height;
		const imageX = (width - desiredWidth) / 2;
		const imageY = height - scaledHeight - padding;
		ctx.drawImage(this.image, imageX, imageY, desiredWidth, scaledHeight);

		if (elapsedTime >= this.duration * 0.25) {
			ctx.fillStyle = 'black';
			ctx.globalAlpha = 1;
			ctx.font = '48px Behrensschirft'
			ctx.textAlign  = 'center';

			// center the text above the image
			const textLineSpacing = 50;
			const textX = imageX + (desiredWidth / 2);
			const textY = height * 0.35;
			ctx.fillText(this.title, textX, textY);

			ctx.font = '32px Behrensschirft'
			ctx.fillText(this.person, textX, textY + (4* textLineSpacing));
		}
	}
}

class IntroAnimation3D extends IntroAnimation {
	constructor(imagePath, title, person) {
		super(imagePath, title, person);

		this._3dCanvas = document.createElement("canvas");
		document.body.appendChild(this._3dCanvas);
		const gl = this._3dCanvas.getContext("webgl");
		this.gl = gl;
		const program = gl.createProgram();
		this.program = program;


		const shaderCode = "void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }";
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		this.fragmentShader = fragmentShader;
		gl.shaderSource(fragmentShader, shaderCode);
		gl.compileShader(fragmentShader);

		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(fragmentShader);
			throw `Couldn't compile fragment shader: ${info}`;
		}
		
		gl.attachShader(program, fragmentShader);
	}
	draw(ctx, frameNumber, width, height, ctx3D) {
		this._3dCanvas.width = width;
		this._3dCanvas.height = height;

		//const threeDImage = new Image(this._3dCanvas.toDataURL());

		//ctx.drawImage(threeDImage, 0, 0, 150, 150);
		
		super.draw(ctx, frameNumber, width, height);
	}
}
