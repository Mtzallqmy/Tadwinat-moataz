import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { slugCandidate, slugify } from "@/lib/content/slug";
import { renderContentJson, contentJsonToText } from "@/lib/content/render";
import { countWords, readingMinutes } from "@/lib/content/quality";
import { posts as mockPosts } from "@/data/posts";
import type { ContentType, Post, PostReference, PostFaq } from "@/types/content";

const POST_SELECT = `
  id, author_id, type, status, title, slug, excerpt, summary, key_points, content_json, content_html, content_text,
  external_url, featured, published_at, scheduled_at, archived_at, created_at, updated_at, deleted_at,
  seo_title, seo_description, canonical_url, robots_index, robots_follow, og_title, og_description,
  og_image_id, twitter_title, twitter_description, twitter_image_id, focus_keyword, medical_reviewed,
  last_publish_error, publish_attempts, cover_image_id,
  cover:media!posts_cover_image_id_fkey(id, bucket, path, alt_text),
  og_image:media!posts_og_image_id_fkey(id, bucket, path, alt_text),
  twitter_image:media!posts_twitter_image_id_fkey(id, bucket, path, alt_text),
  author:profiles!posts_author_id_fkey(id, display_name, avatar_url, bio),
  post_categories(is_primary, category:categories(id, slug, name, description, icon, color, parent_id, is_active)),
  post_tags(tag:tags(id, slug, name, description)),
  post_references(id,title,url,publisher,author,published_date,accessed_at,sort_order),
  post_faqs(id,question,answer,sort_order)
`;

type Row = Record<string, unknown>;
type ListFilters = { page?: number; pageSize?: number; search?: string; type?: string; status?: string; categoryId?: string; categorySlug?: string; authorId?: string; };
export type SearchFilters = { query?: string; type?: ContentType; categorySlug?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number; };

function firstObject(value: unknown): Row | null { if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null; return value && typeof value === "object" ? value as Row : null; }
function mediaPublicUrl(relation: unknown, publicUrl: (bucket: string, path: string) => string) { const media=firstObject(relation); return media && typeof media.bucket === "string" && typeof media.path === "string" ? publicUrl(media.bucket,media.path) : null; }
function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function mapReference(row: Row): PostReference { return { id:String(row.id), title:String(row.title), url:typeof row.url==="string"?row.url:null, publisher:typeof row.publisher==="string"?row.publisher:null, author:typeof row.author==="string"?row.author:null, publishedDate:typeof row.published_date==="string"?row.published_date:null, accessedAt:typeof row.accessed_at==="string"?row.accessed_at:null, sortOrder:typeof row.sort_order==="number"?row.sort_order:0 }; }
function mapFaq(row: Row): PostFaq { return { id:String(row.id), question:String(row.question), answer:String(row.answer), sortOrder:typeof row.sort_order==="number"?row.sort_order:0 }; }

