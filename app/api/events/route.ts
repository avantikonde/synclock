import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { db } from '@/src/prisma/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            title, 
            description, 
            hostName, 
            location, 
            startDate, 
            endDate, 
            startHour, 
            endHour, 
            duration, 
            inviteeLimit, 
        } = body;

        if (!title || !hostName || !startDate || !endDate) {
            return Response.json(
                {error: "Missing required fields (title, hostName, startDate, endDate)"},
                {status: 400}
            );
        }

        const parsedStartHour = Number(startHour ?? 9);
        const parsedEndHour = Number(endHour ?? 17);
        const parsedDuration = Number(duration ?? 30);
        const parsedInviteeLimit = Number(inviteeLimit ?? 30);

        if (parsedStartHour >= parsedEndHour) {
            return Response.json(
                {error: "Start hour must be earlier than end hour"},
                {status: 400}
            );
        }
        const slug = randomBytes(4).toString('hex');
        const hostKey = randomBytes(16).toString('hex');

        const newEvent = await db.orm.public.Event.create({
            title: title.trim(),
            description: description ? description.trim() : null,
            hostName: hostName.trim(),
            location: location ? location.trim() : 'Online',
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            startHour: parsedStartHour,
            endHour: parsedEndHour,
            duration: parsedDuration,
            inviteeLimit: parsedInviteeLimit,
            slug,
            hostKey,

        });

        return Response.json(
            {
                success: true, 
                slug: newEvent.slug,
                hostKey: newEvent.hostKey,
                eventId: newEvent.id,
            },
            {status: 201}
        );
        } catch (error) {
            console.error('Error creating event:', error);
            return Response.json(
                { error: 'Internal Server Error: Failed to create event'},
                { status: 500}
            );

    }
}