import { Game } from "../scenes/Game"
import { QuestConfig } from '../prefabs/ui/QuestUI'
import { enemyList } from "../prefabs/Enemy"

export function handleQuest(scene: Game, id: string, name: string, biography: string, pos: { x: number, y: number }){
    scene.socket.emit('getQuestData', id, (quest: QuestConfig | QuestConfig[], haveOtherQuest: string, progressState: number) => {
    
        let questData = Array.isArray(quest) ? quest[0] : quest

        const config = createQuestConfig(id, questData, haveOtherQuest != '' && haveOtherQuest != questData.id, progressState, name, biography, pos)

        let index = 0
        const changeQuest = (isPrev: boolean) => {
            if(!Array.isArray(quest)) return
            index += isPrev ? -1 : 1

            if(index > 0){
                scene.UI.questUI.buttonPrev.setVisible(true)
            }
            else{
                scene.UI.questUI.buttonPrev.setVisible(false)
            }

            if(index < quest.length - 1){
                scene.UI.questUI.buttonNext.setVisible(true)
            }
            else{
                scene.UI.questUI.buttonNext.setVisible(false)
            }

            const nextConfig = createQuestConfig(id, quest[index], haveOtherQuest != '' && haveOtherQuest != quest[index].id, haveOtherQuest == quest[index].id ? progressState : 0, name, biography, pos)
            scene.UI.questUI.setText(nextConfig, quest[index].id)
        }

        scene.UI.questUI.setText(config, Array.isArray(quest) ? quest[0].id : '', changeQuest)
        if(Array.isArray(quest)){
            if(quest.length > 1) scene.UI.questUI.buttonNext.setVisible(true)
        }

    })
}

function createQuestConfig(id: string, quest: QuestConfig, isHaveOtherQuest: boolean, progressState: number, name: string, biography: string, pos: { x: number, y: number }){
    let warningText = ''
    if(isHaveOtherQuest){
        warningText = 'Careful, you have other quest in progress, it will be overrided'
    }
    else if(progressState == 1){
        warningText = 'You already have this quest in progress'
    }
    else if(progressState == 2){
        warningText = 'Complete this quest to get reward'
    }

    let taskText = ''
    quest.task.forEach((task) => {
        let target = ''
        if(task.type == 'kill') target = enemyList.find((enemy) => enemy.id == task.target)?.name || task.target
        taskText += task.type+': '+target+' x'+task.amount+'\n'
    })

    let rewardText = 'xp: '+quest.reward.xp+'\n'
    if(quest.reward.gold) rewardText += 'gold: '+quest.reward.gold+'\n'
    if(quest.reward.item && quest.reward.item.length > 0){
        rewardText += 'item: '
        let itemLength = quest.reward.item.length
        quest.reward.item.forEach((item, index) => {
            rewardText += item[0]+' x'+item[1]
            if(index < itemLength - 1) rewardText += ', '
        })
    }

    const config = {
        npcId: id,
        npcName: name,
        biography: 'Biography:\n'+biography,
        header: quest.name,
        text: quest.description+'\n\nTask:\n'+taskText+'\nReward:\n'+rewardText,
        warn: warningText,
        pos: {
            x: pos.x,
            y: pos.y
        },
        isHaveOtherQuest: isHaveOtherQuest,
        progressState: progressState
    }

    return config
}