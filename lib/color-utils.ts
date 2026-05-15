/**
 * 根据背景色亮度计算对比文字颜色
 * @param hexColor 十六进制颜色值（如 #ffffff）
 * @returns 深色或浅色文字颜色
 */
export function getContrastColor(hexColor: string): string {
  // 移除 # 前缀
  const hex = hexColor.replace("#", "");

  // 解析 RGB 值
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // 计算亮度（W3C 标准）
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 亮度 > 128 用深色文字，否则用浅色文字
  return brightness > 128 ? "#1e293b" : "#ffffff";
}

/**
 * 判断颜色是否为浅色
 * @param hexColor 十六进制颜色值
 * @returns 是否为浅色
 */
export function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
