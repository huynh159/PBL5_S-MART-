export class Category {
    public readonly id: string;
    private parent: Category | null = null;
    private readonly children: Category[] = [];

    constructor(public name: string) {
        this.id = crypto.randomUUID();
    }

    public addChild(child: Category): void {
        if (child === this) {
            throw new Error("Không thể tự gán chính nó làm cha (Self parent)");
        }
        if (this.isAncestorOf(child)) {
            throw new Error("Phát hiện chu trình (Cycle detected) trong cây danh mục");
        }
        child.parent = this;
        this.children.push(child);
    }

    private isAncestorOf(node: Category): boolean {
        let p = this.parent;
        while (p !== null) {
            if (p === node) return true;
            p = p.parent;
        }
        return false;
    }

    public getChildren(): readonly Category[] {
        return Object.freeze([...this.children]);
    }

    public getParent(): Category | null {
        return this.parent;
    }
}
