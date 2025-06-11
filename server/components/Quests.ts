interface Task {
    type: 'kill' | 'collect' | 'deliver' | 'explore' | 'craft'
    target: string
    amount: number
}

interface Quest{
    id: string
    name: string
    description: string
    taskInstruction: string // make it short
    task: Task[]
    reward: { xp: number, item?: [string, number][], gold?: number }
}

// npcId | quest
const quests: {
    [key: string]: Quest[] | Quest | (Quest & { canRepeat: true })
} = {
    'npc1': [
        {
            id: 'quest1',
            name: 'Defeat the Goblin King',
            description: 'The Goblin King has been terrorizing our village. Defeat him and bring me his crown.',
            taskInstruction: 'Defeat the Goblin King and bring his crown',
            task: [{ type: 'kill', target: 'goblin-king', amount: 1 }],
            reward: { xp: 100, item: [['goblin-crown', 1]], gold: 50 }
        },
        {
            id: 'quest2',
            name: 'Collect Healing Herbs',
            description: 'I need healing herbs to treat the wounded. Collect 5 healing herbs from the forest.',
            taskInstruction: 'Collect 5 Healing Herbs',
            task: [{ type: 'collect', target: 'healing-herb', amount: 5 }],
            reward: { xp: 50, item: [['healing-potion', 1]], gold: 20 }
        }
    ],
    'npc2': [
        {
            id: 'quest3',
            name: 'Deliver the Message',
            description: 'Deliver this message to the village elder in the north.',
            taskInstruction: 'Deliver the message to the Village Elder',
            task: [{ type: 'deliver', target: 'village-elder', amount: 1 }],
            reward: { xp: 30, gold: 10 }
        }
    ],
    'npc3': {
        id: 'quest4',
        name: 'Defeat the Ancient Monster',
        description: 'An ancient monster has awakened and is causing chaos. Defeat it to restore peace.',
        taskInstruction: 'Defeat the Ancient Monster',
        task: [{ type: 'kill', target: 'ancient-monster', amount: 1 }],
        reward: { xp: 80, item: [['ancient-artifact', 1]], gold: 30 },
        canRepeat: true
    }
}


export class Quests {
    static getQuestsByNpcId(npcId: string): Quest[] | Quest{
        return quests[npcId] || null
    }

    static getQuestById(npcId: string, questId: string): Quest | undefined {
        const npcQuests = this.getQuestsByNpcId(npcId)
        if (Array.isArray(npcQuests)) {
            return npcQuests.find(q => q.id === questId)
        }
        if(npcQuests.id === questId) {
            return npcQuests
        }
        return undefined
    }
}
