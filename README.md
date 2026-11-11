# 分号学生工具 · 证件照制作

`fenhao-student-tools` 是分号学生工具的第一期 H5/PWA 原型：在浏览器本地制作常见证件照，按规格导出 JPG，并自动排版为 A4 打印 PDF。

## 运行

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 已完成

- 手机拍照或从相册上传 JPG/PNG；读取 JPEG EXIF 方向并在 Canvas 中旋转后再处理。
- 一寸 25×35 mm、二寸 35×49 mm、驾驶证常见横向 32×22 mm、教师资格证常见一寸白底、学历/学位证书常见二寸等可配置规格。
- 规格配置在 `src/data/specs.json`，每项包含毫米、像素换算所需 DPI、底色、KB 选项、头部比例和来源说明。
- 白 / 蓝 / 红底预览；默认不美颜、不改变五官。
- 轻量本地抠图适配层：从四角背景颜色估计背景并生成透明蒙版；提供“重新抠图”、边缘容差、缩放、上下/左右微调入口。
- 300 DPI 像素换算；JPG 目标大小选项（20 / 50 / 100 / 200 KB，按规格展示可用选项）。
- JPG 下载和 A4 PDF 下载；PDF 使用 `pdf-lib` 在浏览器本地生成，按毫米尺寸在 A4 上重复排版。
- 移动端响应式 UI、基础 PWA manifest、离线缓存 service worker 壳。
- 清楚提示：具体报名要求以主管部门 / 学校公告为准。

## 抠图适配层与边界

本期没有把高质量 ONNX 人像模型塞进浏览器包。当前 provider 是可替换的轻量 fallback，适合背景相对干净的照片，复杂发丝、透明物体和强逆光场景需要更干净的原图或后续模型 provider。代码入口是 `src/lib/image.ts` 的 `subjectMaskCanvas` / `renderIdPhoto`，后续可以接入经过许可审计的本地 WebAssembly / WebGPU provider。

候选底座 HivisionIDPhotos 仅作为研究参考；本仓库未打包其模型、Face++ 检测器或任何非商业/云端服务，因此不引入 AGPL、非商业模型或额外 API 费用。若未来引入模型，需要把代码许可、模型许可、权重来源和 NOTICE 分开审计，并锁定可商用与可再分发版本。

## 浏览器与小程序边界

本期优先交付浏览器 PWA。未来微信小程序可以使用 web-view 作为入口，或把规格 JSON 和导出逻辑迁移到小程序端；高质量抠图模型建议放在自有后端或独立 Web Worker 服务，并在明确授权后上传，不直接把大模型塞进小程序原生包。当前实现不上传图片、不接课程、题库、会员、账号、目录或线上部署。

## 许可

本仓库自有代码使用 MIT License（见 `LICENSE`）。第三方依赖按各自许可证使用：React / Vite / TypeScript / Vitest 为 MIT，`pdf-lib` 为 MIT。仓库不包含外部模型权重。

## 验证记录

已验证：`npm run lint`、`npm run typecheck`、`npm test`（5 个核心测试）和 `npm run build`。测试覆盖毫米 ↔ 像素换算、DPI 规格、KB 压缩参数边界、文件名生成和 A4 PDF 字节流。构建产物在 `dist/`。

本环境的浏览器 UI 与执行容器网络隔离，无法从 CUA 浏览器访问容器内的 `127.0.0.1` 开发服务器；已用本地 HTTP `curl` 验证 Vite 返回 200，并用构建命令确认静态产物可生成。建议在真实手机或同机浏览器打开 `npm run dev` 后继续做相机权限与真实照片回归。

## 文档扫描

“文档扫描”位于证件照页面下方，支持手机拍照或选择多页图片，浏览器本地自动裁边并生成多页 PDF。第一页可运行 OCR 自动命名，文件名始终可以手动修改；默认不创建目录、不自动分类、不上传图片。

当前裁边使用轻量边界检测，适合纸张与背景反差明显的照片。复杂透视、阴影和卷曲纸张后续可替换为 OpenCV/WASM provider。OCR 使用 Tesseract.js worker，首次识别可能需要下载语言包；当前默认英文语言包，中文语言包应单独评估体积与许可。
