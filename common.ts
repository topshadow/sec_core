/**
 * 生成指定范围内的随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 范围内的随机整数
 */
export function randomInt(min: number, max: number): number {
    // 确保参数是整数
    min = Math.ceil(min);
    max = Math.floor(max);
    
    // 确保 min <= max
    if (min > max) {
      [min, max] = [max, min];
    }
    
    // 生成随机整数
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }