export class PhoneNumber {
    public readonly value: string;

    constructor(value: string) {
        // Chấp nhận chuỗi số từ 9 đến 15 ký tự
        if (!value || !/^\d{9,15}$/.test(value)) {
            throw new Error("Số điện thoại không hợp lệ");
        }
        this.value = value;
    }

    public equals(other: PhoneNumber): boolean {
        return this.value === other.value;
    }
}
