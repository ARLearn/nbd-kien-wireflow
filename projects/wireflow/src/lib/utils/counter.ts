export function counter(startFrom = 0) {
    let c = startFrom;
    return () => c++;
}