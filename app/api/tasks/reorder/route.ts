import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const reorderSchema = z.object({
  taskIds: z.array(z.number()),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskIds, completed } = reorderSchema.parse(body);

    const updates = taskIds.map((id, index) =>
      db.update(tasks)
        .set({ order: index })
        .where(eq(tasks.id, id))
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}