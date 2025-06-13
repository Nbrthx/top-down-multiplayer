

interface Task {
    type: 'kill' | 'collect' | 'deliver' | 'explore' | 'craft'
    target: string
    amount: number
}

export interface QuestConfig{
    id: string
    name: string
    description: string
    taskInstruction: string // make it short
    task: Task[]
    reward: { xp: number, item?: [string, number][], gold?: number }
    repeatable?: boolean
}

// npcId | quest
const quests: {
    [key: string]: QuestConfig[]
} = {
    'npc1': [
        {
            id: 'quest1',
            name: 'Defeat the Goblin King',
            description: 'The Goblin King has been terrorizing our village. Defeat him and bring me his crown.',
            taskInstruction: 'Defeat the Goblin King and bring his crown',
            task: [{ type: 'kill', target: 'enemy1', amount: 1 }],
            reward: { xp: 100, item: [['dagger', 1]], gold: 50 }
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
    'npc3': [
        {
            id: 'quest4',
            name: 'Defeat the Ancient Monster',
            description: 'An ancient monster has awakened and is causing chaos. Defeat it to restore peace.',
            taskInstruction: 'Defeat the Ancient Monster',
            task: [{ type: 'kill', target: 'ancient-monster', amount: 1 }],
            reward: { xp: 80, item: [['ancient-artifact', 1]], gold: 30 },
            repeatable: true
        }
    ]
}

export class Quest {

    config: QuestConfig;
    taskProgress: number[]; // for tracking progress in the task

    constructor(config: QuestConfig) {
        this.config = config;
        this.taskProgress = new Array(config.task.length).fill(0);
    }

    setTaskProgress(progress: number[]) {
        if (progress.length !== this.config.task.length) return;
        this.taskProgress = progress;
        this.isComplete();
    }

    addProgress(taskType: string, target: string, quantity: number = 1){
        this.config.task.forEach((task, i) => {
            if(task.type == taskType && task.target == target){
                if (!this.taskProgress) {
                    this.taskProgress = new Array(this.config.task.length).fill(0);
                }
                this.taskProgress[i] = (this.taskProgress[i] || 0) + quantity;
                
                if( this.taskProgress[i] > this.config.task[i].amount) {
                    this.taskProgress[i] = this.config.task[i].amount;
                }

                this.onProgress(this.taskProgress);
                
                this.isComplete()
            }
        })
    }

    private isComplete() {
        let isComplete = true;
        for (let i = 0; i < this.config.task.length; i++) {
            if (this.taskProgress[i] < this.config.task[i].amount) {
                isComplete = false;
                break;
            }
        }
        if(isComplete) {
            this.onComplete(this.config.reward.xp, this.config.reward.item, this.config.reward.gold);
        }
    }

    onProgress(taskProgress: number[]) { taskProgress; }

    onComplete(xp: number, item?: [string, number][], gold?: number) { xp; item; gold; }

    destroy(){
        this.onProgress = () => {}
        this.onComplete = (xp: number, item?: [string, number][], gold?: number) => { xp; item; gold; }
    }
}


export class Quests {
    static getQuestsByNpcId(npcId: string): Quest[]{
        const quest = quests[npcId]?.map(q => new Quest(q))
        return quest
    }

    static getQuestByNpcId(npcId: string, completedQuest: string[]): Quest | null {
        const quest = this.getQuestsByNpcId(npcId)
        if(!quest || quest.length === 0) return null

        let index = 0
        for(const q of quest){
            if(q.config.repeatable) break
            if(completedQuest.includes(q.config.id)) index++
        }

        return quest[index] || null
    }
}
