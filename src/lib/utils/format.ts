import { format } from 'date-fns'

export const formatDate = (date: Date | null | undefined): string => {
    if (!date) return ''
    return format(new Date(date), 'MMM d, yyyy')
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount)
}
