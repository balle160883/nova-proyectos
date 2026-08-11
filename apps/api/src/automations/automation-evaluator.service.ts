import { Injectable, Logger } from '@nestjs/common';

export interface ConditionRule {
  field: string;      // e.g. 'status', 'title', 'dueDate', 'assignedToId'
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: any;
}

@Injectable()
export class AutomationEvaluatorService {
  private readonly logger = new Logger(AutomationEvaluatorService.name);

  evaluateConditions(conditionsJson: string | null, itemData: Record<string, any>): boolean {
    if (!conditionsJson) return true; // No conditions = always match

    try {
      const conditions: ConditionRule[] = typeof conditionsJson === 'string' ? JSON.parse(conditionsJson) : conditionsJson;
      if (!Array.isArray(conditions) || conditions.length === 0) return true;

      return conditions.every((cond) => this.evaluateSingleCondition(cond, itemData));
    } catch (err) {
      this.logger.error(`Error parsing conditions: ${err.message}`);
      return false;
    }
  }

  private evaluateSingleCondition(cond: ConditionRule, itemData: Record<string, any>): boolean {
    const fieldValue = itemData[cond.field];

    switch (cond.operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(cond.value).toLowerCase();
      case 'not_equals':
        return String(fieldValue).toLowerCase() !== String(cond.value).toLowerCase();
      case 'contains':
        return String(fieldValue ?? '').toLowerCase().includes(String(cond.value).toLowerCase());
      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case 'greater_than':
        return Number(fieldValue) > Number(cond.value);
      case 'less_than':
        return Number(fieldValue) < Number(cond.value);
      default:
        return false;
    }
  }
}
