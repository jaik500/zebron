interface LearningActivity {
  id: string;
  title: string;
  type:
    | 'course'
    | 'test'
    | 'resource'
    | 'lesson';

  category: string;
  progress: number;
  completed: boolean;
  updatedAt: Date;
  route?: string;
}


interface LearningAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
}


interface LearningGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}