import * as p from 'planck'

interface ContactEvent{
    bodyA: p.Body | p.Body[]
    bodyB: p.Body | p.Body[]
    callback: (bodyA: p.Body, bodyB: p.Body) => void
}

export class ContactEvents{

    private events: ContactEvent[]

    constructor(world: p.World){
        this.events = []

        world.on('begin-contact', (contact: p.Contact) => {
            const bodyA = contact.getFixtureA().getBody();
            const bodyB = contact.getFixtureB().getBody();
            
            for(let event of this.events){
                const equationAA = event.bodyA instanceof Array ? event.bodyA.includes(bodyA) : bodyA === event.bodyA
                const equationAB = event.bodyA instanceof Array ? event.bodyA.includes(bodyB) : bodyB === event.bodyA
                const equationBA = event.bodyB instanceof Array ? event.bodyB.includes(bodyA) : bodyA === event.bodyB
                const equationBB = event.bodyB instanceof Array ? event.bodyB.includes(bodyB) : bodyB === event.bodyB

                if ((equationAA || equationAB) &&
                (equationBA || equationBB)){
                    const A = equationAA ? bodyA : bodyB
                    const B = equationAA ? bodyB : bodyA
                    event.callback(A, B);
                }
            }
        })
    }

    addEvent(bodyA: p.Body | p.Body[], bodyB: p.Body | p.Body[], callback: (bodyA: p.Body, bodyB: p.Body) => void){
        this.events.push({
            bodyA,
            bodyB,
            callback
        })
    }

    destroyEventByBody(body: p.Body){
        this.events.filter(event => {
            const equationAA = event.bodyA instanceof Array ? event.bodyA.includes(body) : body === event.bodyA
            const equationAB = event.bodyB instanceof Array ? event.bodyB.includes(body) : body === event.bodyB
            return (equationAA || equationAB)
        }).forEach(event => {
            this.events.splice(this.events.indexOf(event), 1)
        })
    }
}