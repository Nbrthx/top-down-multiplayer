import p from 'planck'
import { Game } from '../scenes/Game';

export function createDebugGraphics(scene: Game, debugGraphics: Phaser.GameObjects.Graphics) {
    debugGraphics.clear()

    for (let body = scene.world.getBodyList(); body; body = body.getNext()) {
        const position = body.getPosition();
        const angle = body.getAngle();

        let color: number = 0x999999
        switch(body.getType()){
            case p.Body.KINEMATIC: color = 0xffff00; break;
            case p.Body.DYNAMIC: color = 0x00ffff; break;
            case p.Body.STATIC: color = 0x0000ff; 
        }
        color = body.isActive() ? color : 0x999999

        debugGraphics.lineStyle(2, color, 1);
        for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            const shape = fixture.getShape();

            if (shape instanceof p.Box) {
                const vertices = shape.m_vertices

                const transformedVertices = vertices.map(v => {
                    return v.clone().add(shape.m_centroid);
                }).map(v => {
                    const rotatedX = v.x * Math.cos(angle) - v.y * Math.sin(angle);
                    const rotatedY = v.x * Math.sin(angle) + v.y * Math.cos(angle);
                    return new p.Vec2(rotatedX, rotatedY).add(position).sub(shape.m_centroid);
                });

                debugGraphics.beginPath()
                debugGraphics.moveTo(transformedVertices[0].x * scene.gameScale * 32, transformedVertices[0].y * scene.gameScale * 32);
                for (let i = 1; i < transformedVertices.length; i++) {
                    debugGraphics.lineTo(transformedVertices[i].x * scene.gameScale * 32, transformedVertices[i].y * scene.gameScale * 32);
                }
                debugGraphics.closePath();
                debugGraphics.strokePath();
            }
            if(shape instanceof p.Circle){
                const center = shape.m_p.clone().add(position);
                debugGraphics.strokeCircle(center.x * scene.gameScale * 32, center.y * scene.gameScale * 32, shape.m_radius * scene.gameScale * 32)
            }
        }
    }
}