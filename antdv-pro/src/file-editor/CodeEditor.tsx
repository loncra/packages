import {defineComponent, onMounted, onUnmounted, ref, watch} from 'vue'
import {autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,} from '@codemirror/autocomplete'
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import {lintKeymap} from '@codemirror/lint'
import {highlightSelectionMatches, searchKeymap} from '@codemirror/search'
import {EditorState} from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'
import {oneDark} from '@codemirror/theme-one-dark'
import {classNames, useIsDark} from '@loncra/antdv'
import {loadLanguage} from './filePaneKinds'

const editorSetup = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter({
    openText: '▾',
    closedText: '▸',
  }),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
]

const CodeEditor = defineComponent({
  name: 'LFileCodeEditor',
  inheritAttrs: false,
  props: {
    ext: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      required: true,
    },
    modelValue: {
      type: String,
      default: '',
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    'update:modelValue': (_value: string) => true,
  },
  setup(props, {emit}) {
    const root = ref<HTMLDivElement>()
    const isDark = useIsDark()
    let view: EditorView | undefined
    let createGeneration = 0

    async function createEditor() {
      const generation = ++createGeneration
      view?.destroy()
      view = undefined
      if (!root.value) {
        return
      }
      const lang = await loadLanguage(props.ext)
      if (generation !== createGeneration || !root.value) {
        return
      }
      const extensions = [
        editorSetup,
        EditorView.lineWrapping,
        EditorView.editable.of(!props.readonly),
        EditorState.readOnly.of(props.readonly),
        EditorView.theme({
          '&': {height: '100%'},
          '.cm-scroller': {overflow: 'auto'},
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
      ]
      if (isDark.value) {
        extensions.push(oneDark)
      }
      if (lang) {
        extensions.push(lang)
      }
      view = new EditorView({
        parent: root.value,
        state: EditorState.create({
          doc: props.modelValue,
          extensions,
        }),
      })
    }

    onMounted(() => {
      void createEditor()
    })

    watch(
      () => [props.ext, props.readonly, isDark.value] as const,
      () => {
        void createEditor()
      },
    )

    onUnmounted(() => {
      createGeneration++
      view?.destroy()
      view = undefined
    })

    return () => (
      <div
        ref={root}
        class={classNames(
          props.hashId,
          props.cssVarCls,
          `${props.prefixCls}-editor`,
        )}
      />
    )
  },
})

export default CodeEditor
