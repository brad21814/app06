"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Tabs
                value={view}
                onValueChange={(val) => {
                    if (val === "account") {
                        updateQuery({ view: "account", userId: null });
                    } else if (val === "personal") {
                        updateQuery({ view: "personal", userId: null });
                    } else {
                        updateQuery({ view: "user" });
                    }
                }}
                className="w-full sm:w-auto"
            >
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="user">Specific User</TabsTrigger>
                </TabsList>
            </Tabs>

            {view === "user" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                        value={targetUserId}
                        onValueChange={(val) => updateQuery({ userId: val })}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users
                                .filter((u) => u.id !== currentUserId)
                                .map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name || u.email}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
