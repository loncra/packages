import {defineComponent, h, type PropType, type SlotsType, type VNodeChild} from 'vue'
import {Button, Col, Divider, Flex, FormItem, Row, Space, theme} from 'antdv-next'
import {HistoryOutlined, SaveOutlined, UndoOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {RestResult} from '@loncra/client/commons'
import DataLoadingCard from '../../data-loading-card'
import Form from '../../form'
import {readPath, writePath} from '../../_util/crud/readPath'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import {isOperationTraceVisible, OperationTraceTable} from '../operation-trace'
import {withFieldCtx} from './withFieldCtx'
import {useCrudFormPage} from './useCrudFormPage'
import type {
  CrudFormPageConstructor,
  CrudFormPageExpose,
  CrudFormPageProps,
  CrudFormPageSlots,
  CrudStaleInfo,
  PageFieldRenderContext,
} from '../types'

const CrudFormPage = defineComponent({
  name: 'LCrudFormPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudFormPageProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudFormPageProps['id']>, default: undefined},
    buttonAlign: {type: String as PropType<CrudFormPageProps['buttonAlign']>, default: undefined},
    title: {type: [Object, Boolean] as PropType<CrudFormPageProps['title']>, default: undefined},
    plain: {type: Boolean, default: false},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
  },
  slots: Object as SlotsType<CrudFormPageSlots<DefaultCrudEntity>>,
  emits: {
    success: (_result: RestResult<unknown>) => true,
    resetFields: () => true,
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    const {token} = theme.useToken()
    const {
      locale,
      prefixCls,
      hashId,
      cssVarCls,
      buckets,
      dictionaries,
      formRef,
      spinning,
      entity,
      t,
      fields,
      fieldRef,
      load,
      checkStale,
      doSubmit,
      doReset,
    } = useCrudFormPage(props, emit)

    expose<CrudFormPageExpose<DefaultCrudEntity>>({
      get entity() {
        return entity.value
      },
      resetFields: doReset,
      get buckets() {
        return buckets.value
      },
      get dictionaries() {
        return dictionaries.value
      },
    })

    function renderButtons(): VNodeChild {
      const submitButton = () => (
        <Button type="primary" htmlType="submit" loading={spinning.value}>
          {{
            icon: () => h(SaveOutlined),
            default: () => locale.value.save,
          }}
        </Button>
      )
      const resetButton = () => (
        <Button htmlType="button" disabled={spinning.value} onClick={doReset}>
          {{
            icon: () => h(UndoOutlined),
            default: () => locale.value.reset,
          }}
        </Button>
      )
      if (!slots.buttons) {
        return [submitButton(), resetButton()]
      }
      return slots.buttons({
        entity: entity.value,
        extra: props.contextExtra,
        loading: spinning.value,
        submitButton,
        resetButton,
      }) as VNodeChild
    }

    return () => (
      <DataLoadingCard
        {...(attrs as Record<string, unknown>)}
        plain={props.plain}
        title={props.title}
        loading={spinning.value}
        onUpdate:loading={(value: boolean) => (spinning.value = value)}
        onMounted={load}
        onActivated={checkStale}
      >
        <Form
          ref={formRef}
          model={entity.value}
          onFinish={() => doSubmit()}
        >
          <Row gutter={[token.value.sizeMD,0]}>
            {fields.value.map((field) => {
              const fieldCtx: PageFieldRenderContext<DefaultCrudEntity> = {
                entity: entity.value,
                t,
                buckets: buckets.value,
                dictionaries: dictionaries.value,
                variant: props.variant,
                extra: props.contextExtra,
              }
              const control = field.render
                ? (field.render(fieldCtx) as VNodeChild)
                : h(
                    field.component as never,
                    {
                      ref: fieldRef(String(field.key)),
                      value: readPath(entity.value, field.key),
                      'onUpdate:value': (value: unknown) =>
                        writePath(entity.value, field.key, value),
                      ...field.props,
                    },
                    withFieldCtx(field.slots, fieldCtx),
                  )
              return (
                <Col key={String(field.key)} {...field.col}>
                  {field.ownFormItem ? (
                    control
                  ) : (
                    <FormItem name={field.name} label={field.label} rules={field.rules}>
                      {control}
                    </FormItem>
                  )}
                </Col>
              )
            })}
          </Row>
          {slots.default?.({
            entity: entity.value,
            extra: props.contextExtra,
            buckets: buckets.value,
            dictionaries: dictionaries.value,
          })}
          {isOperationTraceVisible(props.page.operationDataTraceTarget, entity.value) && (
            <div
              class={classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-operation-trace`,
              )}
            >
              <Divider titlePlacement="start" plain>
                <Space>
                  <HistoryOutlined />
                  <span>{locale.value.operationTrace.title}</span>
                </Space>
              </Divider>
              <OperationTraceTable
                target={props.page.operationDataTraceTarget}
                entity={entity.value}
              />
            </div>
          )}
          <Flex justify={props.buttonAlign ?? 'start'}>
            <Space>{renderButtons()}</Space>
          </Flex>
        </Form>
      </DataLoadingCard>
    )
  },
}) as unknown as CrudFormPageConstructor

export default CrudFormPage
