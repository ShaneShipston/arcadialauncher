export function elementIndex(node) {
    const parent = node.parentNode;
    const children = parent.children;
    let childrenCount;

    for (childrenCount = children.length - 1; childrenCount >= 0; childrenCount--) {
        if (node == children[childrenCount]) {
            break;
        }
    }

    return childrenCount;
}
