class Player {
  constructor(game) {
    this.game = game;
    this.width = 140;
    this.height = 120;
    this.x = this.game.width * .5 - this.width * .5;
    this.y = this.game.height - this.height;
    this.lives = 3;
    this.maxlive = 10;
    this.speed = 15;
    this.image = document.getElementById('player');
    this.image_jest = document.getElementById('player_jets');
    this.frameX = 0;
    this.Jesr_frame = 1;
  }

  draw(context) {
    if (this.game.keys.indexOf(' ') > -1) {
      this.frameX = 3;
    } else this.frameX = 0;
    context.drawImage(this.image_jest, this.Jesr_frame * this.width
      , 0, this.width, this.height, this.x, this.y, this.width, this.height);
    context.drawImage(this.image, this.frameX * this.width
      , 0, this.width, this.height, this.x, this.y, this.width, this.height);
  }
  updata() {
    if (this.game.keys.indexOf('ArrowLeft')) {
      this.x += this.speed
      this.Jesr_frame = 0;
    } if (this.game.keys.indexOf('ArrowRight')) {
      this.x -= this.speed
      this.Jesr_frame = 2;
    }

    if (this.x < -this.width * .5) this.x = -this.width * .3;
    else if (this.x > this.game.width - this.width * .5) this.x = this.game.width
      - this.width * .6
  }
  shoot() {
    const Projectile = this.game.getProjectile();
    if (Projectile) Projectile.start(this.x + this.width * .5, this.y)
  }

  restart() {
    this.x = this.game.width * .5 - this.width * .5;
    this.y = this.game.height - this.height;
    this.lives = 3;
  }
}

class Projectile {
  constructor() {
    this.width = 7;
    this.height = 30;
    this.x = 0;
    this.y = 0;
    this.speed = 20;
    this.free = true;
  }

  draw(context) {
    if (!this.free) {
      context.save()
      context.fillStyle = 'gold'
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
    }
  }
  updata() {
    if (!this.free) {
      this.y -= this.speed;
      if (this.y < -this.height) this.reset();
    }
  }
  start(x, y) {
    this.x = x - this.width * .5;
    this.y = y;
    this.free = false;
  }
  reset() {
    this.free = true;
  }
}

class Enemy {
  constructor(game, positionX, positionY) {
    this.game = game;
    this.height = this.game.enemysize;
    this.width = this.game.enemysize;
    this.x = 0;
    this.y = 0;
    this.positionX = positionX;
    this.positionY = positionY;
    this.markedForDeletion = false;
  }
  draw(context) {
    context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)
  }
  updata(x, y) {
    this.x = x + this.positionX;
    this.y = y + this.positionY;

    this.game.Projectilepool.forEach(projectile => {
      if (!projectile.free && this.game.checkCollison(this, projectile)
        && this.lives > 0) {
        this.hit(1)
        projectile.reset();
      }
    })
    if (this.lives < 1) {
      if (this.game.spriteUpdata) this.frameX++;
      if (this.frameX > this.maxFrame) {
        this.markedForDeletion = true;
        if (!this.game.gameOver) this.game.score += this.maxlives;
      }
    }
    if (this.game.checkCollison(this, this.game.player) && this.lives> 0) {
      this.lives = 0;
      this.game.player.lives--;
    }

    //
    if (this.y + this.height > this.game.height || this.game.lives < 1) {
      this.game.gameOver = true;
    }
  }
  hit(damage) {
    this.lives -= damage
  }
}