export function mapPostRow(row: Row, publicUrl: (bucket: string, path: string) => string): Post {
  const cover=firstObject(row.cover); const author=firstObject(row.author);
  const categoryLinks=Array.isArray(row.post_categories)?row.post_categories as Row[]:[];
  const categoryRows=categoryLinks.map((link)=>({link,category:firstObject(link.category)})).filter((entry): entry is {link:Row;category:Row}=>Boolean(entry.category));
  const primary=categoryRows.find(({link})=>link.is_primary===true)?.category??categoryRows[0]?.category;
  const tagLinks=Array.isArray(row.post_tags)?row.post_tags as Row[]:[];
  const tags=tagLinks.map((link)=>firstObject(link.tag)?.slug).filter((slug): slug is string=>typeof slug==="string");
  const contentText=typeof row.content_text==="string"?row.content_text:"";
  const wordCount=countWords(contentText);
  const references=(Array.isArray(row.post_references)?row.post_references as Row[]:[]).map(mapReference).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));
  const faqs=(Array.isArray(row.post_faqs)?row.post_faqs as Row[]:[]).map(mapFaq).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));
  const fallbackDate=typeof row.created_at==="string"?row.created_at:new Date(0).toISOString();
  return {
    id:String(row.id), slug:String(row.slug), title:String(row.title), excerpt:typeof row.excerpt==="string"?row.excerpt:"",
    summary:typeof row.summary==="string"?row.summary:null, keyPoints:stringArray(row.key_points),
    category:typeof primary?.slug==="string"?primary.slug:"misc", categoryName:typeof primary?.name==="string"?primary.name:undefined,
    categories:categoryRows.map(({category})=>String(category.slug)), contentType:row.type as ContentType, status:row.status as Post["status"],
    publishedAt:typeof row.published_at==="string"?row.published_at:fallbackDate, scheduledAt:typeof row.scheduled_at==="string"?row.scheduled_at:null,
    updatedAt:typeof row.updated_at==="string"?row.updated_at:undefined, createdAt:typeof row.created_at==="string"?row.created_at:undefined,
    readingMinutes:readingMinutes(contentText), wordCount, views:0,
    cover:cover&&typeof cover.bucket==="string"&&typeof cover.path==="string"?publicUrl(cover.bucket,cover.path):"/demo/cover-personal.svg",
    coverImageId:typeof row.cover_image_id==="string"?row.cover_image_id:null, coverAlt:cover&&typeof cover.alt_text==="string"?cover.alt_text:String(row.title),
    featured:row.featured===true, tags,
    author:author?{id:typeof author.id==="string"?author.id:undefined,name:typeof author.display_name==="string"?author.display_name:"معتز العلقمي",avatar:typeof author.avatar_url==="string"?author.avatar_url:undefined,bio:typeof author.bio==="string"?author.bio:undefined}:undefined,
    contentHtml:typeof row.content_html==="string"?row.content_html:"", contentText, contentJson:row.content_json&&typeof row.content_json==="object"?row.content_json as Record<string,unknown>:undefined,
    externalUrl:typeof row.external_url==="string"?row.external_url:null, references, faqs,
    seoTitle:typeof row.seo_title==="string"?row.seo_title:null, seoDescription:typeof row.seo_description==="string"?row.seo_description:null, canonicalUrl:typeof row.canonical_url==="string"?row.canonical_url:null,
    robotsIndex:row.robots_index!==false, robotsFollow:row.robots_follow!==false, ogTitle:typeof row.og_title==="string"?row.og_title:null, ogDescription:typeof row.og_description==="string"?row.og_description:null,
    ogImageId:typeof row.og_image_id==="string"?row.og_image_id:null, ogImage:mediaPublicUrl(row.og_image,publicUrl), twitterTitle:typeof row.twitter_title==="string"?row.twitter_title:null,
    twitterDescription:typeof row.twitter_description==="string"?row.twitter_description:null, twitterImageId:typeof row.twitter_image_id==="string"?row.twitter_image_id:null, twitterImage:mediaPublicUrl(row.twitter_image,publicUrl),
    focusKeyword:typeof row.focus_keyword==="string"?row.focus_keyword:null, medicalReviewed:row.medical_reviewed===true, lastPublishError:typeof row.last_publish_error==="string"?row.last_publish_error:null,
    publishAttempts:typeof row.publish_attempts==="number"?row.publish_attempts:0,
  };
}

function mockPage(page=1,pageSize=12,type?:string) { const filtered=type?mockPosts.filter((p)=>p.contentType===type):mockPosts; const start=Math.max(0,page-1)*pageSize; return {posts:filtered.slice(start,start+pageSize),count:filtered.length,page,pageSize}; }
async function mapPublicRows(rows: Row[]) { const supabase=createPublicClient(); const url=(bucket:string,path:string)=>supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl; return rows.map((row)=>mapPostRow(row,url)); }
async function categoryPostIds(categoryId?:string,categorySlug?:string,admin=false) {
  if (!categoryId&&!categorySlug) return null;
  const supabase=admin?await createClient():createPublicClient(); let id=categoryId;
  if (!id&&categorySlug) { const {data,error}=await supabase.from("categories").select("id").eq("slug",categorySlug).maybeSingle(); if(error) throw new Error(`CATEGORY_LOOKUP_FAILED: ${error.message}`); id=typeof data?.id==="string"?data.id:undefined; }
  if (!id) return [] as string[];
  const {data,error}=await supabase.from("post_categories").select("post_id").eq("category_id",id); if(error) throw new Error(`CATEGORY_POSTS_FAILED: ${error.message}`);
  return (data??[]).map((row)=>String(row.post_id));
}

