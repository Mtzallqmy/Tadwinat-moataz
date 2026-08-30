import { draftMode } from "next/headers";
import { NextResponse,type NextRequest } from "next/server";
export async function GET(request:NextRequest){const draft=await draftMode();draft.disable();return NextResponse.redirect(new URL("/admin/content",request.url));}
