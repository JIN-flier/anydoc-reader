# anydoc-read

`anydoc-read` 是一个 [Pi Agent](https://pi.dev/) 插件，用于把本地文档转换成 GitHub-Flavored Markdown，方便 Agent 读取。它使用 [`@firecrawl/anydoc`](https://github.com/firecrawl/anydoc) 的 Node.js API 在本地完成转换，不需要单独安装 AnyDoc CLI，也不需要 API Key。

插件只做文档转换：短文档可以直接返回 Markdown；长文档可以保存为 Markdown 文件，再交给 Pi 内置的 `read` 工具分段读取。它不会修改原文件，也不会自动清理已生成的 Markdown。

## 支持的格式

| 类型 | 扩展名 |
| --- | --- |
| Word | `.doc`、`.docx` |
| Excel | `.xls`、`.xlsx` |
| PowerPoint | `.ppt`、`.pptx` |
| PDF | `.pdf` |
| OpenDocument | `.odt` |
| RTF | `.rtf` |
| EPUB | `.epub` |
| CSV | `.csv` |

如果不确定文件格式，可以让 Agent 调用 `anydoc_formats` 查看当前支持的扩展名。

## 通过 GitHub 安装

``bash
pi install https://github.com/JIN-flier/anydoc-reader
``

Pi 会安装插件声明的运行依赖，并从 `package.json` 的 `pi` 配置中加载 Extension 和 Skill。运行 `pi list` 可以查看安装结果。若只想在当前项目使用，在安装命令末尾加 `--local`；项目需经过 Pi 的信任确认后才会加载该配置。

当前仓库尚未配置 Git 远端，上面的地址是安装命令模板。发布到 GitHub 后，请以实际仓库地址替换。

### 从本地目录安装

```bash
cd /path/to/anydoc-read
npm ci
pi install .
```

本地目录安装不会由 Pi 修改或安装该目录的依赖，因此需要先执行 `npm ci`。如果只用 `pi -e /path/to/anydoc-read/src/index.ts` 临时加载 Extension，还需把 `skills/anydoc-read/` 链接或复制到 Pi 的标准 Skill 目录；按包安装则会一并加载 Skill。

## 如何使用

安装后，直接在 Pi 中提出文档任务即可，例如：

```text
读取 /project/report.pdf，并列出主要结论。
```

Skill 会指导 Agent 根据文档长度和任务需求选择转换方式。也可以明确要求 Agent 使用某一种方式：

### 短文档：直接返回 Markdown

```ts
anydoc_convert({ path: "/project/report.docx" })
```

成功结果包含 `mode: "inline"` 和完整的 `markdown` 字符串，不会创建 Markdown 文件。相对输入路径以 Pi 当前工作区为基准；知道绝对路径时，优先使用绝对路径。

### 长文档：保存后按需读取

```ts
anydoc_convert({
  path: "/project/paper.pdf",
  output_dir: ".pi/anydoc-tmp/"
})
```

成功结果包含 `mode: "file"` 和 `markdown_path`，例如 `/project/.pi/anydoc-tmp/paper-a83f21.md`。随后让 Pi 内置的 `read` 工具按章节或行范围读取该文件。`output_dir` 只能指向当前工作区的 `.pi/anydoc-tmp/`；文件名带有随机标识符，重复转换不会覆盖已有结果。

### 显式指定格式

当文件扩展名缺失或不准确时，可以传入 `format`：

```ts
anydoc_convert({ path: "/project/export.bin", format: "csv" })
```

`format` 不区分大小写，接受 `csv` 或 `.CSV` 这样的写法，但必须属于上表列出的格式。转换失败时，工具返回 `success: false`，并附带结构化的 `error.code` 和 `error.message`。

## 结构

| 内容 | 用途 |
| --- | --- |
| `src/index.ts` | 向 Pi 注册 `anydoc_convert` 和 `anydoc_formats` 两个工具 |
| `src/anydoc-client.ts` | 封装 AnyDoc 的公开 Node.js API |
| `src/tools/`、`src/formats.ts` | 转换流程和统一的格式列表 |
| `src/filesystem.ts`、`src/errors.ts` | 输入路径检查、受限文件保存与错误规范化 |
| `skills/anydoc-read/SKILL.md` | 指导 Agent 选择转换模式、分段读取和处理不可信文档内容 |
| `package.json`、`package-lock.json` | 插件入口、依赖及版本锁定 |
| `tests/` | 格式、文件系统、错误、工具和真实 CSV 转换测试 |

## 能力

- 扫描版或纯图片 PDF 需要 OCR；本插件不提供 OCR，也不会把文档上传到托管解析服务。
- Markdown 不能保证完整保留图片、图表、版式或复杂表格结构。需要精确计算大型 Excel 或 CSV 数据时，应使用专门的数据处理工具。
- 转换后的文档内容是不可信数据。Skill 会提醒 Agent 不执行文档中的指令或泄露其他文件。

在源码目录运行 `npm test` 和 `npm run typecheck` 可检查测试与类型。
