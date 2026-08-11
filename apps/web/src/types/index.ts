export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  azureId?: string;
}

export interface Column {
  id: string;
  title: string;
  type: 'TEXT' | 'NUMBER' | 'STATUS' | 'DATE' | 'USER' | 'FILE' | 'FORMULA';
  width: number;
  position: number;
  settingsJson?: string;
}

export interface ColumnValue {
  id: string;
  itemId: string;
  columnId: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  jsonValue?: string;
}

export interface ItemAttachment {
  id: string;
  name: string;
  url: string;
}

export interface ItemComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  position: number;
  groupId: string;
  boardId: string;
  status?: string;
  priority?: 'Alta' | 'Media' | 'Baja' | 'Crítica' | string;
  budget?: number;
  timerSeconds?: number;
  isTimerRunning?: boolean;
  dueDate?: string;
  assignedToId?: string;
  assignedTo?: User;
  createdBy?: User;
  attachments?: ItemAttachment[] | string;
  comments?: ItemComment[] | string;
  columnValues?: ColumnValue[];
}

export interface Group {
  id: string;
  title: string;
  color: string;
  position: number;
  items: Item[];
}

export interface Automation {
  id: string;
  title: string;
  boardId: string;
  isEnabled: boolean;
  triggerType: string;
  conditions?: string;
  actions: string;
  logs?: Array<{
    id: string;
    status: string;
    details: string;
    executedAt: string;
  }>;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  isPublic: boolean;
  teamId?: string;
  createdBy: User;
  columns: Column[];
  groups: Group[];
  automations: Automation[];
}

export interface MeetingActionItem {
  id: string;
  text: string;
  assigneeId?: string;
  isConverted: boolean;
  itemId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  boardId: string;
  calendarEventId?: string;
  startTime: string;
  endTime: string;
  summary?: string;
  actionItems: MeetingActionItem[];
}
