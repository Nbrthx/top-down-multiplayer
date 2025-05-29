import p from 'planck'
import { Socket } from "socket.io-client";
import { Game } from "../scenes/Game";
import { Player } from "../prefabs/Player";
import { Enemy } from '../prefabs/Enemy';
import { DroppedItem } from '../prefabs/DroppedItem';
import { MapSetup } from './MapSetup';
import { Projectile, ProjectileConfig } from '../prefabs/items/RangeWeapon';


interface OutputData{
    id: string,
    worldId: string,
    pos: { x: number, y: number },
    attackDir: { x: number, y: number },
    health: number
}

interface GameState{
    players: OutputData[]
    enemies: OutputData[]
    droppedItems: {
        uid: string
        id: string
        name: string
        worldId: string
        pos: { x: number, y: number }
    }[]
    projectiles: {
        uid: string
        pos: { x: number, y: number }
        dir: { x: number, y: number }
        config: ProjectileConfig
    }[]
}

interface Account{
    username: string,
    xp: number,
    inventory: { id: string; name: string }[]
}

interface Item{
    id: string,
    name: string
}

export class NetworkHandler{

    scene: Game
    socket: Socket
    isAuthed: boolean = false

    constructor(scene: Game){
        this.scene = scene
        this.socket = scene.socket

        const enterPos = scene.mapSetup.enterpoint.get('spawn') || { x: 100, y: 100 }
        scene.player = new Player(scene, enterPos.x, enterPos.y, this.socket.id as string, localStorage.getItem('username') || 'null')
        scene.camera.startFollow(scene.player, true, 0.1, 0.1)
        scene.spatialAudio.addListenerBody(scene.player.pBody)
        scene.player.nameText.setColor('#66ffcc')

        scene.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
            let x = _pointer.worldX-scene.player.x
            let y = _pointer.worldY-scene.player.y

            const dir = new p.Vec2(x, y)
            dir.normalize()

            scene.attackDir = dir
        })

        setTimeout(() => {
            if(this.isAuthed) return;
            window.location.reload()
        }, 5000)

        this.socket.emit('joinGame')

        this.socket.on('joinGame', this.joinGame.bind(this))

        this.socket.on('playerJoined', this.playerJoined.bind(this))

        this.socket.on('playerLeft', this.playerLeft.bind(this))

        this.socket.on('output', this.output.bind(this))

        this.socket.on('updateInventory', this.updateInventory.bind(this))

        this.socket.on('otherUpdateInventory', this.otherUpdateInventory.bind(this))

        this.socket.on('otherUpdateHotbar', this.otherUpdateHotbar.bind(this))

        this.socket.on('changeWorld', this.changeWorld.bind(this))

        this.socket.on('chat', this.chat.bind(this))

        this.socket.on('disconnect', () => {
            this.socket.connect()
            setTimeout(() => {
                location.reload()
            }, 10000)
        })
    }

    joinGame(account: Account, others: {
        id: string
        username: string
        items: Item[]
        activeIndex: number
        pos: { x: number, y: number }
    }[]){
        const scene = this.scene
        
        console.log(account)
        if(account && account.inventory) this.isAuthed = true

        scene.player.inventory.updateInventory(account.inventory)
        scene.player.inventory.setActiveIndex(0)

        scene.UI.setupInventory(scene.player)

        others.forEach(v => {
            if(v.id == this.socket.id) return
            console.log(v.id)

            const other = new Player(scene, v.pos.x*scene.gameScale*32, v.pos.y*scene.gameScale*32, v.id, v.username)
            other.inventory.updateInventory(v.items)
            other.inventory.setActiveIndex(v.activeIndex)
            
            scene.others.push(other)
        })
    }

    playerJoined(data: {
        id: string
        username: string
        items: Item[]
        from: string
    }){
        const scene = this.scene

        const pos = scene.mapSetup.enterpoint.get(data.from) || { x: 100, y: 100 }

        const other = new Player(scene, pos.x, pos.y, data.id, data.username)
        other.inventory.updateInventory(data.items)

        scene.others.push(other)
    }

    playerLeft(id: string){
        const scene = this.scene
        const existPlayer = scene.others.find(other => other.id == id)

        if(!existPlayer) return

        scene.others.splice(scene.others.indexOf(existPlayer), 1)
        existPlayer.destroy()
    }

    output(data: GameState){
        const scene = this.scene

        const players = data.players

        players.forEach(playerData => {
            const other = scene.others.find(v => v.id == playerData.id)

            if(playerData.id == scene.player.id){
                const targetPosition = new p.Vec2(playerData.pos.x, playerData.pos.y)
                const currentPosition = scene.player.pBody.getPosition()
                scene.player.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                scene.player.attackDir = new p.Vec2(playerData.attackDir.x, playerData.attackDir.y)

                if(scene.player.health != playerData.health){
                    if(scene.player.health > playerData.health){
                        scene.camera.shake(100, 0.005)
                        scene.player.hitEffect()
                    }
                    scene.player.health = playerData.health
                }
                if(scene.player.health <= 0){
                    this.destroy()
                    scene.scene.start('GameOver')
                }
            }
            else if(other){
                const targetPosition = new p.Vec2(playerData.pos.x, playerData.pos.y)
                const currentPosition = other.pBody.getPosition()

                const normalized = targetPosition.clone().sub(currentPosition).add(new p.Vec2())

                if(normalized.length() > 0.08) other.pBody.setLinearVelocity(normalized)
                else other.pBody.setLinearVelocity(new p.Vec2(0, 0))
            
                normalized.normalize()

                other.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                other.attackDir = new p.Vec2(playerData.attackDir.x, playerData.attackDir.y)
                
                if(other.health != playerData.health){
                    if(other.health > playerData.health){
                        other.hitEffect()
                    }
                    other.health = playerData.health
                }
                if(other.health <= 0){
                    scene.others.splice(scene.others.indexOf(other), 1)
                    other.destroy()
                }
            }
        })

        data.enemies.forEach(enemyData => {
            const enemy = scene.enemies.find(v => v.id == enemyData.id)
            if(!enemy){
                console.log('spawn enemy')
                const newEnemy = new Enemy(scene, enemyData.pos.x*scene.gameScale*32, enemyData.pos.y*scene.gameScale*32, enemyData.id)
                this.scene.enemies.push(newEnemy)
            }

            if(enemy){
                const targetPosition = new p.Vec2(enemyData.pos.x, enemyData.pos.y)
                const currentPosition = enemy.pBody.getPosition()

                const normalized = targetPosition.clone().sub(currentPosition).add(new p.Vec2())

                if(normalized.length() > 0.08) enemy.pBody.setLinearVelocity(normalized)
                else enemy.pBody.setLinearVelocity(new p.Vec2(0, 0))
            
                normalized.normalize()

                enemy.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                enemy.attackDir = new p.Vec2(enemyData.attackDir.x, enemyData.attackDir.y)
                
                if(enemy.health != enemyData.health){
                    if(enemy.health > enemyData.health){
                        enemy.hitEffect()
                    }
                    enemy.health = enemyData.health
                }
                if(enemy.health <= 0){
                    scene.enemies.splice(scene.enemies.indexOf(enemy), 1)
                    enemy.destroy()
                }
            }
        })

        data.droppedItems.forEach(itemData => {
            const item = scene.droppedItems.find(v => v.uid == itemData.uid)
            if(!item){
                console.log('spawn item', itemData)
                const newItem = new DroppedItem(scene, itemData.pos.x, itemData.pos.y, itemData.id, itemData.name, itemData.uid)
                this.scene.droppedItems.push(newItem)
            }
        })

        scene.droppedItems.forEach(item => {
            const itemData = data.droppedItems.find(v => v.uid == item.uid)
            if(!itemData){
                item.destroy()
                scene.droppedItems.splice(scene.droppedItems.indexOf(item))
            }
        })

        data.projectiles.forEach(projectileData => {
            const existProjectile = scene.projectiles.find(v => v.uid == projectileData.uid)

            const pos = new p.Vec2(projectileData.pos.x, projectileData.pos.y)
            const dir = new p.Vec2(projectileData.dir.x, projectileData.dir.y)

            if(!existProjectile){
                console.log('spawn projectile', projectileData)
                const projectile = new Projectile(this.scene, pos, dir, projectileData.config, projectileData.uid)
                this.scene.projectiles.push(projectile)
            }
            else{
                existProjectile.pBody.setPosition(pos)
                existProjectile.update()
            }
        })

        scene.projectiles.forEach(projectile => {
            const projectileData = data.projectiles.find(v => v.uid == projectile.uid)
            if(!projectileData){
                projectile.destroy()
                scene.projectiles.splice(scene.projectiles.indexOf(projectile))
            }
        })

        
    }

    updateInventory(items: Item[]){
        this.scene.player.inventory.updateInventory(items)
    }

    otherUpdateInventory(id: string, items: Item[]){
        const other = this.scene.others.find(v => v.id == id)
        if(!other) return

        console.log('other updated', items)

        other.inventory.updateInventory(items)
    }

    otherUpdateHotbar(id: string, index: number){
        const other = this.scene.others.find(v => v.id = id)
        if(!other) return

        console.log('other updated hotbar', index)

        other.inventory.setActiveIndex(index)
    }

    changeWorld(from: string, worldId: string, callback: () => void){
        const scene = this.scene
        
        scene.mapSetup.destroy()
        scene.mapSetup = new MapSetup(scene, worldId)
        
        const enterPos = scene.mapSetup.enterpoint.get(from || 'spawn') || { x: 100, y: 100 }
        
        scene.camera.centerOn(enterPos.x, enterPos.y)
        scene.player.pBody.setPosition(new p.Vec2(enterPos.x/scene.gameScale/32, enterPos.y/scene.gameScale/32))

        console.log('change position by client')

        callback()
    }

    chat(data: { id: string, username: string, msg: string}){
        const scene = this.scene

        const other = scene.others.find(v => v.id == data.id)
        if(other) other.textbox.writeText(data.msg)
    }

    destroy(){
        this.socket.removeAllListeners()
    }
}