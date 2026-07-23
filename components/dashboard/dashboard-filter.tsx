"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "@/types/firestore";

interface DashboardFilterProps {
    users: User[];
    currentUserId: string;
}

export function DashboardFilter({ users, currentUserId }: DashboardFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const view = searchParams.get("view") || "account";
    const targetUserId = searchParams.get("userId") || "";

    const selectedValue = view === "user" ? `user:${targetUserId}` : view;

    const updateQuery = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`?${params.toString()}`);
    };

    return (
        <Select
            value={selectedValue}
            onValueChange={(val) => {
                if (val === "account") {
                    updateQuery({ view: "account", userId: null });
                } else if (val === "personal") {
                    updateQuery({ view: "personal", userId: null });
                } else if (val.startsWith("user:")) {
                    const userId = val.split(":")[1];
                    updateQuery({ view: "user", userId });
                }
            }}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select scope..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="personal">You</SelectItem>
                {users
                    .filter((u) => u.id !== currentUserId)
                    .map((u) => (
                        <SelectItem key={u.id} value={`user:${u.id}`}>
                            {u.name || u.email}
                        </SelectItem>
                    ))}
            </SelectContent>
        </Select>
    );
}
