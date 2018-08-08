/**
 * 读取路径信息
 * @param {string} path 路径
 */
const fs = require('fs');
const path = require('path');

function getStat(_path) {
  try {
    return fs.statSync(_path);
  } catch (error) {
    return false;
  }
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch (error) {
    return false;
  }
  return true;
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
module.exports = function dirExists(dir) {
  const isExists = getStat(dir);
  // 如果该路径且不是文件，返回true
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) { // 如果该路径存在但是文件，返回false
    return false;
  }
  // 如果该路径不存在
  const tempDir = path.parse(dir).dir; // 拿到上级路径
  // 递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  const status = dirExists(tempDir);
  let mkdirStatus;
  if (status) {
    mkdirStatus = mkdir(dir);
  }
  return mkdirStatus;
};
