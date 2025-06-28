import type { LoaderFunctionArgs } from "@remix-run/node";
import { contentService } from "~/services/blog.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");
  if (!host) {
    throw new Error("Could not determine domain URL.");
  }
  const protocol = host.includes("localhost") ? "http" : "https";
  const domain = `${protocol}://${host}`;
  
  try {
    const posts = await contentService.getPostsForRSS();
    
    const rssString = generateRSS({
      title: "FocusLab Blog",
      description: "Insights, tutorials, and resources about building accessible, neurodivergent-friendly development tools and inclusive technology.",
      link: `${domain}/blog`,
      feedUrl: `${domain}/blog/rss.xml`,
      language: "en-US",
      lastBuildDate: new Date().toUTCString(),
      posts,
      domain
    });

    return new Response(rssString, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Length": String(Buffer.byteLength(rssString)),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    throw new Response("Error generating RSS feed", { status: 500 });
  }
}

function generateRSS({
  title,
  description,
  link,
  feedUrl,
  language,
  lastBuildDate,
  posts,
  domain
}: {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  language: string;
  lastBuildDate: string;
  posts: any[];
  domain: string;
}) {
  const items = posts
    .map((post) => {
      const postUrl = `${domain}/blog/${post.slug}`;
      const pubDate = new Date(post.frontmatter.publishedAt).toUTCString();
      
      return `
    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <description><![CDATA[${post.frontmatter.description}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@focuslab.dev (${post.frontmatter.author})</author>
      <category>${post.frontmatter.category}</category>
      ${post.frontmatter.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
      ${post.frontmatter.image ? `<enclosure url="${domain}${post.frontmatter.image}" type="image/jpeg" />` : ''}
      <content:encoded><![CDATA[
        ${post.frontmatter.image ? `<img src="${domain}${post.frontmatter.image}" alt="${post.frontmatter.imageAlt || post.frontmatter.title}" />` : ''}
        <p>${post.frontmatter.description}</p>
        <p><a href="${postUrl}">Read the full post on FocusLab</a></p>
      ]]></content:encoded>
    </item>`.trim();
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${link}</link>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <managingEditor>noreply@focuslab.dev (FocusLab Team)</managingEditor>
    <webMaster>noreply@focuslab.dev (FocusLab Team)</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} FocusLab. All rights reserved.</copyright>
    <category>Technology</category>
    <category>Web Development</category>
    <category>Accessibility</category>
    <category>Neurodiversity</category>
    <ttl>60</ttl>
    <image>
      <url>${domain}/logo-light.png</url>
      <title>${title}</title>
      <link>${link}</link>
      <width>144</width>
      <height>144</height>
    </image>
${items}
  </channel>
</rss>`;
}