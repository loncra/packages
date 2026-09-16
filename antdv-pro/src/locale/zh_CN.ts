import type {Locale} from './index'

const locale: Locale = {
  locale: 'zh-CN',
  UserSelect: {
    all: '全部{name}',
  },
  AttachmentUpload: {
    draggerTitle: '点击或拖动文件至该区域进行上传',
    draggerSubTitle: '可上传 {maxCount} 个文件内容，当前已上传 {count}',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
  },
  FileEditor: {
    untitled: '未命名',
    refresh: '刷新',
    uploadFile: '上传文件',
    uploadDirectory: '上传目录',
    rename: '修改名称',
    delete: '删除',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
    save: '保存',
    locate: '定位文件',
    download: '下载',
    unsavedConfirm: '有未保存的修改，确定关闭该文件吗？未保存的内容将丢失。',
    unsupported: '不支持在线打开此文件',
    tooLarge: '文件过大，请下载后查看',
    nameEmpty: '名称不能为空',
    nameReserved: '名称不能为 . 或 ..',
    nameIllegal: '名称不能包含 / \\ < > " | ? * 及控制字符',
    nameTooLong: '名称不能超过 255 个字符',
  },
  SystemUserPanel: {
    selectedMember: '已选择的成员',
    phoneNumber: '手机号码',
    email: '电子邮箱',
  },
  Crud: {
    search: '搜索',
    reset: '重置',
    clear: '清空',
    add: '新增',
    edit: '编辑',
    detail: '详情',
    action: '操作',
    exportAll: '导出全部',
    exportSelected: '导出选中 {count} 项',
    deleteText: '删除',
    deleteSelected: '删除选中 {count} 项',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
    deleteConfirmBatch: '确定要删除选中的 {count} 条记录吗？',
  },
}

export default locale
