/**
 * 批量导入需要对应的RequireContext函数，否则无法正确解析路径,
 * callback函数用于在使用import()时替代RequireContext,
 * 非按需加载时并不需要
 * @export
 * @param {__WebpackModuleApi.RequireContext} requireContext
 * @param {(path: string) => any} [callback] 用于异步导入的处理函数
 * @returns
 */
export function importAll(
  requireContext: __WebpackModuleApi.RequireContext,
  callback?: (path: string) => any
) {
  return requireContext.keys().map(callback || requireContext);
}
