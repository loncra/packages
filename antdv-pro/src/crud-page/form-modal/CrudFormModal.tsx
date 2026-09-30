import {defineComponent, h, type PropType, ref, type SlotsType, type VNodeChild} from 'vue'
import {Modal} from 'antdv-next'
import type {RestResult} from '@loncra/client/commons'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import CrudFormPage from '../form/CrudFormPage'
import type {
  CrudFormModalConstructor,
  CrudFormModalProps,
  CrudFormPageExpose,
  CrudFormPageSlots,
  CrudStaleInfo,
} from '../types'

/**
 * 弹层表单壳（第 4 个壳）：把 `CrudFormPage`（表单形态）装进 `a-modal`。
 *
 * **⚠️ 这里没有"新形态"**：`page` 就是 `CrudFormDefinition`（`defineFormPage` 的产物）⇒ 同一份
 * `.form.page.ts` 既能给路由 Form 页用、也能给弹层用。取数 / 提交 / 校验 / 按钮 / 操作记录块
 * **全部由表单壳负责**（按钮就是它那一套，只是位置用 `buttonAlign: 'end'` 贴右下）—— 本壳只管四件
 * 弹层的事：① 开关（`v-model:open`）；② 标题；③ **宽度（默认 520，可传 `:width` 覆盖）**；
 * ④ `:footer="null"` + `maskClosable: false`（与旧 `ModalForm` 一致）；⑤ 关闭时 `emit('cancel')`。
 *
 * 两处**故意**的写法（都为了等价旧壳的行为，别"顺手优化"）：
 * - **内容 `v-if="open"` 重挂载**（不是常挂 + 复位实体）：每次打开都是全新实例 ⇒ `onMounted` 里
 *   `load()` 自然重跑、实体从 `createEntity()` 重新来（等价旧壳 `watch(open) → mounted()`）⇒
 *   关掉再开不会有上一次的脏数据，**宿主不必复位实体**；
 * - 给表单壳传 **`plain` + `title={false}`**：卸掉卡片壳（弹层里不该再套一张卡）、卡片头也别出
 *   （标题归弹层）。⚠️ 表单壳的 `plain` **保留 `Spin`**（与列表那份"内嵌连 `Spin` 一起关"不同）——
 *   表单没有"自带 loading"的内容，编辑态 `get(id)` 与提交都要转圈。
 */
const CrudFormModal = defineComponent({
  name: 'LCrudFormModal',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudFormModalProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudFormModalProps['id']>, default: undefined},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
    /** `default: undefined` 不能删（带 `Boolean` 的 props 不传会被转成 `false` ⇒ 弹层一上来关着） */
    open: {type: Boolean, default: undefined},
    title: {
      type: [String, Object, Array, Boolean] as PropType<CrudFormModalProps['title']>,
      default: undefined,
    },
    /** 弹层宽度（透传 `a-modal`）：**默认 520**（antd 的默认值口径收在壳里，宿主不必去记） */
    width: {type: [String, Number] as PropType<CrudFormModalProps['width']>, default: 520},
  },
  slots: Object as SlotsType<CrudFormPageSlots<DefaultCrudEntity>>,
  emits: {
    /** 开关回写（`v-model:open`）；`×` / 遮罩 / `Esc` 关闭也走它 */
    'update:open': (_value: boolean) => true,
    /** 保存成功（**宿主在这里决定后续**：关弹层 / 刷列表 / 跳走） */
    success: (_result: RestResult<unknown>) => true,
    /** 表单被重置 */
    resetFields: () => true,
    /** 弹层关闭（`×` / 遮罩 / `Esc`）：宿主清自己的状态（`mode` / `parent` 这类） */
    cancel: () => true,
    /** 陈旧检查有结论 —— 透传（弹层不挂 `keep-alive`，一般不会触发） */
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    /** 内层表单壳（expose 出来的都是"值"，用 getter 转发保住响应式） */
    const formRef = ref<CrudFormPageExpose<DefaultCrudEntity>>()

    function close(): void {
      emit('update:open', false)
    }

    function onCancel(): void {
      // 先给宿主信号（清自己的状态），再回写开关 —— 与旧壳 `@cancel` 语义一致
      emit('cancel')
      close()
    }

    expose<CrudFormPageExpose<DefaultCrudEntity>>({
      // 内容还没挂载（弹层关着）时是 `undefined` —— 与"表单页壳的实体一直在"不同，宿主读之前先判
      get entity() {
        return formRef.value?.entity as DefaultCrudEntity
      },
      get buckets() {
        return formRef.value?.buckets ?? {}
      },
      get dictionaries() {
        return formRef.value?.dictionaries ?? {}
      },
      resetFields: () => formRef.value?.resetFields?.(),
    })

    return () => (
      <Modal
        {...(attrs as Record<string, unknown>)}
        open={!!props.open}
        // 宽度：默认 520（壳自己的口径）；宿主传 `:width` 即接管
        width={props.width}
        // 底部不放按钮：按钮归表单壳那一套（见 `buttonAlign`）
        footer={null}
        // 与旧 `ModalForm` 一致：点遮罩不关（防误关丢输入）
        maskClosable={false}
        onCancel={onCancel}
        onUpdate:open={(value: boolean) => emit('update:open', value)}
        v-slots={{
          // `title` 走**槽**而不是 prop：`false` / 不给 = 连标题栏一起不出（与 `DataLoadingCardPlan` 同一口径）
          title:
            props.title == null || props.title === false
              ? undefined
              : () => props.title as VNodeChild,
        }}
      >
        {/*
          内容 `v-if` 重挂载（见上面的说明）。用 `h()` 而不是 JSX：表单壳的 props 类型里没有
          `onSuccess` 这类 emit 处理器（`CrudFormPageConstructor` 只带 `$props` / `$slots`）⇒
          JSX 会拒；`h()` + 第三个参数给槽是 pro 里既有的写法（同 `form/CrudFormPage` 渲染字段）。
        */}
        {props.open
          ? h(
              CrudFormPage as never,
              {
                ref: formRef,
                plain: true,
                title: false,
                buttonAlign: 'end',
                page: props.page,
                id: props.id,
                contextExtra: props.contextExtra,
                variant: props.variant,
                onSuccess: (result: RestResult<unknown>) => emit('success', result),
                onResetFields: () => emit('resetFields'),
                onStale: (info: CrudStaleInfo) => emit('stale', info),
              },
              slots,
            )
          : null}
      </Modal>
    )
  },
}) as unknown as CrudFormModalConstructor

export default CrudFormModal
