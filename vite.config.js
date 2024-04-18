import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// 允许从整个项目根目录和特定子目录访问文件
			allow: ['..', './static'] // 这里添加了 './static' 以确保可以访问 static 文件夹
		}
	}
});