export const postsRepository = {
  async listPublished({page=1,pageSize=12,type,categoryId,categorySlug}: Pick<ListFilters,"page"|"pageSize"|"type"|"categoryId"|"categorySlug">={}) {
    if(!isSupabaseConfigured()) return mockPage(page,pageSize,type);
    const supabase=createPublicClient(); const from=Math.max(0,page-1)*pageSize; const ids=await categoryPostIds(categoryId,categorySlug,false);
    if(ids&&ids.length===0) return {posts:[],count:0,page,pageSize};
    let query=supabase.from("posts").select(POST_SELECT,{count:"exact"}).eq("status","published").is("deleted_at",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).range(from,from+pageSize-1);
    if(type) query=query.eq("type",type); if(ids) query=query.in("id",ids);
    const {data,error,count}=await query; if(error) throw new Error(`PUBLIC_POSTS_QUERY_FAILED: ${error.message}`);
    return {posts:await mapPublicRows((data??[]) as Row[]),count:count??0,page,pageSize};
  },
  async getPublishedBySlug(slug:string) {
    if(!isSupabaseConfigured()) return mockPosts.find((post)=>post.slug===slug)??null;
    const supabase=createPublicClient(); const {data,error}=await supabase.from("posts").select(POST_SELECT).eq("slug",slug).eq("status","published").is("deleted_at",null).lte("published_at",new Date().toISOString()).maybeSingle();
    if(error) throw new Error(`PUBLIC_POST_QUERY_FAILED: ${error.message}`); return data?(await mapPublicRows([data as Row]))[0]??null:null;
  },
  async getFeatured() {
    if(!isSupabaseConfigured()) return mockPosts.find((post)=>post.featured)??mockPosts[0]??null;
    const supabase=createPublicClient(); const {data,error}=await supabase.from("posts").select(POST_SELECT).eq("status","published").eq("featured",true).is("deleted_at",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(1).maybeSingle();
    if(error) throw new Error(`FEATURED_POST_QUERY_FAILED: ${error.message}`); return data?(await mapPublicRows([data as Row]))[0]??null:null;
  },
  async getRelated(postId:string,limit=3) {
    if(!isSupabaseConfigured()) { const source=mockPosts.find((p)=>p.id===postId); return source?mockPosts.filter((p)=>p.id!==postId&&p.category===source.category).slice(0,limit):[]; }
    const supabase=createPublicClient(); const {data,error}=await supabase.rpc("related_public_posts",{p_post_id:postId,p_limit:limit}); if(error) throw new Error(`RELATED_POSTS_QUERY_FAILED: ${error.message}`);
    const order=(data??[] as Row[]).map((row)=>String(row.id)); if(!order.length) return [];
    const {data:rows,error:rowsError}=await supabase.from("posts").select(POST_SELECT).in("id",order); if(rowsError) throw new Error(`RELATED_POST_ROWS_FAILED: ${rowsError.message}`);
    const mapped=await mapPublicRows((rows??[]) as Row[]); return mapped.sort((a,b)=>order.indexOf(a.id??"")-order.indexOf(b.id??""));
  },
  async searchPublic(filters: SearchFilters={}) {
    const {query="",type,categorySlug,dateFrom,dateTo,page=1,pageSize=12}=filters;
    if(!isSupabaseConfigured()) { const normalized=query.trim().toLocaleLowerCase("ar"); const matches=mockPosts.filter((p)=>(!normalized||`${p.title} ${p.excerpt}`.toLocaleLowerCase("ar").includes(normalized))&&(!type||p.contentType===type)&&(!categorySlug||p.category===categorySlug)); const start=Math.max(0,page-1)*pageSize; return {posts:matches.slice(start,start+pageSize),count:matches.length,page,pageSize}; }
    const supabase=createPublicClient(); const {data,error}=await supabase.rpc("search_public_posts",{p_query:query,p_type:type??null,p_category_slug:categorySlug??null,p_date_from:dateFrom??null,p_date_to:dateTo??null,p_limit:pageSize,p_offset:Math.max(0,page-1)*pageSize});
    if(error) throw new Error(`PUBLIC_SEARCH_FAILED: ${error.message}`); const result=(data??[]) as Row[]; const ids=result.map((row)=>String(row.id)); const count=typeof result[0]?.total_count==="number"?result[0].total_count:Number(result[0]?.total_count??0);
    if(!ids.length) return {posts:[],count:0,page,pageSize}; const {data:rows,error:rowsError}=await supabase.from("posts").select(POST_SELECT).in("id",ids); if(rowsError) throw new Error(`PUBLIC_SEARCH_ROWS_FAILED: ${rowsError.message}`);
    const mapped=await mapPublicRows((rows??[]) as Row[]); return {posts:mapped.sort((a,b)=>ids.indexOf(a.id??"")-ids.indexOf(b.id??"")),count,page,pageSize};
  },
  async listSitemapEntries() {
    if(!isSupabaseConfigured()) return mockPosts.map((post)=>({slug:post.slug,type:post.contentType,updatedAt:post.updatedAt||post.publishedAt,publishedAt:post.publishedAt,robotsIndex:true}));
    const supabase=createPublicClient(); const {data,error}=await supabase.from("posts").select("slug,type,updated_at,published_at,robots_index").eq("status","published").eq("robots_index",true).is("deleted_at",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}); if(error) throw new Error(`SITEMAP_POSTS_FAILED: ${error.message}`);
    return (data??[]).map((row)=>({slug:String(row.slug),type:row.type as ContentType,updatedAt:String(row.updated_at),publishedAt:String(row.published_at),robotsIndex:row.robots_index!==false}));
  },
  async listAdmin(filters: ListFilters={}) {
    const {page=1,pageSize=25,search,type,status,categoryId,authorId}=filters; const supabase=await createClient(); const from=Math.max(0,page-1)*pageSize; const ids=await categoryPostIds(categoryId,undefined,true); if(ids&&ids.length===0) return {posts:[],count:0,page,pageSize};
    let query=supabase.from("posts").select(POST_SELECT,{count:"exact"}).is("deleted_at",null).order("updated_at",{ascending:false}).range(from,from+pageSize-1);
    if(search) query=query.ilike("title",`%${search.replace(/[%_]/g,"\\$&")}%`); if(type) query=query.eq("type",type); if(status) query=query.eq("status",status); if(authorId) query=query.eq("author_id",authorId); if(ids) query=query.in("id",ids);
    const {data,error,count}=await query; if(error) throw new Error(`ADMIN_POSTS_QUERY_FAILED: ${error.message}`);
    const publicClient=createPublicClient(); const url=(bucket:string,path:string)=>publicClient.storage.from(bucket).getPublicUrl(path).data.publicUrl; return {posts:((data??[]) as Row[]).map((row)=>mapPostRow(row,url)),count:count??0,page,pageSize};
  },
  async getAdminById(id:string) { const supabase=await createClient(); const {data,error}=await supabase.from("posts").select(POST_SELECT).eq("id",id).maybeSingle(); if(error) throw new Error(`ADMIN_POST_QUERY_FAILED: ${error.message}`); return data as Row|null; },
  async getAdminPost(id:string) { const row=await this.getAdminById(id); if(!row) return null; const publicClient=createPublicClient(); return mapPostRow(row,(bucket,path)=>publicClient.storage.from(bucket).getPublicUrl(path).data.publicUrl); },
  async ensureUniqueSlug(input:string,currentId?:string) { const supabase=await createClient(); const base=slugify(input); for(let attempt=1;attempt<=100;attempt+=1){const candidate=slugCandidate(base,attempt);let query=supabase.from("posts").select("id").eq("slug",candidate).limit(1);if(currentId)query=query.neq("id",currentId);const{data,error}=await query;if(error)throw new Error(`SLUG_CHECK_FAILED: ${error.message}`);if(!data?.length)return candidate;}throw new Error("SLUG_EXHAUSTED"); },
  async deriveStoredContent(contentJson: JSONContent) { return {content_json:contentJson,content_html:renderContentJson(contentJson),content_text:contentJsonToText(contentJson)}; },
};
