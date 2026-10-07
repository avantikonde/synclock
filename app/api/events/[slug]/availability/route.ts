import { NextRequest } from 'next/server';
import { db } from '@/src/prisma/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const { name, email, selectedSlots, participantId } = body;

    // 1. Validate inputs
    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json(
        { error: 'Please enter your name to submit availability' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedSlots)) {
      return Response.json(
        { error: 'selectedSlots must be an array of timestamps' },
        { status: 400 }
      );
    }

    // 2. Fetch the Event
    const event = await db.orm.public.Event.where({ slug }).first();
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      return Response.json(
        { error: 'Voting is closed for this event' },
        { status: 403 }
      );
    }

    // 3. Find or Create the Participant
    let participant = null;

    if (participantId) {
      participant = await db.orm.public.Participant
        .where({ id: participantId, eventId: event.id })
        .first();
    }

    if (!participant) {
      participant = await db.orm.public.Participant
        .where({ eventId: event.id, name: name.trim() })
        .first();
    }

    if (!participant) {
      participant = await db.orm.public.Participant.create({
        name: name.trim(),
        email: email ? email.trim() : null,
        eventId: event.id,
      });
    }

    // 4. Clean-Slate: Remove prior availability rows for this participant
    await db.orm.public.Availability
      .where({ participantId: participant.id })
      .deleteAll();

    // 5. Batch-Insert the new selected slots
    if (selectedSlots.length > 0) {
      const rows = selectedSlots.map((slotTime: string) => ({
        slotTime,
        participantId: participant.id,
      }));
      await db.orm.public.Availability.createAll(rows);
    }

    // 6. Return confirmation
    return Response.json(
      {
        success: true,
        participant: {
          id: participant.id,
          name: participant.name,
        },
        savedCount: selectedSlots.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving availability:', error);
    return Response.json(
      { error: 'Internal Server Error: Failed to save availability' },
      { status: 500 }
    );
  }
}

