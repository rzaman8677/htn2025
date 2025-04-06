import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  export async function POST(request: Request) {
    try {
      // 1) Parse the incoming JSON body
      const { transcript, question } = await request.json();
  
      console.log("Received transcript:", transcript.slice(0, 50));
      console.log("Received question:", question);
  
      // 2) Prepare messages
      const messages: OpenAI.ChatCompletionMessageParam[]  = [
        {
          role: "system",
          content: "You are an AI assistant. Use the following transcript...",
        },
        {
          role: "user",
          content: `Transcript:\n"${transcript}"\n\nQuestion:\n${question}\n\nAnswer concisely:`,
        },
      ];
  
      // 3) Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 200,
        temperature: 0.7,
      });
      const answer =
        completion.choices?.[0]?.message?.content?.trim() ||  "No response.";
  
      // 4) Return a JSON response with status 200
      return NextResponse.json({ answer }, { status: 200 });
    } catch (error: any) {
      console.error("Error calling OpenAI API:", error);
      // Return a JSON response with status 500
      return NextResponse.json(
        { answer: "", error: error.message ||  "Something went wrong." },
        { status: 500 }
      );
    }
  }
  
  // OPTIONAL: If you want to handle non-POST requests:
  export async function GET() {
    // Return 405 for GET (Method Not Allowed)
    return NextResponse.json(
      { answer: "", error: "Method Not Allowed" },
      { status: 405 }
    );
  }