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
            reward: { xp: 3, item: [['sword', 1]], gold: 50 }
        },
        {
            id: 'quest2',
            name: 'Collect Wood',
            description: 'I need wood to build a new house. Collect 3 pieces of wood from the forest.',
            taskInstruction: 'Collect 3 Wood',
            task: [{ type: 'collect', target: 'wood', amount: 3  }],
            reward: { xp: 6, item: [['bow', 1]], gold: 20 }
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
    isComplete: boolean = false;
    private progressCallback: (taskProgress: number[], isComplete: boolean) => void = () => {}; // Default empty function

    constructor(config: QuestConfig) {
        this.config = config;
        this.taskProgress = new Array(config.task.length).fill(0);
    }

    setTaskProgress(progress: number[]) {
        if (progress.length !== this.config.task.length) return;
        this.taskProgress = progress;
        this.progressCheck();
        this.progressCallback(this.taskProgress, this.isComplete);
    }

    addProgress(taskType: string, target: string, quantity: number = 1){
        this.config.task.forEach((task, i) => {
            if(task.type == taskType && task.target == target){
                this.taskProgress[i] += quantity;
                if(this.taskProgress[i] > this.config.task[i].amount) {
                    this.taskProgress[i] = this.config.task[i].amount;
                }

                this.progressCheck();
                this.progressCallback(this.taskProgress, this.isComplete);
            }
        })
    }

    private progressCheck() {
        let isComplete = true;
        for (let i = 0; i < this.config.task.length; i++) {
            if (this.taskProgress[i] < this.config.task[i].amount) {
                isComplete = false;
                break;
            }
        }
        this.isComplete = isComplete;
    }

    onProgress(callback: (taskProgress: number[], isComplete: boolean) => void) {
        this.progressCallback = callback;
    }

    destroy(){
        this.progressCallback = () => {}
    }
}


export class Quests {
    static getQuestsByNpcId(npcId: string): Quest[]{
        const quest = quests[npcId]?.map(q => new Quest(q))
        return quest
    }

    static getQuestByNpcId(npcId: string, completedQuest: string[]): Quest | null {
        const quests = this.getQuestsByNpcId(npcId);
        if(!quests || quests.length === 0) return null;

        // Cari quest yang belum selesai atau quest repeatable yang sudah diselesaikan
        for(const quest of quests) {
            const isCompleted = completedQuest.includes(quest.config.id);
            // Berikan quest jika belum selesai atau quest repeatable
            if(!isCompleted || quest.config.repeatable) {
                return quest;
            }
        }

        // Jika semua quest telah diselesaikan dan tidak ada yang repeatable,
        // berikan quest repeatable terakhir jika ada
        for(const quest of quests) {
            if(quest.config.repeatable) {
                return quest;
            }
        }

        return null; // Semua quest telah diselesaikan
    }
}
