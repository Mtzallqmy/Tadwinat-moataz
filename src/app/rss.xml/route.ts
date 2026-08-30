import { NextResponse,type NextRequest } from "next/server";
export function GET(request:NextRequest){return NextResponse.redirect(new URL("/feed.xml",request.url),308);}
