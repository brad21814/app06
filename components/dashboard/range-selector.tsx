'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RangeSelector({ defaultValue = '90' }: { defaultValue?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentValue = searchParams.get('range') || defaultValue;

    return (
        <Select value={currentValue} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
            </SelectContent>
        </Select>
    );
}
