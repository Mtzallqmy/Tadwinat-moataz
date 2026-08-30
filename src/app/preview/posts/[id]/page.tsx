import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound,redirect } from "next/navigation";
import Link from "next/link";
import { requireCmsUser } from "@/lib/auth/authorization";
import { postsRepository } from "@/lib/repositories/posts";
import { Container } from "@/components/shared/container";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"معاينة المسودة",robots:{index:false,follow:false}};
export default async function PreviewPage({params}:{params:Promise<{id:string}>}){await requireCmsUser("content.read");const mode=await draftMode();if(!mode.isEnabled)redirect("/admin");const {id}=await params;const post=await postsRepository.getAdminPost(id);if(!post)return notFound();return <main className="min-h-screen bg-background"><Container className="py-8"><div className="mb-6 flex items-center justify-between rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-950"><strong>معاينة إدارية — هذه الصفحة غير قابلة للفهرسة.</strong><Link href="/api/preview/disable" className="font-bold underline">إنهاء المعاينة</Link></div><article className="mx-auto max-w-3xl"><h1 className="text-4xl font-black leading-[1.5]">{post.title}</h1><p className="mt-4 leading-8 text-muted-foreground">{post.excerpt}</p>{post.summary?<section className="mt-8 rounded-xl border border-border p-5"><h2 className="font-black">الخلاصة</h2><p className="mt-2 leading-8">{post.summary}</p></section>:null}<div className="article-prose mt-10" dangerouslySetInnerHTML={{__html:post.contentHtml||""}}/></article></Container></main>;}
