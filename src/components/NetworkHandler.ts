import p from 'planck'
import { Socket } from "socket.io-client";
import { Game } from "../scenes/Game";
import { Player } from "../prefabs/Player";
import { Enemy, enemyList } from '../prefabs/Enemy';
import { DroppedItem } from '../prefabs/DroppedItem';
import { MapSetup } from './MapSetup';
import { Projectile, ProjectileConfig } from '../prefabs/items/RangeWeapon';
import { Item } from '../prefabs/Inventory';
import { isMobile } from '../scenes/GameUI';


export interface OutputData{
    uid: string,
    pos: { x: number, y: number },
    attackDir: { x: number, y: number },
    health: number
    timestamp: number
}

export interface GameState{
    id: string
    players: (OutputData & { xp: number, isPvpProtected: boolean })[]
    enemies: (OutputData & { id: string })[]
    droppedItems: {
        uid: string
        id: string
        pos: { x: number, y: number }
        quantity: number
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
    health: number,
    outfit: {
        isMale: boolean
        color: number
        hair: string
        face: string
        body: string
        leg: string
    }
    inventory: Item[]
}

export class NetworkHandler{

    scene: Game
    socket: Socket
    isAuthed: boolean = false
    pendingOutput: GameState[]

    constructor(scene: Game){
        this.scene = scene
        this.socket = scene.socket

        this.pendingOutput = []

        const enterPos = scene.mapSetup.enterpoint.get('spawn') || { x: 100, y: 100 }
        scene.player = new Player(scene, enterPos.x, enterPos.y, this.socket.id as string, localStorage.getItem('username') || 'null')
        scene.camera.startFollow(scene.player, true, 0.1, 0.1)
        scene.spatialAudio.addListenerBody(scene.player.pBody)
        scene.player.nameText.setColor('#66ffcc')

        if(!isMobile()) scene.player.aimAssist.setVisible(true)

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

        this.socket.on('questProgress', this.questProgress.bind(this))

        this.socket.on('changeGender', this.changeGender.bind(this))

        this.socket.on('changeOutfit', this.changeOutfit.bind(this))

        this.socket.on('chat', this.chat.bind(this))

        this.socket.on('duelRequest', this.duelRequest.bind(this))

        this.socket.on('duelStart', this.duelStart.bind(this))

        this.socket.on('tradeRequest', this.tradeRequest.bind(this))

        this.socket.on('tradeStart', this.tradeStart.bind(this))

        this.socket.on('addTradeItem', this.addTradeItem.bind(this))

        this.socket.on('dealTrade', this.dealTrade.bind(this))

        this.socket.on('tradeEnd', this.tradeEnd.bind(this))

        this.socket.on('serverMessage', this.serverMessage.bind(this))

        this.socket.on('disconnect', () => {
            this.socket.connect()
            setTimeout(() => {
                location.reload()
            }, 10000)
        })
    }

    joinGame(account: Account, others: {
        uid: string
        username: string
        items: Item[]
        activeIndex: number
        pos: { x: number, y: number }
        health: number
        outfit: {
            isMale: boolean
            color: number
            hair: string
            face: string
            body: string
            leg: string
        }
    }[]){
        const scene = this.scene
        
        console.log(account)
        if(account && account.inventory) this.isAuthed = true

        scene.player.syncData(account.health, account.inventory, 0, account.outfit)

        scene.UI.setupUI(scene.player)

        others.forEach(v => {
            if(v.uid == this.socket.id) return
            console.log(v.uid)

            const other = new Player(scene, v.pos.x*scene.gameScale*32, v.pos.y*scene.gameScale*32, v.uid, v.username)
            other.syncData(v.health, v.items, v.activeIndex, v.outfit)

            scene.others.push(other)
        })
    }

    playerJoined(data: {
        uid: string
        username: string
        items: Item[]
        from: string
        health: number
        outfit: {
            isMale: boolean
            color: number
            hair: string
            face: string
            body: string
            leg: string
        }
    }){
        const scene = this.scene

        const pos = scene.mapSetup.enterpoint.get(data.from) || { x: 100, y: 100 }

        const other = new Player(scene, pos.x, pos.y, data.uid, data.username)
        other.syncData(data.health, data.items, 0, data.outfit)

        scene.others.push(other)
    }

