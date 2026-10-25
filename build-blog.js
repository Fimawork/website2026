require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

// 1. 初始化 Client 與 轉換器
const notion = new Client({ auth: process.env.NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildBlog() {
  console.log('🚀 開始從 Notion 生成靜態部落格文章與目錄頁...\n');

  // 動態載入 ESM 模組 marked
  const { marked } = await import('marked');

  // 讓 Marked 保持 Raw HTML（讓 Notion 程式碼區塊裡的 <div class="..."> 直接輸出）
  marked.setOptions({
    html: true,
    breaks: true,
  });

  // 設定輸出資料夾：dist/blog
  const outputDir = path.join(__dirname, 'dist', 'blog');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 讀取單篇文章 HTML 樣板
  const postTemplatePath = path.join(__dirname, 'templates', 'post-template.html');
  if (!fs.existsSync(postTemplatePath)) {
    console.error('❌ 找不到單篇樣板檔案 templates/post-template.html');
    return;
  }
  const postTemplateHtml = fs.readFileSync(postTemplatePath, 'utf-8');

  // 讀取部落格目錄頁樣板
  const indexTemplatePath = path.join(__dirname, 'templates', 'blog-index-template.html');
  let indexTemplateHtml = '';
  if (fs.existsSync(indexTemplatePath)) {
    indexTemplateHtml = fs.readFileSync(indexTemplatePath, 'utf-8');
  } else {
    console.warn('⚠️ 找不到 templates/blog-index-template.html，將跳過目錄頁生成。');
  }

  try {
    // 2. 查詢 Status 為 Published 的文章
    let response;
    if (typeof notion.databases?.query === 'function') {
      response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
      });
    } else {
      const rawSearch = await notion.search({
        filter: { value: 'page', property: 'object' },
      });
      response = {
        results: rawSearch.results.filter(page => {
          const status = page.properties?.Status?.select?.name;
          return status === 'Published';
        }),
      };
    }

    const articles = response.results;
    console.log(`📦 找到 ${articles.length} 篇狀態為 [Published] 的文章。\n`);

    const articlesData = [];

    // 逐篇編譯文章
    for (const page of articles) {
      const props = page.properties || {};

      // 安全提取 Title 屬性（若沒填自動補上預設文字）
      const titleProp = Object.values(props).find(p => p.type === 'title');
      const title = titleProp?.title?.[0]?.plain_text || '未命名文章';

      // 安全提取 Slug 屬性（若沒填自動拿 Page ID 替代）
      const slugProp = props.Slug?.rich_text?.[0]?.plain_text;
      const slug = slugProp || `post-${page.id.replace(/-/g, '')}`;

      // 安全提取 Category、Date、Description
      const category = props.Category?.select?.name || '3D Web';
      const date = props.Date?.date?.start || new Date().toISOString().split('T')[0];
      const description = props.Description?.rich_text?.[0]?.plain_text || title;

      articlesData.push({
        title,
        slug,
        category,
        date,
        description,
      });

      console.log(`⏳ 正在處理文章:《${title}》 (Slug: ${slug})...`);

      // 3. 將 Notion Block 轉換成 Markdown
      const mdblocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdblocks);

      // 4. 將 Markdown 編譯為 HTML
      let contentHtml = await marked.parse(mdString.parent || '');

      // 特殊處理：還原 Notion Code Block 中的 HTML 實體符號，還原 3D DOM 結構
      contentHtml = contentHtml.replace(/<pre><code class="language-html">([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
        return code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');
      });

      // 5. 替換 HTML 樣板標籤
      const finalHtml = postTemplateHtml
        .replace(/{{TITLE}}/g, escapeHtml(title))
        .replace(/{{SLUG}}/g, encodeURIComponent(slug))
        .replace(/{{CATEGORY}}/g, escapeHtml(category))
        .replace(/{{DATE}}/g, escapeHtml(date))
        .replace(/{{DESCRIPTION}}/g, escapeHtml(description))
        .replace(/{{CONTENT}}/g, contentHtml);

      // 6. 寫入單篇靜態 .html 檔案
      const outputPath = path.join(outputDir, `${slug}.html`);
      fs.writeFileSync(outputPath, finalHtml, 'utf-8');
      console.log(`  └─ ✅ 已生成: dist/blog/${slug}.html\n`);
    }

    // 7. 生成部落格目錄列表頁 (dist/blog/index.html)
    if (indexTemplateHtml) {
      console.log('📑 正在生成部落格文章目錄頁面 (dist/blog/index.html)...');

      // 依發布日期由新到舊排序
      articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 收集不重複的分類標籤
      const uniqueCategories = [...new Set(articlesData.map(a => a.category).filter(Boolean))];
      const categoriesNavHtml = uniqueCategories
        .map(cat => `<button class="filter-btn" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
        .join('\n                ');

      // 產出所有文章卡片列表
      const cardsHtml = articlesData.map(article => `
            <article class="blog-card" data-category="${escapeHtml(article.category)}">
                <div>
                    <div class="card-top">
                        <span class="card-category">
                            <span class="pulse-dot"></span>
                            ${escapeHtml(article.category)}
                        </span>
                        <time class="card-date">
                            <i class="fa-regular fa-calendar"></i>
                            ${escapeHtml(article.date)}
                        </time>
                    </div>
                    <h2 class="card-title">
                        <a href="${escapeHtml(article.slug)}.html">${escapeHtml(article.title)}</a>
                    </h2>
                    <p class="card-desc">${escapeHtml(article.description)}</p>
                </div>
                <div class="card-bottom">
                    <a href="${escapeHtml(article.slug)}.html" class="card-link">
                        <span>閱讀全文 Read Article</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </article>
      `).join('\n');

      // 替換目錄樣板標籤
      const finalIndexHtml = indexTemplateHtml
        .replace(/{{ARTICLE_CARDS}}/g, cardsHtml)
        .replace(/{{TOTAL_COUNT}}/g, String(articlesData.length))
        .replace(/{{CATEGORIES_NAV}}/g, categoriesNavHtml);

      const catalogOutputPath = path.join(outputDir, 'index.html');
      fs.writeFileSync(catalogOutputPath, finalIndexHtml, 'utf-8');
      console.log(`  └─ ✅ 已成功生成目錄頁: dist/blog/index.html (共 ${articlesData.length} 篇文章)\n`);
    }

    console.log('🎉 所有部落格靜態檔案（文章與目錄）處理完成！已存放至 dist/blog/ 資料夾。');

  } catch (error) {
    console.error('❌ 生成過程中發生錯誤：', error);
  }
}

buildBlog();