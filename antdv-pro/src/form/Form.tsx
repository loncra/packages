import {defineComponent, type PropType, ref, type SetupContext} from 'vue'
import {Form as AntdvForm, type FormInstance, type FormProps} from 'antdv-next'
import {useAntdvConfig} from '../config-provider/useAntdvConfig'
import type {AntdvFormLayout} from '../config-provider/types'

/**
 * 跟随全局配置的**表单容器**（`antdv.state.formLayout`）。
 *
 * ## 为什么需要它
 * antd 的 `ConfigProvider.form` **不认 `layout`** —— 读它的（消费方）是 antd 自己的 `a-form`，
 * 运行时白名单只有 `scrollToFirstError` / `colon` / `requiredMark` / `tooltip` / `autoComplete` /
 * `autocomplete` / `labelAlign` / `labelWrap`（`antdv-next/dist/form/Form.js:26` 的
 * `useComponentBaseConfig("form", props, [...])`），而 **`layout` 只从 props 取**（同文件 `:557`
 * 的 props 默认 `{layout: 'horizontal'}`）⇒ 往 provider 里塞 `form={{layout}}` 是**空转**，
 * 且改不动（改官方白名单 = fork 依赖）。
 * ⇒ 本组件就是"缺的那半个 provider"：把 `antdvConfig.state.formLayout` 补到 `a-form` 的 props 上。
 * （pro 的 `CrudFormPage` 读同一个 `state`；`detailLayout` 同理，走 `CrudDetailPage`。）
 *
 * ## 用法 = `a-form` 的用法
 * - `$attrs` **全量透传**（`model` / `rules` / `@finish` / `id` / `class` …）⇒ 直接替换 `<a-form>` 即可；
 * - `layout` 默认取全局配置，**显式传 `:layout` 优先**；
 * - `ref` 拿到的是**整个 antd form 实例** ⇒ `<l-form ref="f">` 之后 `f.validate()` /
 *   `f.resetFields()` / `f.isFieldsTouched()` … 与 `<a-form ref>` **一字不差**。
 *
 * 另外：props 的**类型**取 antd 的 `FormProps`（运行时只声明 `layout`，其余走 `attrs`）⇒ TSX 里
 * 也能直接写 `<Form model={…} onFinish={…}>`（本仓 TSX 用自家壳曾因"props 类型没写全"只能退回 `h()`，
 * 见 `CrudFormModal` 的说明；这里从类型上解决，不再需要那招）。
 */
const Form = defineComponent(
  (props: FormProps, {attrs, slots, expose}: SetupContext) => {
    const config = useAntdvConfig()
    const formRef = ref<FormInstance>()

    /**
     * **透明转发**内层 form 实例（`<l-form ref>` === `<a-form ref>`）。
     *
     * 逐个列方法（`validate` / `resetFields` / `isFieldsTouched` …）会随 antd 版本与消费者需求一直变
     * ⇒ 用代理一次给全。**细节全部照抄 antd 自己的 `useForm` 代理**
     * （`antdv-next/dist/form/hooks/useForm.js:53-63`）：
     *
     * - ⚠️ **函数必须 `bind(instance)`** —— antd 的实例方法内部用 `this`（官方那行就是
     *   `value.bind(instance)`）。漏掉这一条，`ref.value.validate()` 会以**代理**为 `this` 调用 ⇒
     *   内部一调用就崩、**Promise 永不 resolve** ⇒ 表现为"点了没反应"（2026-09-30 实测：
     *   登录页按回车/点登录按钮都没反应，就是这条）。
     * - 跳过 `symbol` / `then` / `__v_*`（Vue 和别的库会探测它们，转发出去容易出怪事）；
     * - 还没挂到表单元素上时给**空函数**（而非 `undefined`）⇒ 早调不抛"不是函数"。
     */
    expose(
      new Proxy({} as Record<string, unknown>, {
        /**
         * ⚠️ **`has` 必须实现**：消费者写 `<l-form ref="f">` 时，`f.value` 拿到的是 Vue 的
         * `exposeProxy`（`@vue/runtime-core` 的 `getComponentPublicInstance`），它的 `get` 是
         * **先 `key in target` 再取值** —— 代理 target 是空对象，不实现 `has` 就一律判 `false`
         * ⇒ 所有方法都返回 `undefined` ✗（2026-09-30 踩：`bind` 修好也轮不到执行）。
         * 这里对"真实存在的键"统一回 `true`（排除项见下）；`get` 拿到 `undefined` 也不会更糟。
         */
        has: (_target, key) =>
          !(typeof key === 'symbol' || key === 'then' || String(key).startsWith('__v_')),
        get: (_target, key) => {
          if (typeof key === 'symbol' || key === 'then' || String(key).startsWith('__v_')) {
            return undefined
          }
          const instance = formRef.value as unknown as
            | Record<string | number | symbol, unknown>
            | undefined
          if (!instance) {
            return () => undefined
          }
          const value = instance[key]
          return typeof value === 'function' ? value.bind(instance) : value
        },
      }),
    )

    return () => (
      <AntdvForm {...attrs} ref={formRef} layout={props.layout ?? config.state.formLayout}>
        {slots.default?.()}
      </AntdvForm>
    )
  },
  {
    name: 'LForm',
    inheritAttrs: false,
    props: {
      /** 表单布局；不传 = 跟随 `LProvider` 的 `antdvConfig.state.formLayout` */
      layout: {type: String as PropType<AntdvFormLayout>, default: undefined},
    },
  },
)

export default Form
