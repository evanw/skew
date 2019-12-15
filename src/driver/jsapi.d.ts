declare module "skew" {
  export type SymbolKind =
    | "PARAMETER_FUNCTION"
    | "PARAMETER_OBJECT"

    | "OBJECT_CLASS"
    | "OBJECT_ENUM"
    | "OBJECT_FLAGS"
    | "OBJECT_GLOBAL"
    | "OBJECT_INTERFACE"
    | "OBJECT_NAMESPACE"
    | "OBJECT_WRAPPED"

    | "FUNCTION_ANNOTATION"
    | "FUNCTION_CONSTRUCTOR"
    | "FUNCTION_GLOBAL"
    | "FUNCTION_INSTANCE"
    | "FUNCTION_LOCAL"

    | "OVERLOADED_ANNOTATION"
    | "OVERLOADED_GLOBAL"
    | "OVERLOADED_INSTANCE"

    | "VARIABLE_ARGUMENT"
    | "VARIABLE_ENUM_OR_FLAGS"
    | "VARIABLE_GLOBAL"
    | "VARIABLE_INSTANCE"
    | "VARIABLE_LOCAL"

  export interface Source {
    name: string
    contents: string
  }

  export interface Range {
    source: string
    start: Location
    end: Location
  }

  export interface Location {
    line: number
    column: number
  }

  export interface CompilerOptions {
    foldAllConstants?: boolean
    globalizeAllFunctions?: boolean
    inlineAllFunctions?: boolean
    jsMangle?: boolean
    jsMinify?: boolean
    jsSourceMap?: boolean
    outputDirectory?: string
    outputFile?: string
    stopAfterResolve?: boolean
    defines?: { readonly [name: string]: string }
    target: "c#" | "ts" | "c++" | "js" | "lisp-tree"
    inputs: readonly Source[]
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface CompileReq extends CompilerOptions {
    type?: "compile"
    id?: any
  }

  export interface CompileRes {
    type: "compile"
    id: any
    outputs: Source[]
    log: Log
  }

  export interface Log {
    text: string
    diagnostics: Diagnostic[]
  }

  export interface Diagnostic {
    kind: "error" | "warning"
    range: Range
    text: string
    fixes: Fix[]
  }

  export interface Fix {
    kind: number // Only useful for telling which fixes are related
    range: Range
    expected: string
    description: string
    replacement: string
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface TooltipReq {
    type?: "tooltip-query"
    id?: any
    source: string
    line: number
    column: number
    ignoreDiagnostics: boolean
  }

  export interface TooltipRes {
    type: "tooltip-query"
    id: any
    source: string
    tooltip: string | null
    range: Range | null
    symbol: string | null
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface DefinitionQueryReq {
    type?: "definition-query"
    id?: any
    source: string
    line: number
    column: number
  }

  export interface DefinitionQueryRes {
    type: "definition-query"
    id: any
    source: string
    definition: Range | null
    range: Range | null
    symbol: string | null
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface SymbolsQueryReq {
    type?: "symbols-query",
    id?: any
    source: string
  }

  export interface SymbolsQueryRes {
    type: "symbols-query",
    id: any
    source: string
    symbols: Symbol[] | null
  }

  export interface Symbol {
    name: string
    kind: SymbolKind
    parent: string | null
    fullName: string
    range: Range
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface RenameQueryReq {
    type?: "rename-query"
    id?: any
    source: string
    line: number
    column: number
  }

  export interface RenameQueryRes {
    type: "rename-query"
    id: any
    source: string
    ranges: Range[] | null
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface CompletionQueryReq extends CompilerOptions {
    type?: "completion-query"
    id?: any
    source: string
    line: number
    column: number
  }

  export interface CompletionQueryRes {
    type: "completion-query"
    id: any
    source: string
    range: Range | null
    completions: Completion[] | null
  }

  export interface Completion {
    name: string
    kind: SymbolKind
    type: string
    comments: string[] | null
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface SignatureQueryReq {
    type?: "signature-query"
    id?: any
    source: string
    line: number
    column: number
  }

  export interface SignatureQueryRes {
    type: "signature-query"
    id: any
    source: string
    signature: string | null
    arguments: string[] | null
    argumentIndex: number
  }

  ////////////////////////////////////////////////////////////////////////////////

  export interface Compiler {
    compile(req: CompileReq): CompileRes
    tooltipQuery(req: TooltipReq): TooltipRes
    definitionQuery(req: DefinitionQueryReq): DefinitionQueryRes
    symbolsQuery(req: SymbolsQueryReq): SymbolsQueryRes
    renameQuery(req: RenameQueryReq): RenameQueryRes
    completionQuery(req: CompletionQueryReq): CompletionQueryRes
    signatureQuery(req: SignatureQueryReq): SignatureQueryRes
    message(req: Req): Res
  }

  export type Req =
    | CompileReq
    | TooltipReq
    | DefinitionQueryReq
    | SymbolsQueryReq
    | RenameQueryReq
    | CompletionQueryReq
    | SignatureQueryReq

  export type Res =
    | CompileRes
    | TooltipRes
    | DefinitionQueryRes
    | SymbolsQueryRes
    | RenameQueryRes
    | CompletionQueryRes
    | SignatureQueryRes

  export const VERSION: string
  export function create(): Compiler
}
