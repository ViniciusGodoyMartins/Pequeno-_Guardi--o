import Phaser from 'phaser';
export class Enemy extends Phaser.Physics.Arcade.Sprite{
  constructor(s,x,y,k){
    super(s,x,y,k);
    s.add.existing(this);
    s.physics.add.existing(this);
    this.kind=k;
    this.hp={
      virus:2,trojan:4,spyware:3,phishing:3,ransomware:6,worm:2
    }[k];
    this.points={
      virus:100,trojan:240,spyware:220,phishing:260,ransomware:400,worm:140
    }[k];
    this.last=0;
    this.counted=false;
    this.setCollideWorldBounds(true)
  }take(d=1){
    if(!this.active||this.counted)return;
    this.hp-=d;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60,()=>this.active&&this.clearTint());
    if(this.hp<=0)this.scene.killEnemy(this)
  }ai(p,t){
    const dx=p.x-this.x,ad=Math.abs(dx);
    if(this.kind==='virus'||this.kind==='worm'||this.kind==='trojan')this.setVelocityX(Math.sign(dx)*(this.kind==='worm'?135:this.kind==='trojan'?145:95));
    else{
      this.setVelocityX(ad<260?-Math.sign(dx)*70:ad>430?Math.sign(dx)*50:0);
      if(ad<560&&t>this.last+1500){
        this.last=t;
        this.scene.enemyFire(this,p)
      }
    }
  }
}