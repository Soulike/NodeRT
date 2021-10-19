# 特殊说明

为了优化检测速度，在 `AsyncCalledFunctionInfo` 类中存在一个域 `hasWriteOperation`。在编写 Store 的 `appendOperation` 时要记得设置。