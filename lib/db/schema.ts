import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export type Priority = 'low' | 'medium' | 'high';

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').default(1).notNull(), // 0=low,1=medium,2=high
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;