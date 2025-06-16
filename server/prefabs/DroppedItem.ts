import * as p from 'planck'
import { Game } from '../GameWorld';
import { Player } from './Player';

export class DroppedItem{

    scene: Game
    uid: string;
    id: string
    quantity: number

    pBody: p.Body
    isActive: boolean

    timeout: NodeJS.Timeout


    constructor(scene: Game, x: number, y: number, id: string, quantity?: number){
        this.scene = scene;
        this.uid = crypto.randomUUID();
        this.id = id;
        this.quantity = quantity || 1;
        this.isActive = true

        this.pBody = scene.world.createDynamicBody({
            position: new p.Vec2(x, y),
            fixedRotation: true,
            active: false
        })
        this.pBody.createFixture({
            shape: new p.Box(0.3, 0.3),
            isSensor: true
        })
        this.pBody.setUserData(this)

        setTimeout(() => {
            this.pBody.setActive(true)
        }, 200)

        scene.contactEvents.addEvent(scene.entityBodys, this.pBody, (bodyA) => {
            const player = bodyA.getUserData();

            if(!(player instanceof Player)) return;

            if(player.inventory.addItem(this.id, this.quantity)){
                this.isActive = false
            }
        })

        this.timeout = setTimeout(() => {
            this.isActive = false
        }, 30000);
    }

    destroy() {
        this.scene.contactEvents.destroyEventByBody(this.pBody);
        this.pBody.getWorld().queueUpdate(world => world.destroyBody(this.pBody))
        clearTimeout(this.timeout);
    }
}