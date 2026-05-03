import { pgTable, serial, text, timestamp, boolean, integer, real } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').default(1).notNull(),
  category: text('category').default('other').notNull(),
  dueDate: timestamp('due_date'),
  completed: boolean('completed').default(false).notNull(),
  order: real('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;