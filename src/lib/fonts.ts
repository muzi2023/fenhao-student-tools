/**
 * Pixfit 字体加载
 *
 * 运行时使用系统字体栈，不在构建阶段请求 Google Fonts。这样在
 * Vercel、Cloudflare 和中国大陆网络环境下都不会因为字体下载失败
 * 阻断部署；中文字体仍由 globals.css 的系统优先栈处理。
 */

export const fontSans = { variable: '' } as const
export const fontMono = { variable: '' } as const
