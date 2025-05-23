import p from 'planck'
import { Game } from '../GameWorld';
import { Player } from './Player';

export class DroppedItem{

    scene: Game
    uid: string;
    id: string
    name: string
    pBody: p.Body

    timeout: NodeJS.Timeout


    constructor(scene: Game, x: number, y: number, id: string, name: string){
        this.scene = scene;
        this.uid = crypto.randomUUID();
        this.id = id;
        this.name = name;

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x, y),
            fixedRotation: true
        })
        this.pBody.createFixture({
            shape: new p.Box(0.2, 0.2),
            isSensor: true
        })
        this.pBody.setUserData(this)

        scene.contactEvents.addEvent(scene.entityBodys, this.pBody, (bodyA) => {
            const player = bodyA.getUserData();

            if(!(player instanceof Player)) return;

            if(player.inventory.addItem({ id: this.id, name: this.name })) this.destroy();
        })

        this.timeout = setTimeout(() => {
            this.destroy();
        }, 30000);
    }

    destroy() {
        this.scene.contactEvents.destroyEventByBody(this.pBody);
        this.pBody.getWorld().queueUpdate(world => world.destroyBody(this.pBody))
        clearTimeout(this.timeout);
        this.onDestroy()
    }

    onDestroy(){}
}