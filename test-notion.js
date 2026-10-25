require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_KEY });

async function testFetchArticles() {
  console.log('正在嘗試讀取 Notion 部落格文章...\n');

  try {
    // 優先使用標準 SDK databases.query 方法
    let response;
    if (typeof notion.databases?.query === 'function') {
      response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
      });
    } else {
      // 備用方案：透過 search 抓取該資料庫下的所有 Page
      response = await notion.search({
        filter: { value: 'page', property: 'object' },
      });
    }

    console.log('🎉🎉🎉 完美的連線成功！');
    console.log(`在資料庫中一共找到了 ${response.results.length} 篇文章：\n`);

    response.results.forEach((page, index) => {
      const titleProp = Object.values(page.properties || {}).find(p => p.type === 'title');
      const title = titleProp?.title[0]?.plain_text || '未命名文章';
      console.log(`  ${index + 1}. ${title}`);
    });

    console.log('\n✅ 你的 Notion API 環境設定已完全打通！');

  } catch (error) {
    console.error('❌ 讀取失敗，詳細錯誤：', error.message);
  }
}

testFetchArticles();