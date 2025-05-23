import p from 'planck'
import { Socket } from "socket.io-client";
import { Game } from "../scenes/Game";
import { Player } from "../prefabs/Player";
import { Enemy } from '../prefabs/Enemy';
import { DroppedItem } from '../prefabs/DroppedItem';


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

    constructor(scene: Game){
        this.scene = scene
        this.socket = scene.socket

        scene.player = new Player(scene, 700, 800, this.socket.id as string)
        scene.camera.startFollow(scene.player, true, 0.1, 0.1)

        scene.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
            let x = _pointer.worldX-scene.player.x
            let y = _pointer.worldY-scene.player.y

            const dir = new p.Vec2(x, y)
            dir.normalize()

            scene.player.attackDir = dir
        })

        this.socket.emit('joinGame', 'world1')

        this.socket.on('joinGame', this.joinGame.bind(this))

        this.socket.on('playerJoined', this.playerJoined.bind(this))

        this.socket.on('playerLeft', this.playerLeft.bind(this))

        this.socket.on('output', this.output.bind(this))

        this.socket.on('updateInventory', this.updateInventory.bind(this))

        this.socket.on('otherUpdateInventory', this.otherUpdateInventory.bind(this))

        this.socket.on('otherUpdateHotbar', this.otherUpdateHotbar.bind(this))
    }

    joinGame(account: Account, others: { id: string, items: Item[] }[]){
        const scene = this.scene
        console.log(account)

        scene.player.inventory.updateInventory(account.inventory)

        scene.UI.setupInventory(scene.player)

        others.forEach(v => {
            if(v.id == this.socket.id) return
            console.log(v.id)

            const other = new Player(scene, 700, 800, v.id)
            other.inventory.updateInventory(v.items)
            
            scene.others.push(other)
        })
    }

    playerJoined(id: string, items: Item[]){
        const scene = this.scene

        const other = new Player(scene, 700, 800, id)
        other.inventory.updateInventory(items)

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

                scene.player.health = playerData.health
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
                
                other.health = playerData.health
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
                
                enemy.health = enemyData.health
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
            if(!itemData) item.destroy()
        })
    }

    updateInventory(items: Item[]){
        this.scene.player.inventory.updateInventory(items)
    }

    otherUpdateInventory(id: string, items: Item[]){
        const other = this.scene.others.find(v => v.id == id)
        if(!other) return

        other.inventory.updateInventory(items)
    }

    otherUpdateHotbar(id: string, index: number){
        const other = this.scene.others.find(v => v.id = id)
        if(!other) return

        other.inventory.setActiveIndex(index)
    }

    destroy(){
        this.socket.removeAllListeners()
    }
}