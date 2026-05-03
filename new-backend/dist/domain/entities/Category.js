"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
class Category {
    name;
    id;
    parent = null;
    children = [];
    constructor(name) {
        this.name = name;
        this.id = crypto.randomUUID();
    }
    addChild(child) {
        if (child === this) {
            throw new Error("Không thể tự gán chính nó làm cha (Self parent)");
        }
        if (this.isAncestorOf(child)) {
            throw new Error("Phát hiện chu trình (Cycle detected) trong cây danh mục");
        }
        child.parent = this;
        this.children.push(child);
    }
    isAncestorOf(node) {
        let p = this.parent;
        while (p !== null) {
            if (p === node)
                return true;
            p = p.parent;
        }
        return false;
    }
    getChildren() {
        return Object.freeze([...this.children]);
    }
    getParent() {
        return this.parent;
    }
}
exports.Category = Category;
//# sourceMappingURL=Category.js.map