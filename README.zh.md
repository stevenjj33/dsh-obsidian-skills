# dsh-obsidian-skills

Obsidian 的 agent 技能包，封装为 DeepSeek Harness 插件。

把 **[kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)** 的六个技能打包，
注册到 DSH 技能目录。

```
技能                      教什么
─────────────────────────────────────────────────────────────────────────
obsidian-markdown         Obsidian 风格 Markdown —— 双向链接、嵌入、
                          标注块（callout）、属性、注释
obsidian-bases            .base 文件 —— 视图、筛选、公式、汇总
json-canvas               .canvas 文件 —— 节点、连线、分组（JSON Canvas 1.0）
obsidian-cli              通过 obsidian CLI 操作运行中的 vault
defuddle                  用 Defuddle CLI 从 HTML 提取干净 Markdown
knap                      用 Knap CLI 渲染模板
```

## 只含文档，不含任何 CLI 本体

**本包只发技能文本，不发工具。** 这里没有任何东西会安装或运行 CLI。

其中三个技能描述如何驱动命令行工具 —— 那些工具由你自己安装：

| 技能 | 需要 | 安装方式 |
|---|---|---|
| `obsidian-cli` | `obsidian` CLI，且 Obsidian 在运行 | 见 [Obsidian CLI 文档](https://help.obsidian.md/cli) |
| `defuddle` | `defuddle` | `npm install -g defuddle` |
| `knap` | `knap`（Node 20+） | `npm install -g knap` |

另外三个（`obsidian-markdown`、`obsidian-bases`、`json-canvas`）是纯格式规范，
**零依赖，开箱即用**。

## 安装

```bash
dsh plugin --profile <name> add dsh-obsidian-skills
```

或从本地目录安装：

```bash
dsh plugin --profile <name> add file:/绝对路径/dsh-obsidian-skills
```

装完重启 DSH，六个技能即出现在技能目录中。

## 仓库结构

```
├── lib/index.js                   加载器：扫描 skills/*/SKILL.md，逐个注册到 ctx.skills
├── scripts/
│   ├── sync-skills.mjs            从上游克隆拉取技能到 ./skills
│   └── verify-package.mjs         发布前检查：frontmatter、死链、manifest、凭据
├── skills.manifest.json           清单（生成）
├── cordis.patch.yml               dsh bundle patch
└── skills/
    ├── obsidian-markdown/
    │   ├── SKILL.md
    │   └── references/{PROPERTIES,EMBEDS,CALLOUTS}.md
    ├── obsidian-bases/
    │   ├── SKILL.md
    │   └── references/FUNCTIONS_REFERENCE.md
    ├── json-canvas/
    │   ├── SKILL.md
    │   └── references/EXAMPLES.md
    ├── obsidian-cli/SKILL.md
    ├── defuddle/SKILL.md
    └── knap/SKILL.md
```

## 跟随上游更新

技能正文是**逐字复制**自上游，本仓库从不改写。拉到新版本：

```bash
# 1. 刷新克隆（默认位置；也可用 OBSIDIAN_SKILLS_SRC 指向别处）
rm -rf /tmp/obsidian-skills-src
git clone git@github.com:kepano/obsidian-skills.git /tmp/obsidian-skills-src

# 2. 重新生成 ./skills 与 manifest
npm run sync

# 3. 确认无残留差异，再检查包
npm run sync:check   # exit 0 = 与上游一致
npm run verify
```

`sync-skills.mjs` 在源目录缺失时会自动克隆上游，并删除上游已不再提供的技能目录。

| 变量 | 默认值 | 用途 |
|---|---|---|
| `OBSIDIAN_SKILLS_SRC` | `/tmp/obsidian-skills-src` | 读取的本地克隆 |
| `OBSIDIAN_SKILLS_REF` | `main` | 缺失时克隆的分支 |

## 内容来源与许可

- `skills/**` —— 逐字来自 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)。
  措辞与结构归原作者（Steph Ango，MIT）。本仓库不改写、不主张著作权，
  只负责落盘并注册到 DSH。
- `lib/`、`scripts/`、`cordis.patch.yml`、`package.json` —— 本仓库原创，MIT。
- 上游为 MIT 许可：原始 `LICENSE` 随包提供，`NOTICE` 记录归属。

本包**不含**任何 Obsidian vault 内容、Obsidian 授权码或凭据。

## 许可

MIT。见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。
