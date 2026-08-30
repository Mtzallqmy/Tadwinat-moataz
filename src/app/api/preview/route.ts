import { draftMode } from "next/headers";
import { NextResponse,type NextRequest } from "next/server";
import { getCurrentCmsUser } from "@/lib/auth/authorization";
import { postsRepository } from "@/lib/repositories/posts";
export async function GET(request:NextRequest){const user=await getCurrentCmsUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const id=request.nextUrl.searchParams.get("id");if(!id)return NextResponse.json({error:"Missing post id"},{status:400});const post=await postsRepository.getAdminPost(id);if(!post)return NextResponse.json({error:"Not found"},{status:404});const draft=await draftMode();draft.enable();return NextResponse.redirect(new URL(`/preview/posts/${post.id}`,request.url));}
