type PromiseTree = Promise<unknown> & { children: PromiseTree[], parent: PromiseTree };

export default PromiseTree;