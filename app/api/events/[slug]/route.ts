import { NextRequest } from 'next/server';
import { db } from '@/src/prisma/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Start a try-catch block to handle any potential errors during database operations
  try {
    // Await the resolution of the 'params' Promise and extract the 'slug' variable from it
    const { slug } = await params;

    // Search the database for the event matching this slug
    // Access the 'Event' table/model in the 'public' schema via the database instance
    const event = await db.orm.public.Event
      .where({ slug })
      .include('participants', (p) => p.include('availabilities'))
      .first();

    // Check if the 'event' variable is falsy (null or undefined), meaning no matching record was found
    if (!event) {
      // If no event was found, construct and return a new JSON response
      return Response.json(
        // Set the response body to an object containing a descriptive error message with the missing slug
        { error: `Event with slug "${slug}" not found` },
        // Set the HTTP status code to 404 (Not Found)
        { status: 404 }
      );
    // Close the if statement
    }

    // Return the event details to the client
    // Send a JSON response with a success flag and the retrieved event object, accompanied by a 200 (OK) status code
    return Response.json({ success: true, event }, { status: 200 });
  
  // Catch any errors that were thrown in the 'try' block (e.g., database connection failures)
  } catch (error) {
    // Log the caught error to the server console for debugging purposes
    console.error('Error fetching event:', error);
    
    // Construct and return a JSON response for the client indicating a failure
    return Response.json(
      // Set the response body to a generic internal server error message
      { error: 'Internal Server Error: Failed to fetch event' },
      // Set the HTTP status code to 500 (Internal Server Error)
      { status: 500 }
    );
  // Close the catch block
  }
// Close the GET function
}