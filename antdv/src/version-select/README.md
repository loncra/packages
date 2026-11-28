# `VersionSelect` 版本选择

## 何时使用 {#when-to-use}

需要展示"当前生效版本"并提示落后于最新版本的场合：下拉选择版本；当 `value` 不是最新时自动追加红点（Badge dot）、`→ 最新版本` 标记与升级按钮。

`latest` 不由宿主传入——组件从 `options` 里按语义化版本比较（`semver`）取最大值派生；`options` 为空或全为非法版本串时回落首项，此时视为无最新版本、不显示任何过期提示。

## 代码演示 {#examples}

```tsx
import {ref} from 'vue'
import {VersionSelect} from '@loncra/antdv'

const value = ref('1.0.0')
const options = [
  {label: '1.0.0', value: '1.0.0'},
  {label: '1.1.0', value: '1.1.0'},
]

// 受控：落后时亮红点并显示 → 1.1.0 + 升级按钮
<VersionSelect v-model:value={value.value} options={options} onUpgrade={(latest) => console.log(latest)} />

// 只读锁定：不提供 onChange / update:value 时即纯展示
<VersionSelect value="1.0.0" options={options} />
```

## API

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 当前生效版本；受控经 `update:value` 回写 | string | - | |
| options | 版本候选（Select 选项形态）；`latest` 由此派生 | `SelectProps['options']` | `[]` | |
| disabled | 禁用下拉（透传给内部 `Select`） | boolean | - | |
| separator | 过期时 `value` 与最新版本之间的分隔文案 | string | `' → '` | |
| prefixCls | 前缀覆盖 | string | `loncra-version-select` | |
| rootClass | 并入根节点的额外类名 | string | - | |

其余 attrs（`placeholder` / `size` 等）透传给内部 `Select`；`disabled` 为显式 prop，同样下推 `Select`。

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| `change` | 版本变化（与 Select 命名一致） | `(value: string)` |
| `update:value` | 支持宿主 `v-model:value` 双向绑定 | `(value: string)` |
| `upgrade` | 点击升级按钮，参数为派生的最新版本 | `(latest: string)` |

## 类型 {#types}

```ts
export interface VersionSelectClasses {
  root?: string
  select?: SelectProps['classes']
  upgrade?: ButtonProps['classes']
  latest?: string
}

export interface VersionSelectStyles {
  root?: CSSProperties
  select?: SelectProps['styles']
  upgrade?: ButtonProps['styles']
  latest?: CSSProperties
}

export interface VersionSelectProps {
  value?: string
  options?: SelectProps['options']
  separator?: string
  prefixCls?: string
  rootClass?: string
  classes?: VersionSelectClasses
  styles?: VersionSelectStyles
}

export interface VersionSelectEmits {
  'update:value': (value: string) => void
  upgrade: (latest: string) => void
}
```

## 语义化 DOM {#semantic-dom}

| 键 | 落点 | 说明 |
| --- | --- | --- |
| `root` | `Badge`（稳定根） | 红点所在壳；本控件的 `class` / `style` / `rootClass` 也落它 |
| `select` | `Select` | 版本下拉 |
| `upgrade` | 升级 `Button` | 仅过期态渲染 |
| `latest` | 最新版本文本（`Typography.Text` warning 色） | 仅过期态渲染 |

无落点：`separator` 分隔符（纯文本，已 prop 化）、`SpaceCompact`（纯布局分组）。

## 设计注意 {#design-notes}

- `latest` 由 `options` 按 `semver` 比较（`valid` 过滤非法串 + `rcompare` 取最大）派生；预发布版本遵循 semver 语义（`1.0.0-beta < 1.0.0`）。
- 过期判据是 `value !== latest`（字符串不等），不做范围判断；`value` 未设时显示 `latest`。
- 组件不拉取数据；`options` 由宿主负责加载与刷新。
