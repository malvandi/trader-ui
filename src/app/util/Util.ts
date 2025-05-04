export class Util {
    public static convertToTrillionToman(billionRial: number): number {
        return billionRial / 10000;
    }

    public static formatDisplayValue(billionRial: number): string {
        const trillionValue = this.convertToTrillionToman(billionRial);

        if (trillionValue < 10)
            return trillionValue.toFixed(2);

        if (trillionValue < 100)
            return trillionValue.toFixed(1);

        if (trillionValue < 1000)
            return trillionValue.toFixed(0);

        return Number(trillionValue.toFixed(0)).toLocaleString().toString();
    }
}
