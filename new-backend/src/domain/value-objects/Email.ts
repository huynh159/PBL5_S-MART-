export class Email {
    public readonly value: string;

    constructor(value: string) {
        if (!value || !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
            throw new Error("Email không hợp lệ");
        }
        this.value = value;
    }

    public equals(other: Email): boolean {
        return this.value === other.value;
    }
}
