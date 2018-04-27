export const toKebabCase = (str: string) => {
  const matchArr = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
  if (matchArr) {
    return matchArr.map(x => x.toLowerCase()).join('-');
  }
  throw new Error('字符串格式不正确');
};
export default {};
