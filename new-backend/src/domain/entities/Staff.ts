import { User, UserRole } from './User';
import { Email } from '../value-objects/Email';
import { ProductVariant } from './ProductVariant';
import { Order } from './Order';
import { Product } from './Product';

export class Staff extends User {
    private readonly staffCode: string;
    private position: string;
    private department: string;

    constructor(
        email: Email,
        passwordHash: string,
        fullName: string,
        staffCode: string,
        position: string,
        department: string
    ) {
        super(email, passwordHash, fullName, UserRole.STAFF);
        this.staffCode = staffCode;
        this.position = position;
        this.department = department;
    }

    public getStaffCode(): string {
        return this.staffCode;
    }

    public updatePosition(newPosition: string, newDepartment: string): void {
        this.position = newPosition;
        this.department = newDepartment;
    }

    public manageInventory(variant: ProductVariant, delta: number): void {
        if (delta >= 0) {
            variant.increaseStock(delta);
        } else {
            variant.decreaseStock(Math.abs(delta));
        }
    }

    public processOrder(order: Order, variantsRepo: ProductVariant[]): void {
        order.confirm(variantsRepo); // or move next state
    }

    public updateProduct(product: Product, desc: string): void {
        product.updateDescription(desc);
    }
}
