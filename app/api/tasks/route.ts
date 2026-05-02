import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.number().min(0).max(2).default(1),
  completed: z.boolean().optional(),
});

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);
    
    const newTask = await db.insert(tasks).values({
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority,
      completed: validatedData.completed || false,
    }).returning();
    
    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid task data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}