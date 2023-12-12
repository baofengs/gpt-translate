// 解析命令行参数
const commandLineArgs = process.argv.slice(2);
const logLevel = parseLogLevel(commandLineArgs);

export const LogLevel = {
  Simple: 1,
  Detail: 2,
  All: 3,
};

// 定义 log 方法
export function log(currentLevel = 0, ...args) {
  const message = args.join('');
  if (currentLevel <= logLevel) {
    console.log(message);
  }
}

// 根据命令行参数解析日志级别
function parseLogLevel(args) {
  const levelFlags = ['-v', '-vv', '-vvv'];

  for (let i = 0; i < levelFlags.length; i++) {
    const flag = levelFlags[i];
    if (args.includes(flag)) {
      return i + 1; // 返回对应的日志级别
    }
  }

  return 0; // 默认日志级别
}