    playerLeft(uid: string){
        const scene = this.scene
        const existPlayer = scene.others.find(other => other.uid == uid)

        if(!existPlayer) return

        scene.others.splice(scene.others.indexOf(existPlayer), 1)
        existPlayer.destroy()
    }

    output(data: GameState){
        if(data.id != this.scene.worldId) return

        this.pendingOutput.push(data)
    }

    update(data: GameState){
        const scene = this.scene

        const players = data.players

        players.forEach(playerData => {
            const other = scene.others.find(v => v.uid == playerData.uid)

            if(playerData.uid == scene.player.uid){
                const targetPosition = new p.Vec2(playerData.pos.x, playerData.pos.y)
                const currentPosition = scene.player.pBody.getPosition()

                scene.player.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                scene.player.attackDir = new p.Vec2(playerData.attackDir.x, playerData.attackDir.y)
                scene.player.stats.setTotalXp(playerData.xp)
                scene.player.isPvpProtected = playerData.isPvpProtected

                scene.realBodyPos.set(scene.player.pBody, playerData.pos)

                if(scene.player.health != playerData.health){
                    if(scene.player.health > playerData.health){
                        scene.camera.shake(100, 0.008)
                        scene.player.hitEffect()
                        scene.tweens.add({
                            targets: scene.UI.redEffect,
                            alpha: 0.2,
                            duration: 100,
                            yoyo: true,
                            ease: 'Sine.easeInOut',
                            onComplete: () => scene.UI.redEffect.setAlpha(0)
                        })
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
            
                scene.realBodyPos.set(other.pBody, playerData.pos)
            
                normalized.normalize()

                other.pBody.setPosition(currentPosition.add(targetPosition.sub(currentPosition).mul(0.2)))
                other.attackDir = new p.Vec2(playerData.attackDir.x, playerData.attackDir.y)
                other.stats.setTotalXp(playerData.xp)
                other.isPvpProtected = playerData.isPvpProtected
                
                if(other.health != playerData.health){
                    if(other.health > playerData.health){
                        other.hitEffect()
                    }
                    other.health = playerData.health
                }
                if(other.health <= 0){
                    scene.others.splice(scene.others.indexOf(other), 1)
                    other.destroy()
                    this.scene.add.particles(other.x, other.y, 'red-circle-particle', {
                        color: [0xcc9999],
                        lifespan: 500,
                        speed: { min: 200, max: 300 },
                        scale: { start: 4, end: 0 },
                        gravityY: 500,
                        emitting: false
                    }).explode(8)
                }
            }
        })

        data.enemies.forEach(enemyData => {
            const enemy = scene.enemies.find(v => v.uid == enemyData.uid)
            if(enemy){
                const targetPosition = new p.Vec2(enemyData.pos.x, enemyData.pos.y)
                const currentPosition = enemy.pBody.getPosition()

                const normalized = targetPosition.clone().sub(currentPosition).add(new p.Vec2())

                if(normalized.length() > 0.08) enemy.pBody.setLinearVelocity(normalized)
                else enemy.pBody.setLinearVelocity(new p.Vec2(0, 0))
            
                scene.realBodyPos.set(enemy.pBody, enemyData.pos)
            
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
                    this.scene.add.particles(enemy.x, enemy.y, 'red-circle-particle', {
                        color: [0xcc9999],
                        lifespan: 500,
                        speed: { min: 200, max: 300 },
                        scale: { start: 4, end: 0 },
                        gravityY: 500,
                        emitting: false
                    }).explode(8)
                }
            }


            if(!enemy){
                console.log('spawn enemy')
                const newEnemy = new Enemy(scene, enemyData.pos.x*scene.gameScale*32, enemyData.pos.y*scene.gameScale*32, enemyData.id, enemyData.uid)
                newEnemy.health = enemyData.health
                newEnemy.barUpdate(newEnemy.damageBar)
                this.scene.enemies.push(newEnemy)
            }
        })

        data.droppedItems.forEach(itemData => {
            const item = scene.droppedItems.find(v => v.uid == itemData.uid)
            if(!item){
                console.log('spawn item', itemData)
                const newItem = new DroppedItem(scene, itemData.pos.x, itemData.pos.y, itemData.id, itemData.uid, itemData.quantity)
                this.scene.droppedItems.push(newItem)
            }
        })

        scene.droppedItems.sort(a => a.active ? 1 : -1)
        scene.droppedItems.slice().reverse().forEach((item) => {
            const itemData = data.droppedItems.find(v => v.uid == item.uid)
            if(!itemData){
                scene.droppedItems.splice(scene.droppedItems.indexOf(item), 1)
                item.destroy()
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

        scene.projectiles.sort(a => a.active ? 1 : -1)
        scene.projectiles.slice().reverse().forEach((projectile) => {
            const projectileData = data.projectiles.find(v => v.uid == projectile.uid)
            if(!projectileData){
                scene.projectiles.splice(scene.projectiles.indexOf(projectile), 1)
                projectile.destroy()
            }
        })
        
    }

    updateInventory(items: Item[]){
        this.scene.player.inventory.updateInventory(items)
    }

    otherUpdateInventory(uid: string, items: Item[]){
        const other = this.scene.others.find(v => v.uid == uid)
        if(!other) return

        console.log('other updated', items)

        other.inventory.updateInventory(items)
    }

    otherUpdateHotbar(uid: string, index: number){
        const other = this.scene.others.find(v => v.uid == uid)
        if(!other) return

        console.log('other updated hotbar', index)

        other.inventory.setActiveIndex(index)
    }

    changeWorld(from: string, worldId: string, isPvpAllowed: boolean, requiredLevel: number){
        const scene = this.scene

        if(scene.player.stats.getLevel() < requiredLevel){
            scene.UI.alertBox.setAlert('You need to be level '+requiredLevel+' to enter this world', false)
            return
        }

        console.log('change position by client')

        if(isPvpAllowed) scene.UI.alertBox.setAlert('Do you want to enter pvp zone?', true, () => {
            scene.worldId = worldId
            scene.mapSetup.destroy()
            scene.mapSetup = new MapSetup(scene, worldId)
            
            const enterPos = scene.mapSetup.enterpoint.get(from || 'spawn') || { x: 100, y: 100 }
            
            scene.camera.centerOn(enterPos.x, enterPos.y)
            scene.player.pBody.setPosition(new p.Vec2(enterPos.x/scene.gameScale/32, enterPos.y/scene.gameScale/32))

            scene.world.queueUpdate(() => scene.socket.emit('confirmChangeWorld'))
        })
        else{
            scene.worldId = worldId
            scene.mapSetup.destroy()
            scene.mapSetup = new MapSetup(scene, worldId)
            
            const enterPos = scene.mapSetup.enterpoint.get(from || 'spawn') || { x: 100, y: 100 }
            
            scene.camera.centerOn(enterPos.x, enterPos.y)
            scene.player.pBody.setPosition(new p.Vec2(enterPos.x/scene.gameScale/32, enterPos.y/scene.gameScale/32))

            scene.world.queueUpdate(() => scene.socket.emit('confirmChangeWorld'))
        }

    }

    questProgress(taskInstruction: string, taskProgress?: { type: string, target: string, progress: number, max: number }[]){
        const scene = this.scene

        let text = '\n'
        taskProgress?.forEach(v => {
            let target = ''
            if(v.type == 'kill') target = enemyList.find((enemy) => enemy.id == v.target)?.name || v.target
            text += `${v.type} ${target}: ${v.progress}/${v.max}\n`
        })
        
        scene.UI.instructionText.setText(taskInstruction+text)
    }

    changeGender(uid: string, isMale: boolean){
        const other = this.scene.others.find(v => v.uid == uid)
        if(!other) return

        other.sprite.changeGender(isMale)
    }

    changeOutfit(uid: string, model: string, outfit: string | number){
        const other = this.scene.others.find(v => v.uid == uid)
        if(!other) return

        if(model == 'color' && typeof outfit === 'number') other.sprite.changeHairColor(outfit)
        else if(typeof outfit === 'string') other.sprite.changeOutfit(model, outfit)
    }

    chat(data: { uid: string, username: string, msg: string}){
        const scene = this.scene

        if(scene.player.uid == data.uid){
            scene.player.textbox.writeText(data.msg)
        }
        else{
            const other = scene.others.find(v => v.uid == data.uid)
            if(other) other.textbox.writeText(data.msg)
        }

        const msg = `${data.username} : ${data.msg}`
        console.log(scene.UI.chatTexts.getWrappedText(msg).length)
        const wrap = new Array(scene.UI.chatTexts.getWrappedText(msg).length+1).join('\n')
        scene.UI.chatTexts.setText(scene.UI.chatTexts.text+msg+'\n')
        scene.UI.chatNames.setText(scene.UI.chatNames.text+data.username+wrap)

        scene.UI.chatTexts.y = scene.UI.chatTexts.height > 300 ? -scene.UI.chatTexts.height+400 : 120
        scene.UI.chatNames.y = scene.UI.chatTexts.y-2
    }

    duelRequest(username: string, level: number){
        this.scene.UI.alertBox.setAlert(username+' wants to duel you\nLevel: '+level, true, () => {
            this.socket.emit('duelAccept')
        })
    }

    duelStart(){
        const scene = this.scene

        scene.worldId = 'duel'
        scene.mapSetup.destroy()
        scene.mapSetup = new MapSetup(scene, 'duel')
        
        const enterPos = scene.mapSetup.enterpoint.get('spawn') || { x: 100, y: 100 }
        
        scene.camera.centerOn(enterPos.x, enterPos.y)
        scene.player.pBody.setPosition(new p.Vec2(enterPos.x/scene.gameScale/32, enterPos.y/scene.gameScale/32))
    }

    tradeRequest(username: string){
        this.scene.UI.alertBox.setAlert(username+' wants to trade you', true, () => {
            this.socket.emit('tradeAccept')
        })
    }

    tradeStart(uid: string){
        const scene = this.scene
        
        scene.UI.tradeUI.startTrade(uid, scene.others.find(v => v.uid == uid)?.username || '')
    }

    addTradeItem(selectedIndex: number, id: string, tag: 'weapon' | 'resource' | null, isSelf: boolean, quantity?: number){
        const scene = this.scene
        scene.UI.tradeUI.addTradeItem(selectedIndex, id, tag, isSelf, quantity)

        const state = scene.UI.tradeUI.buttonAccept.text.text == 'CONFIRM' ? '(changed)' : '(ready)'

        scene.UI.tradeUI.otherName.setText(this.scene.UI.tradeUI.otherName.text.split(' ')[0] + ' '+state)
        scene.UI.tradeUI.buttonAccept.setText('Accept')

        scene.UI.tradeUI.buttonAccept.off('pointerdown')
        scene.UI.tradeUI.buttonAccept.on('pointerdown', () => {
            this.socket.emit('dealTrade')
            scene.UI.tradeUI.buttonAccept.setVisible(false)
        })
    }

    dealTrade(){
        const tradeUI = this.scene.UI.tradeUI

        tradeUI.otherName.setText(this.scene.UI.tradeUI.otherName.text.split(' ')[0] + ' (accepted)')
        tradeUI.buttonAccept.setText('CONFIRM?')

        tradeUI.buttonAccept.off('pointerdown')
        tradeUI.buttonAccept.on('pointerdown', () => {
            this.scene.UI.alertBox.setAlert('Are you sure you want to finish the trade?', true, () => {
                this.socket.emit('finishTrade')
            })
        })
    }

    tradeEnd(){
        const scene = this.scene
        scene.UI.tradeUI.endTrade()
    }

    serverMessage(msg: string){
        this.scene.UI.alertBox.setAlert(msg)
    }

    destroy(){
        this.socket.removeAllListeners()
    }
}