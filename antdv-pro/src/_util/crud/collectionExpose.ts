/**
 * 集合类组件的对外能力：**表格 / 卡片网格 / 两道门面共用这一份**（重取数 + 删除）。
 *
 * 住 `_util/crud/` 而不是某个形态目录：内核与动作上下文（`ActionAppApis.collection`）都要引它，
 * 放上层会让下层反向依赖上层。定义只在这里，各层不再各写一份同形接口。
 *
 * `remove` **写成方法签名**（不是 `remove: (records: TEntity[]) => void`）：方法参数按 TS 规则是双变的，
 * 于是 `CollectionExpose<子类型>` 与 `CollectionExpose<父类型>` 互相可赋值 —— 动作定义（`ToolbarActionDefinition`）
 * 里带了它，若用函数属性就会把 `TItem` 变成不变的：宿主声明写实体类型（`ToolbarActionDefinition<CarouselEntity>`）、
 * 而组件 props 那侧推断出 payload/body 类型时，整条绑定会立刻报错（模板里没法显式标泛型）。
 */
export interface CollectionExpose<TEntity extends object> {
  fetchDataSource: () => Promise<void | undefined>
  remove(records: TEntity[]): void
}
