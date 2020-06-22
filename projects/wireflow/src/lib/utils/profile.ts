export function profile(msg: string, f: Function) {
    const now = performance.now();
    f();
    console.debug(msg, performance.now() - now);
}