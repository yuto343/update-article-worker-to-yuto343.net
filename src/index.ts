import * as cheerio from 'cheerio';
import { Octokit } from '@octokit/rest';
import { Buffer } from 'node:buffer';

type Article = {
	title: string;
	part: string;
	date: string;
	slug: string;
	url: string;
};
type SeriesData = { title: string; articles: Article[] }[];

export interface Env {
	GITHUB_PAT: string;
}

export default {
	async scheduled(request, env) {
		// 定数
		const URL = 'https://www.codegrid.net/authors/uchoco898/';
		const BASE_BRANCH = 'main';
		const REPO_OWNER = 'yuto343';
		const REPO_NAME = 'yuto343.net';

		// 1. URLからHTMLを取得
		const response = await fetch(URL);
		const data = await response.text();
		const $ = cheerio.load(data);

		// 2. HTMLからシリーズデータを抽出し配列に
		const seriesData: SeriesData = [];
		$('.cg-SeriesItem').each((i, series) => {
			const seriesTitle = $(series).find('.cg-SeriesItem_TitleLink').text().trim();
			const articles: Article[] = [];

			$(series)
				.find('.cg-SeriesItem_ListItem')
				.each((j, article) => {
					const articleTitle = $(article).find('.cg-SeriesItem_ListItemTitleText').text().trim();
					const articlePart = $(article).find('.cg-SeriesItem_ListItemTitlePart').text().trim();
					const articleDate = $(article).find('.cg-SeriesItem_ListItemTitleDate').attr('datetime') ?? '';
					const articleUrl = $(article).find('.cg-SeriesItem_ListItemTitle').attr('href');
					const slug = articleUrl?.split('/')[2] ?? '';

					articles.push({
						title: articleTitle,
						part: articlePart,
						date: articleDate,
						url: 'https://www.codegrid.net' + articleUrl,
						slug,
					});
				});

			seriesData.push({
				title: seriesTitle,
				articles: articles,
			});
		});

		// 3.シリーズデータをPRに
		const octokit = new Octokit({ auth: env.GITHUB_PAT });
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const newBranch = `update-article-${timestamp}`;

		// 3-1.ブランチを作成
		await octokit.git.createRef({
			owner: REPO_OWNER,
			repo: REPO_NAME,
			ref: `refs/heads/${newBranch}`,
			sha: (
				await octokit.repos.getBranch({
					owner: REPO_OWNER,
					repo: REPO_NAME,
					branch: BASE_BRANCH,
				})
			).data.commit.sha,
		});

		for (const series of seriesData) {
			for (const article of series.articles) {
				// 3-2.データをマークダウンファイルに
				const filePath = `src/content/writing/${article.slug}.md`;
				const fileContent = `---
title: ${series.title} | ${article.part ?? ''} ${article.title}
at: CodeGrid
date: ${article.date}
type: writing
draft: false
link: ${article.url}
---`;

				try {
					// 3-3.マークダウンファイルをコミット
					await octokit.repos.createOrUpdateFileContents({
						owner: REPO_OWNER,
						repo: REPO_NAME,
						path: filePath,
						message: `Add article: ${article.title}`,
						content: Buffer.from(fileContent).toString('base64'),
						branch: newBranch,
					});
				} catch (err: any) {
					if (err.message.includes(`"sha" wasn't supplied`)) {
						// すでに存在する場合のエラーは平常運転なので無視
						console.log(`[INFO] ${article.url} already exists`);
					} else {
						console.error(err.message);
					}
					continue;
				}
			}
		}
		//3-4. PRを作成
		try {
			await octokit.pulls.create({
				owner: REPO_OWNER,
				repo: REPO_NAME,
				title: '新しいCodeGrid記事を追加',
				head: newBranch,
				base: BASE_BRANCH,
			});
		} catch (err: any) {
			// 新しいコミットないエラーは平常運転
			if (err.message.includes('No commits between main and')) {
				console.log("[INFO] New article doesn't exist, delete branch.");

				await octokit.git
					.deleteRef({
						owner: REPO_OWNER,
						repo: REPO_NAME,
						ref: `heads/${newBranch}`,
					})
					.catch((err) => {
						console.error('[ERROR] Failed to delete branch.');
						console.error(err);
					});

				console.log('-----------------------------');
				console.log('[DONE] All articles are up to date.');
				console.log('-----------------------------');
			} else {
				console.error(err);
			}
		}
	},
} satisfies ExportedHandler<Env>;
