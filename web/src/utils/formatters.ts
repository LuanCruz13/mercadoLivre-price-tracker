export function formatCurrency(value: number | null): string {
    if (value === null) return "R$ ---";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);

}