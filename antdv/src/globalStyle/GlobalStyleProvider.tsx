import {defineComponent, ref} from 'vue'
import useStyle, {GLOBAL_PREFIX} from './style'

/** `prefixCls` 是常量，给 `useStyle` 一个稳定的 ref 就够（它只读 `.value`） */
const prefixCls = ref(GLOBAL_PREFIX)

/**
 * 把全局样式"跑一次"的那层，**不产 DOM**（只渲染 `default` 槽）。
 *
 * 为什么需要它：cssinjs 的样式是"谁调 `useStyle` 谁生成"（`style/index.ts` 放那儿不会自己生效），
 * 全局样式只要跑一次 ⇒ 这一层由包提供，宿主不用知道。
 *
 * ⚠️ 必须待在 `ConfigProvider` **里面**：`useStyle` 读的是当前上下文的主题，hashId 由主题算出来
 * （`antdv-next/dist/theme/useToken.js:106`）。站在 `ConfigProvider` 外面调（例如宿主 `App.vue` 的
 * `setup`，它比模板里的 provider 更早执行）拿到的是**外层默认主题**的 hashId ⇒ 切主题后规则前缀
 * 与元素对不上、**静默失效**。`@loncra/antdv-pro` 的 `LProvider` 已把它放在 `AntdvNextConfigProvider` 内。
 *
 * 返回的 `hashId` / `cssVarCls` 不用挂到元素上：全局类名的目标（antd 组件根）自己带主题 hashId
 * （`antdv-next/dist/spin/index.js:92`、`dist/app/App.js:45`），且本样式没用到任何 CSS 变量。
 */
const GlobalStyleProvider = defineComponent({
  name: 'LGlobalStyleProvider',
  setup(_, {slots}) {
    useStyle(prefixCls)
    return () => slots.default?.() ?? null
  },
})

export default GlobalStyleProvider