class Beetlemorph extends Enemy {
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.image = document.getElementById('beetlemorph');
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 2;
    this.lives = 1;
    this.maxlives = this.lives;
  }
}
class Wave {
  constructor(game) {
    this.game = game;
    this.width = this.game.columns * this.game.enemysize;
    this.height = this.game.rows * this.game.enemysize;
    this.x = this.game.width * .5 - this.width * .5;
    this.y = -this.height;
    this.speedX = Math.random() < .5 ? -1 : 1;
    this.speedY = 0;
    this.enemies = [];
    this.nextWave = false;
    this.create();
  }
  render(context) {
    if (this.y < 0) this.y += 5;
    this.speedY = 0;
    this.x += this.speedX;
    if (this.x < 0 || this.x > this.game.width - this.width) {
      this.speedX *= -1;
      this.speedY = this.game.enemysize;
    }
    this.x += this.speedX;
    this.y += this.speedY;
    this.enemies.forEach(enemy => {
      enemy.updata(this.x, this.y);
      enemy.draw(context);
    })
    this.enemies = this.enemies.filter(obj => !obj.markedForDeletion)
  }
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let enemyX = x * this.game.enemysize
        let enemyY = y * this.game.enemysize
        this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY))
      }
    }
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.player = new Player(this);
    this.keys = [];

    this.Projectilepool = [];
    this.numProjectile = 15;
    this.createProjectile();
    this.fired = false;

    this.columns = 1;
    this.rows = 1;
    this.enemysize = 80;
    this.waves = [];
    this.waves.push(new Wave(this))
    this.wavecount = 1;

    this.score = 0;
    this.gameOver = false;

    this.spriteUpdata = false;
    this.spritetimer = 0;
    this.spriteInterval = 100;
    // events
    window.addEventListener('keydown', e => {
      if (e.key === ' ' && !this.fired) this.player.shoot();
      this.fired = true;
      if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);
      if (e.key === 'g' && this.gameOver) this.restart();
    })

    window.addEventListener('keyup', e => {
      this.fired = false;
      const index = this.keys.indexOf(e.key);
      if (index > -1) this.keys.splice(index, 1);

    })
  }
  render(context, detlatTime) {
    if (this.spritetimer > this.spriteInterval) {
      this.spriteUpdata = true;
      this.spritetimer = 0;
    } else {
      this.spriteUpdata = false;
      this.spritetimer += detlatTime;
    }
    this.drawStatusText(context)
    this.player.draw(context)
    this.player.updata();
    this.Projectilepool.forEach(projectile => {
      projectile.updata();
      projectile.draw(context);
    })
    this.waves.forEach(wave => {
      wave.render(context)
      if (wave.enemies.length < 1 && !wave.nextWave && !this.gameOver) {
        this.newWavee();
        this.wavecount++;
        wave.nextWave = true;
      if(this.player.lives < this.player.maxlive)  this.player.lives++;
      }
    })
  }
  createProjectile() {
    for (let i = 0; i < this.numProjectile; i++) {
      this.Projectilepool.push(new Projectile());
    }
  }
  getProjectile() {
    for (let i = 0; i < this.Projectilepool.length; i++) {
      if (this.Projectilepool[i].free) return this.Projectilepool[i]
    }
  }
  checkCollison(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y + b.y + b.height &&
      a.y + a.height > b.y
    )
  }
  drawStatusText(context) {
    context.save();
    context.fillText('Score: ' + this.score, 20, 40);
    context.fillText('Wave: ' + this.wavecount, 20, 85);
    for (let i = 0; i < this.player.maxlive; i++) {
      context.strokeRect(20 + 20 * i, 100, 10, 15)
    }
    for (let i = 0; i < this.player.lives; i++) {
      context.fillRect(20 + 20 * i, 100, 10, 15)
    }
    if (this.gameOver) {
      context.textAlign = 'center';
      context.font = '100px Impact';
      context.fillText('GAME OVER!', this.width * .5, this.height * .5);
      context.font = '40px Impact';
      context.fillText('Press G To Restart', this.width * .5, this.height * .6);

    }
    context.restore();
  }
  newWavee() {
    if (Math.random() < .5 && this.columns * this.enemysize <
      this.width * 0.8) this.columns++;
    else this.rows++;
    this.waves.push(new Wave(this))
  }

  restart() {
    this.player.restart();
    this.columns = 2;
    this.rows = 2;
    this.waves = [];
    this.waves.push(new Wave(this))
    this.wavecount = 1;
    this.score = 0;
    this.gameOver = false;
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 900;
  canvas.height = 900;
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#feff';
  ctx.font = '38px Impact'

  const game = new Game(canvas);

  let lastTime = 0;
  function animate(timeStamp) {
    let detlatTime = timeStamp - lastTime;
    lastTime = timeStamp
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    game.render(ctx, detlatTime)
    requestAnimationFrame(animate)
  }
  animate(0)
})